
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_DATA, NAV_ITEMS } from './constants';
import { 
  PCSData, 
  EntityType, 
  BaseEntity, 
  SensitiveSite, 
  Intervener, 
  Room, 
  Material, 
  DocumentResource,
  Crisis,
  CrisisLogEntry,
  MapDrawing,
  SystemLogEntry,
  IncomingAlert,
  User
} from './types';
import { geocodeAddress, calculateDistance } from './services/geoService';
import { analyzeRisk, generateImmediateActionSheet } from './services/geminiService';
import { uploadDocumentToServer } from './services/documentService';
import { StorageService } from './services/storageService'; 
import InteractiveMap from './components/InteractiveMap';
import Sidebar from './components/Sidebar';
import EntityFormModal from './components/EntityFormModal';
import EntityDetailsPanel from './components/EntityDetailsPanel';

import { 
  ChartPieSlice, 
  MapTrifold, 
  Users, 
  WarningOctagon, 
  HouseLine, 
  Package, 
  Files, 
  MagnifyingGlass,
  Plus,
  Trash,
  PencilSimple,
  Robot,
  Siren,
  IdentificationBadge,
  ShieldWarning,
  Key,
  User as UserIcon,
  UploadSimple,
  FilePdf,
  Eye,
  Spinner,
  PaperPlaneRight,
  Archive,
  X,
  BellRinging,
  SignOut,
  Plugs,
  FileText,
  DownloadSimple,
  MapPin,
  Clock,
  ListBullets
} from '@phosphor-icons/react';

// Declare html2pdf global
declare const html2pdf: any;

export const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<{username: string, role: string} | null>(null);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<PCSData>(INITIAL_DATA);
  const [selectedEntity, setSelectedEntity] = useState<BaseEntity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Crisis State
  const [activeCrisis, setActiveCrisis] = useState<Crisis | null>(null);
  const [newLogMessage, setNewLogMessage] = useState('');
  const [selectedArchivedCrisis, setSelectedArchivedCrisis] = useState<Crisis | null>(null);

  // Map State
  const [drawings, setDrawings] = useState<MapDrawing[]>([]);

  // Modals
  const [showNewEntityModal, setShowNewEntityModal] = useState(false);
  const [newEntityType, setNewEntityType] = useState<EntityType>(EntityType.INTERVENANT);
  const [modalInitialData, setModalInitialData] = useState<any>({}); // Data passed to modal for edit

  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentResource | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<User>({ username: '', password: '', role: 'Viewer' });
  const [userActionError, setUserActionError] = useState<string | null>(null);

  // Simple Form Data for non-entity forms (Crisis start)
  const [simpleFormData, setSimpleFormData] = useState<any>({});

  // Document Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION ---
  const loadData = async () => {
      setServerStatus('checking');
      setIsLoading(true);
      try {
          const result = await StorageService.loadFullState();
          setData(result.data);
          setActiveCrisis(result.activeCrisis);
          setDrawings(result.data.drawings || []);
          setServerStatus('connected');
      } catch (e) {
          console.error(e);
          setServerStatus('disconnected');
      } finally {
          setIsLoading(false);
      }
  };

  const loadUsers = async () => {
      try {
          const users = await StorageService.getUsers();
          setUsersList(users);
      } catch (e) {
          console.error("Could not load users", e);
      }
  };

  useEffect(() => {
      if (isAuthenticated) {
          loadData();
      }
  }, [isAuthenticated]);

  useEffect(() => {
      if (isAuthenticated && activeTab === 'users') {
          loadUsers();
      }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
      if (isAuthenticated && serverStatus === 'connected') {
          const timeoutId = setTimeout(() => {
              const dataToSave = { ...data, drawings };
              StorageService.saveFullState(dataToSave, activeCrisis).catch(() => {
                  setServerStatus('disconnected');
              });
          }, 2000); 
          return () => clearTimeout(timeoutId);
      }
  }, [data, activeCrisis, drawings, isAuthenticated]);

  // --- AUTH HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
        const response = await StorageService.login(username, password);
        if (response.success) {
            setIsAuthenticated(true);
            setCurrentUser(response.user || { username, role: 'User' });
        } else {
            setLoginError(response.error || 'Erreur de connexion');
        }
    } catch (error: any) {
        setLoginError(error.message || 'Erreur serveur');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
      setCurrentUser(null);
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setUserActionError(null);
      if (!newUser.username || !newUser.password) return;
      
      setIsLoading(true);
      try {
          await StorageService.createUser(newUser);
          await loadUsers();
          setNewUser({ username: '', password: '', role: 'Viewer' });
          alert("Utilisateur créé avec succès !");
      } catch (e: any) {
          setUserActionError(e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
      if (!confirm(`Supprimer l'utilisateur ${usernameToDelete} ?`)) return;
      setUserActionError(null);
      try {
          await StorageService.deleteUser(usernameToDelete);
          await loadUsers();
      } catch (e: any) {
          alert("Erreur lors de la suppression : " + e.message);
      }
  };

  // --- CRUD HANDLERS ---
  const handleAddEntity = async (formData: any) => {
    setIsLoading(true);
    const isEdit = !!formData.id;

    if (newEntityType === EntityType.ALERT) {
        const processedAlert: IncomingAlert = {
            id: isEdit ? formData.id : Math.random().toString(36).substr(2, 9),
            source: formData.source,
            category: formData.category,
            severity: formData.severity,
            message: formData.message,
            receivedAt: isEdit ? new Date(formData.receivedAt) : new Date()
        };
        
        const newData = { ...data };
        if (isEdit) {
            newData.activeAlerts = newData.activeAlerts.map(a => a.id === processedAlert.id ? processedAlert : a);
        } else {
            newData.activeAlerts = [processedAlert, ...newData.activeAlerts];
        }

        const log: SystemLogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            message: `${isEdit ? 'Modification' : 'Ajout'} alerte: ${processedAlert.category} (${processedAlert.severity})`,
            category: 'ALERT'
        };
        newData.systemLogs.unshift(log);

        setData(newData);
        setShowNewEntityModal(false);
        setIsLoading(false);
        return;
    }

    // Geocoding
    let location = formData.location;
    if (!location && formData.address) {
        location = await geocodeAddress(formData.address);
    } else if (!location) {
        location = { lat: 45.764043, lng: 4.835659 }; 
    }

    const processedEntity: any = {
        ...formData,
        id: isEdit ? formData.id : Math.random().toString(36).substr(2, 9),
        type: newEntityType,
        location: location,
        hazards: Array.isArray(formData.hazards) ? formData.hazards : (formData.hazards ? formData.hazards.split(',').map((s: string) => s.trim()) : []),
        skills: Array.isArray(formData.skills) ? formData.skills : (formData.skills ? formData.skills.split(',').map((s: string) => s.trim()) : []),
        facilities: Array.isArray(formData.facilities) ? formData.facilities : (formData.facilities ? formData.facilities.split(',').map((s: string) => s.trim()) : []),
        population: formData.population ? parseInt(formData.population.toString()) : 0,
        capacity: formData.capacity ? parseInt(formData.capacity.toString()) : 0,
        seatedCapacity: formData.seatedCapacity ? parseInt(formData.seatedCapacity.toString()) : 0,
        quantity: formData.quantity ? parseInt(formData.quantity.toString()) : 0,
        hasKitchen: Boolean(formData.hasKitchen),
        hasHeating: Boolean(formData.hasHeating),
        available: isEdit ? Boolean(formData.available) : true
    };

    const newData = { ...data };
    const logMessage = isEdit 
        ? `Modification: ${processedEntity.name} (${newEntityType}) par ${currentUser?.username}`
        : `Nouvel ajout: ${processedEntity.name} (${newEntityType}) par ${currentUser?.username}`;

    if (newEntityType === EntityType.INTERVENANT) {
        if (isEdit) newData.interveners = newData.interveners.map(i => i.id === processedEntity.id ? processedEntity : i);
        else newData.interveners.push(processedEntity);
    }
    else if (newEntityType === EntityType.SITE_SENSIBLE) {
        if (isEdit) newData.sites = newData.sites.map(s => s.id === processedEntity.id ? processedEntity : s);
        else newData.sites.push(processedEntity);
    }
    else if (newEntityType === EntityType.SALLE) {
        if (isEdit) newData.rooms = newData.rooms.map(r => r.id === processedEntity.id ? processedEntity : r);
        else newData.rooms.push(processedEntity);
    }
    else if (newEntityType === EntityType.MATERIEL) {
        if (isEdit) newData.materials = newData.materials.map(m => m.id === processedEntity.id ? processedEntity : m);
        else newData.materials.push(processedEntity);
    }
    
    const log: SystemLogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        message: logMessage,
        category: 'DATA',
        entityType: newEntityType
    };
    newData.systemLogs.unshift(log);

    setData(newData);
    setShowNewEntityModal(false);
    setIsLoading(false);
    
    // If editing, update the selected entity in view so changes are reflected immediately
    if (isEdit && selectedEntity && selectedEntity.id === processedEntity.id) {
        setSelectedEntity(processedEntity);
    }
  };

  const handleEditTrigger = (entity: any) => {
      if (entity.source && entity.severity) {
           setModalInitialData(entity);
           setNewEntityType(EntityType.ALERT);
           setShowNewEntityModal(true);
           return;
      }

      // Copy data to avoid direct mutation during editing
      const formValues: any = { ...entity };
      
      // Helper to flatten arrays to comma strings for inputs
      if (entity.type === EntityType.INTERVENANT) {
          const i = entity as Intervener;
          if (Array.isArray(i.skills)) formValues.skills = i.skills.join(', ');
      } else if (entity.type === EntityType.SITE_SENSIBLE) {
          const s = entity as SensitiveSite;
          if (Array.isArray(s.hazards)) formValues.hazards = s.hazards.join(', ');
      } else if (entity.type === EntityType.SALLE) {
          const r = entity as Room;
          if (Array.isArray(r.facilities)) formValues.facilities = r.facilities.join(', ');
      }

      setModalInitialData(formValues);
      setNewEntityType(entity.type);
      setShowNewEntityModal(true);
  };

  const handleDeleteEntity = (entity: any) => {
      const name = entity.name || entity.source + ' Alert';
      if(!confirm(`Supprimer ${name} ?`)) return;

      const newData = { ...data };
      
      if (entity.type === EntityType.INTERVENANT) newData.interveners = newData.interveners.filter(i => i.id !== entity.id);
      else if (entity.type === EntityType.SITE_SENSIBLE) newData.sites = newData.sites.filter(s => s.id !== entity.id);
      else if (entity.type === EntityType.SALLE) newData.rooms = newData.rooms.filter(r => r.id !== entity.id);
      else if (entity.type === EntityType.MATERIEL) newData.materials = newData.materials.filter(m => m.id !== entity.id);
      else if (entity.source) newData.activeAlerts = newData.activeAlerts.filter(a => a.id !== entity.id);

      setData(newData);
      setSelectedEntity(null); // Close detail panel on delete
  };

  // --- CRISIS HANDLERS ---
  const startCrisis = async () => {
     setIsLoading(true);
     const location = await geocodeAddress(simpleFormData.address || 'Mairie');
     
     // Ensure type has a fallback to prevent undefined errors
     const safeType = simpleFormData.type || 'Incident';
     const safeTitle = simpleFormData.title || 'Alerte Générale';

     const newCrisis: Crisis = {
         id: Math.random().toString(36).substr(2, 9),
         isActive: true,
         title: safeTitle,
         type: safeType,
         level: simpleFormData.level || 'Jaune',
         address: simpleFormData.address || 'Mairie',
         location: location,
         radius: parseInt(simpleFormData.radius) || 500,
         startedAt: new Date(),
         logs: [{ id: 'l1', timestamp: new Date(), message: 'Déclenchement Plan Communal de Sauvegarde', type: 'INFO' }]
     };
     
     setActiveCrisis(newCrisis);
     setShowCrisisModal(false);
     setIsLoading(false);
     setActiveTab('crisis');

     // Auto-generate after start
     handleManualActionSheetGeneration(newCrisis);
  };

  const stopCrisis = async () => {
      if (!activeCrisis) return;
      if(!confirm("Clôturer la crise en cours ? Cela archivera l'événement.")) return;
      
      // Create a closed crisis object ensuring isActive is false
      const closedCrisis: Crisis = { 
          ...activeCrisis, 
          isActive: false, 
          endedAt: new Date() 
      };
      
      // Update history with the CLOSED crisis
      const newData = { 
          ...data, 
          crisisHistory: [closedCrisis, ...(data.crisisHistory || [])] 
      };
      
      setData(newData);
      setActiveCrisis(null);
      setAiResponse(null);
      
      try {
          // Save updated state to backend
          await StorageService.saveFullState({ ...newData, drawings }, null);
          setActiveTab('archives'); 
      } catch (e) {
          console.error("Error saving stopped crisis", e);
          alert("Erreur de sauvegarde lors de la clôture.");
      }
  };

  const addCrisisLog = () => {
      if (!activeCrisis || !newLogMessage) return;
      const log: CrisisLogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          message: newLogMessage,
          type: 'EVOLUTION'
      };
      const updatedCrisis = { ...activeCrisis, logs: [log, ...activeCrisis.logs] };
      setActiveCrisis(updatedCrisis);
      setNewLogMessage('');
  };

  // --- DOCUMENT HANDLERS ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsLoading(true);
          try {
              const uploadedDoc = await uploadDocumentToServer(file, 'Uploads', file.name);
              const newData = { ...data, documents: [...data.documents, uploadedDoc] };
              setData(newData);
          } catch (err: any) {
              alert("Erreur upload: " + err.message);
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleDownloadDoc = (doc: DocumentResource) => {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- AI HANDLERS ---
  const handleManualActionSheetGeneration = async (crisisOverride?: Crisis) => {
      const crisisToUse = crisisOverride || activeCrisis;
      if (!crisisToUse) return;
      
      setIsAiLoading(true);
      setAiResponse(null);
      
      try {
          // Safely filter sites
          let impactedSites: SensitiveSite[] = [];
          try {
              if (data.sites && Array.isArray(data.sites)) {
                   impactedSites = data.sites.filter(s => {
                       if (!s.location || !crisisToUse.location) return false;
                       return calculateDistance(crisisToUse.location, s.location) * 1000 <= crisisToUse.radius;
                   });
              }
          } catch (err) {
              console.warn("Error filtering sites for AI context", err);
              // Continue without sites if filter fails
          }
          
          // Provide fallback strings to prevent undefined errors in geminiService
          const safeType = crisisToUse.type || 'Incident';
          const safeAddress = crisisToUse.address || 'Lieu non précisé';
          const safeRadius = crisisToUse.radius || 500;

          const result = await generateImmediateActionSheet(
              safeType, 
              safeAddress, 
              safeRadius, 
              impactedSites
          );
          setAiResponse(result);
          
          // Update crisis state with analysis
          setActiveCrisis(prev => {
              if (prev && prev.id === crisisToUse.id) {
                  return { ...prev, aiAnalysis: result };
              }
              return prev;
          });
          
      } catch (e: any) {
          console.error("AI Gen Error in App:", e);
          setAiResponse(`Erreur : ${e.message || "Problème inconnu"}. Veuillez réessayer.`);
      } finally {
          setIsAiLoading(false);
      }
  };

  // --- PDF ---
  const generateSitePdf = () => {
      const element = document.getElementById('site-detail-content');
      if (!element || !selectedEntity) return;
      const opt = {
        margin: 0.5,
        filename: `Fiche_Site_${selectedEntity.name.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
  };

  const renderEntityList = (entities: BaseEntity[], type: EntityType) => {
    const filtered = entities.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(entity => (
                <div key={entity.id} 
                     onClick={() => setSelectedEntity(entity)}
                     className="bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg group overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                                type === EntityType.SITE_SENSIBLE ? 'bg-red-500/20 text-red-400' : 
                                type === EntityType.INTERVENANT ? 'bg-blue-500/20 text-blue-400' :
                                type === EntityType.MATERIEL ? 'bg-amber-500/20 text-amber-400' : 
                                'bg-green-500/20 text-green-400'
                            }`}>
                                {type === EntityType.SITE_SENSIBLE && <WarningOctagon size={24} />}
                                {type === EntityType.INTERVENANT && <Users size={24} />}
                                {type === EntityType.MATERIEL && <Package size={24} />}
                                {type === EntityType.SALLE && <HouseLine size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white leading-tight">{entity.name}</h3>
                                {type === EntityType.INTERVENANT && <p className="text-xs text-blue-400 font-medium">{(entity as Intervener).role}</p>}
                                {type === EntityType.MATERIEL && <p className="text-xs text-amber-400 font-medium">{(entity as Material).category}</p>}
                                {type === EntityType.SITE_SENSIBLE && <p className="text-xs text-red-400 font-medium">{(entity as SensitiveSite).riskLevel}</p>}
                            </div>
                        </div>
                    </div>
                    {/* Summary Body */}
                    <div className="px-4 py-3 bg-slate-800">
                         {type === EntityType.INTERVENANT && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 truncate max-w-[60%]">{(entity as Intervener).organization}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    (entity as Intervener).available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                    {(entity as Intervener).available ? 'DISPONIBLE' : 'INDISPO'}
                                </span>
                            </div>
                         )}

                         {type === EntityType.SITE_SENSIBLE && (
                             <div className="space-y-1.5">
                                 <div className="flex justify-between items-center text-xs">
                                     <span className="text-slate-400">Population:</span>
                                     <span className="text-slate-200 font-bold">{(entity as SensitiveSite).population}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs">
                                     <span className="text-slate-400">Priorité:</span>
                                     <span className={`font-bold ${(entity as SensitiveSite).priority === 'P1' ? 'text-red-400' : 'text-slate-300'}`}>{(entity as SensitiveSite).priority}</span>
                                 </div>
                             </div>
                         )}

                         {type === EntityType.SALLE && (
                             <div className="space-y-1.5">
                                 <div className="flex justify-between items-center text-xs">
                                     <span className="text-slate-400">Capacité:</span>
                                     <span className="text-white font-bold">{(entity as Room).capacity}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Statut:</span>
                                    <span className={`font-bold ${(entity as Room).isOccupied ? 'text-red-400' : 'text-green-400'}`}>
                                        {(entity as Room).isOccupied ? 'OCCUPÉ' : 'LIBRE'}
                                    </span>
                                 </div>
                             </div>
                         )}

                         {type === EntityType.MATERIEL && (
                             <div className="flex justify-between items-center">
                                 <div className="text-xs text-slate-400">
                                     État: <span className={`font-bold ${(entity as Material).condition === 'New' || (entity as Material).condition === 'Good' ? 'text-green-400' : 'text-orange-400'}`}>{(entity as Material).condition}</span>
                                 </div>
                                 <div className="text-xs font-bold bg-slate-700 px-2 py-0.5 rounded text-white">
                                     Qté: {(entity as Material).quantity}
                                 </div>
                             </div>
                         )}
                    </div>
                </div>
            ))}
            <div 
                onClick={() => { setNewEntityType(type); setModalInitialData({}); setShowNewEntityModal(true); }}
                className="border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center p-6 text-slate-500 hover:text-blue-400 hover:border-blue-400 hover:bg-slate-800/50 cursor-pointer transition-all min-h-[140px] group">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">
                     <Plus size={24} />
                </div>
                <span className="mt-3 font-medium text-sm">Ajouter {type}</span>
            </div>
        </div>
    );
  };

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                          <ShieldWarning size={32} className="text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-white">PCS Command AI</h1>
                      <p className="text-slate-400 text-sm mt-2">Système de Gestion de Crise Communal</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Identifiant</label>
                          <div className="relative">
                              <UserIcon className="absolute left-3 top-3 text-slate-500" size={20} />
                              <input 
                                type="text" 
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                placeholder="ex: admin"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Mot de passe</label>
                          <div className="relative">
                              <Key className="absolute left-3 top-3 text-slate-500" size={20} />
                              <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                              />
                          </div>
                      </div>
                      {loginError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                              <WarningOctagon size={20} />
                              {loginError}
                          </div>
                      )}
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? <Spinner className="animate-spin" size={20} /> : <SignOut size={20} />}
                        Connexion Sécurisée
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeCrisis={activeCrisis} 
        currentUser={currentUser}
        serverStatus={serverStatus}
        onLogout={handleLogout}
        onRetryConnection={loadData}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
          <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur flex items-center justify-between px-6 flex-shrink-0 z-10">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  {activeTab === 'dashboard' && <ChartPieSlice size={24} className="text-blue-500" />}
                  {activeTab === 'map' && <MapTrifold size={24} className="text-purple-500" />}
                  {activeTab === 'crisis' && <Siren size={24} className="text-red-500" />}
                  {activeTab === 'users' && <IdentificationBadge size={24} className="text-green-500" />}
                  {activeTab === 'archives' && <Archive size={24} className="text-slate-400" />}
                  {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h2>

              <div className="flex items-center gap-4">
                  {activeTab !== 'dashboard' && activeTab !== 'map' && activeTab !== 'crisis' && activeTab !== 'users' && activeTab !== 'archives' && (
                      <div className="relative hidden md:block">
                          <MagnifyingGlass className="absolute left-3 top-2.5 text-slate-500" size={16} />
                          <input 
                            type="text" 
                            placeholder="Rechercher..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-full py-2 pl-9 pr-4 text-sm text-slate-200 focus:border-blue-500 outline-none w-64"
                          />
                      </div>
                  )}
                  
                  {!activeCrisis ? (
                      <button 
                        onClick={() => { setSimpleFormData({ level: 'Vigilance', radius: 500 }); setShowCrisisModal(true); }}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all flex items-center gap-2 animate-pulse-slow">
                          <Siren size={18} weight="fill" />
                          DÉCLENCHER PCS
                      </button>
                  ) : (
                       <div className="flex items-center gap-2 bg-red-950 border border-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm font-bold">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                          CRISE EN COURS: {activeCrisis.level}
                       </div>
                  )}
              </div>
          </header>

          <div id="printable-dashboard" className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
              {serverStatus === 'disconnected' && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
                      <div className="bg-slate-900 border border-red-900 p-8 rounded-2xl shadow-2xl text-center max-w-md">
                          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Plugs size={32} className="text-red-500" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Serveur Injoignable</h3>
                          <button onClick={() => loadData()} className="bg-white text-slate-900 font-bold px-6 py-3 rounded-lg mt-4">
                              Réessayer la connexion
                          </button>
                      </div>
                  </div>
              )}

              {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                              <div><p className="text-slate-400 text-xs font-bold uppercase">Intervenants</p><p className="text-2xl font-bold text-white">{data.interveners.length}</p></div>
                              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500"><Users size={24} /></div>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                              <div><p className="text-slate-400 text-xs font-bold uppercase">Sites Sensibles</p><p className="text-2xl font-bold text-white">{data.sites.length}</p></div>
                              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500"><WarningOctagon size={24} /></div>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                              <div><p className="text-slate-400 text-xs font-bold uppercase">Salles</p><p className="text-2xl font-bold text-white">{data.rooms.length}</p></div>
                              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500"><HouseLine size={24} /></div>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                              <div><p className="text-slate-400 text-xs font-bold uppercase">Matériel</p><p className="text-2xl font-bold text-white">{data.materials.length}</p></div>
                              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500"><Package size={24} /></div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-1 overflow-hidden h-full flex flex-col">
                              <div className="h-full w-full rounded-lg overflow-hidden relative">
                                  <InteractiveMap 
                                    entities={[...data.sites, ...data.interveners]} 
                                    onEntitySelect={setSelectedEntity} 
                                    crisis={activeCrisis}
                                    drawings={drawings}
                                  />
                                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-slate-700 pointer-events-none">
                                      VUE D'ENSEMBLE
                                  </div>
                              </div>
                          </div>

                          <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden">
                              <div className="p-4 border-b border-slate-700 font-bold flex items-center justify-between">
                                  <div className="flex items-center gap-2"><BellRinging size={20} className="text-orange-500"/>Fil d'Actualité</div>
                                  <button onClick={() => { setNewEntityType(EntityType.ALERT); setModalInitialData({}); setShowNewEntityModal(true); }} className="p-1 bg-slate-700 rounded text-xs flex items-center gap-1"><Plus size={14}/> Ajouter</button>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                  {data.activeAlerts.map(alert => (
                                      <div key={alert.id} className="relative group bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                                          <div className="flex justify-between items-start mb-1">
                                              <span className="text-xs font-bold uppercase px-1.5 rounded bg-orange-500 text-white">{alert.source}</span>
                                          </div>
                                          <p className="text-sm text-slate-200 font-medium">{alert.message}</p>
                                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => handleDeleteEntity(alert)} className="p-1 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded"><Trash size={14}/></button>
                                              <button onClick={() => handleEditTrigger(alert)} className="p-1 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded"><PencilSimple size={14}/></button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'map' && (
                  <div className="h-[calc(100vh-8rem)] bg-slate-800 rounded-xl border border-slate-700 p-1 relative">
                      <InteractiveMap 
                        entities={[...data.sites, ...data.interveners, ...data.rooms, ...data.materials]} 
                        onEntitySelect={setSelectedEntity}
                        crisis={activeCrisis}
                        drawings={drawings}
                        onDrawingsChange={(newDrawings) => setDrawings(newDrawings)}
                      />
                  </div>
              )}

              {activeTab === 'interveners' && renderEntityList(data.interveners, EntityType.INTERVENANT)}
              {activeTab === 'sites' && renderEntityList(data.sites, EntityType.SITE_SENSIBLE)}
              {activeTab === 'rooms' && renderEntityList(data.rooms, EntityType.SALLE)}
              {activeTab === 'materials' && renderEntityList(data.materials, EntityType.MATERIEL)}

              {activeTab === 'documents' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {data.documents.map(doc => (
                              <div key={doc.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-start gap-4">
                                  <div className="p-3 bg-slate-900 rounded-lg text-slate-400"><FilePdf size={32} /></div>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-white truncate">{doc.title}</h4>
                                      <div className="flex gap-2 mt-3">
                                          <button onClick={() => setPreviewDoc(doc)} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-200 flex items-center gap-1 transition-colors"><Eye /> Aperçu</button>
                                          <button onClick={() => handleDownloadDoc(doc)} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-200 flex items-center gap-1 transition-colors"><DownloadSimple /> Télécharger</button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center p-8 text-slate-500 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.jpg,.png,.doc,.docx" />
                          <UploadSimple size={32} className="mb-4" />
                          <h3 className="font-bold text-lg">Déposer un document</h3>
                      </div>
                  </div>
              )}
              
              {activeTab === 'users' && (
                  <div className="max-w-5xl mx-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* User List */}
                          <div className="lg:col-span-2 space-y-4">
                              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                                  <Users size={24} className="text-blue-400"/>
                                  Utilisateurs Enregistrés ({usersList.length})
                              </h3>
                              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                  <table className="w-full text-left text-sm">
                                      <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase">
                                          <tr>
                                              <th className="p-4">Utilisateur</th>
                                              <th className="p-4">Rôle</th>
                                              <th className="p-4 text-right">Actions</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-700">
                                          {usersList.map(u => (
                                              <tr key={u.username} className="hover:bg-slate-700/30 transition-colors">
                                                  <td className="p-4 font-bold text-white flex items-center gap-3">
                                                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                                          <UserIcon weight="fill" />
                                                      </div>
                                                      {u.username}
                                                  </td>
                                                  <td className="p-4">
                                                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                          u.role === 'DOS' ? 'bg-red-500/20 text-red-400' :
                                                          u.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' :
                                                          'bg-slate-600/20 text-slate-400'
                                                      }`}>
                                                          {u.role}
                                                      </span>
                                                  </td>
                                                  <td className="p-4 text-right">
                                                      {u.username !== currentUser?.username && (
                                                          <button 
                                                              onClick={() => handleDeleteUser(u.username)}
                                                              className="text-slate-500 hover:text-red-400 p-2 hover:bg-slate-700 rounded transition-colors"
                                                              title="Supprimer"
                                                          >
                                                              <Trash size={18} />
                                                          </button>
                                                      )}
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>

                          {/* Add User Form */}
                          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                              <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                                  <IdentificationBadge size={24} className="text-green-400"/>
                                  Créer un compte
                              </h3>
                              <form onSubmit={handleCreateUser} className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Identifiant</label>
                                      <input 
                                          type="text"
                                          required
                                          value={newUser.username}
                                          onChange={e => setNewUser({...newUser, username: e.target.value})}
                                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                          placeholder="Nom d'utilisateur"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mot de passe</label>
                                      <input 
                                          type="password"
                                          required
                                          value={newUser.password}
                                          onChange={e => setNewUser({...newUser, password: e.target.value})}
                                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                          placeholder="••••••"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rôle</label>
                                      <select 
                                          value={newUser.role}
                                          onChange={e => setNewUser({...newUser, role: e.target.value})}
                                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                      >
                                          <option value="Viewer">Viewer (Lecture seule)</option>
                                          <option value="User">User (Édition)</option>
                                          <option value="Admin">Admin</option>
                                          <option value="DOS">DOS (Directeur Opérations)</option>
                                      </select>
                                  </div>
                                  
                                  {userActionError && (
                                      <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">
                                          {userActionError}
                                      </div>
                                  )}

                                  <button 
                                      type="submit"
                                      disabled={isLoading}
                                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg mt-2 flex justify-center items-center gap-2 transition-colors"
                                  >
                                      {isLoading ? <Spinner className="animate-spin" /> : <Plus size={18} weight="bold" />}
                                      Créer l'utilisateur
                                  </button>
                              </form>
                          </div>
                      </div>
                  </div>
              )}
              
              {activeTab === 'archives' && (
                  <div className="space-y-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                          <Archive size={24} className="text-slate-400"/>
                          Historique des Crises
                      </h3>
                      {(!data.crisisHistory || data.crisisHistory.length === 0) ? (
                          <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
                              <Archive size={48} className="mx-auto mb-4 opacity-20"/>
                              <p>Aucune crise archivée dans l'historique.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 gap-4">
                              {data.crisisHistory.map((crisis) => (
                                  <div 
                                    key={crisis.id} 
                                    onClick={() => setSelectedArchivedCrisis(crisis)}
                                    className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col md:flex-row justify-between gap-6 hover:border-blue-500 cursor-pointer transition-all shadow-sm hover:shadow-lg group"
                                  >
                                      <div>
                                          <div className="flex items-center gap-3 mb-2">
                                              <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded">{crisis.type}</span>
                                              <span className="text-slate-500 text-xs">{new Date(crisis.startedAt).toLocaleDateString()}</span>
                                          </div>
                                          <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{crisis.title}</h4>
                                          <p className="text-slate-400 text-sm mb-4"><MapPin className="inline mr-1"/> {crisis.address}</p>
                                          <div className="flex items-center gap-4 text-sm text-slate-500">
                                              <span>Durée: {crisis.endedAt ? Math.round((new Date(crisis.endedAt).getTime() - new Date(crisis.startedAt).getTime()) / (1000 * 60 * 60)) + ' heures' : 'En cours'}</span>
                                              <span>•</span>
                                              <span>{crisis.logs.length} entrées journal</span>
                                          </div>
                                      </div>
                                      <div className="flex flex-col justify-center items-end min-w-[200px]">
                                          <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                                              crisis.level === 'Rouge' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                              'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                          }`}>
                                              Niveau {crisis.level}
                                          </div>
                                          <span className="text-xs text-slate-600 mt-2 italic">Cliquez pour voir le rapport</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'crisis' && (
                  <div className="space-y-6">
                      {!activeCrisis ? (
                          <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                              <ShieldWarning size={64} className="mb-4 opacity-20" />
                              <h3 className="text-xl font-bold text-slate-400">Système en Veille</h3>
                              <p>Aucune situation d'urgence active.</p>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="bg-gradient-to-br from-red-900/40 to-slate-900 border border-red-500/30 rounded-xl p-6 relative overflow-hidden">
                                  <div className="relative z-10 flex justify-between items-start">
                                      <div>
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">EN COURS</span>
                                          </div>
                                          <h1 className="text-3xl font-bold text-white mb-2">{activeCrisis.title}</h1>
                                      </div>
                                      <button onClick={stopCrisis} className="bg-slate-900/80 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Archive size={18} /> Clôturer</button>
                                  </div>
                              </div>

                              <div className="h-[400px] bg-slate-800 rounded-xl border border-slate-700 p-1 overflow-hidden relative">
                                  <InteractiveMap 
                                      entities={[...data.sites, ...data.interveners, ...data.rooms, ...data.materials]} 
                                      onEntitySelect={setSelectedEntity}
                                      crisis={activeCrisis}
                                      drawings={drawings}
                                      onDrawingsChange={(newDrawings) => setDrawings(newDrawings)}
                                  />
                                  <div className="absolute top-4 left-14 bg-slate-900/80 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-slate-700 pointer-events-none z-[400] text-white">
                                      SITUATION TACTIQUE
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
                                          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FileText className="text-blue-400" /> Main Courante</h3>
                                          <div className="space-y-6 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                              {activeCrisis.logs.map((log, idx) => (
                                                  <div key={log.id} className="flex gap-4 relative group">
                                                      <div className="flex flex-col items-center">
                                                          <div className={`w-3 h-3 rounded-full z-10 ${log.type === 'DECISION' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                                          {idx !== activeCrisis.logs.length - 1 && <div className="w-px bg-slate-700 flex-1 my-1"></div>}
                                                      </div>
                                                      <div className="pb-2 flex-1">
                                                          <div className="flex justify-between items-start mb-1"><span className="text-slate-500 text-xs font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                                                          <p className="text-slate-200 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">{log.message}</p>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                          <div className="flex gap-2">
                                              <input type="text" value={newLogMessage} onChange={e => setNewLogMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCrisisLog()} placeholder="Ajouter une entrée..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none"/>
                                              <button onClick={addCrisisLog} className="bg-blue-600 text-white px-4 rounded-lg"><PaperPlaneRight size={24} /></button>
                                          </div>
                                  </div>

                                  <div className="space-y-6">
                                      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                          <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-slate-700 flex items-center gap-2">
                                              <Robot className="text-purple-400" size={24} />
                                              <h3 className="font-bold text-white">Assistant IA</h3>
                                          </div>
                                          <div className="p-4 space-y-3">
                                              <button onClick={() => handleManualActionSheetGeneration(activeCrisis)} disabled={isAiLoading} className="w-full text-left bg-slate-900 hover:bg-slate-700 p-3 rounded-lg text-sm border border-slate-700 transition-colors font-bold text-slate-200">
                                                  {isAiLoading ? <Spinner className="animate-spin"/> : <FileText/>} Générer Fiche Réflexe
                                              </button>
                                          </div>
                                          {(aiResponse || activeCrisis.aiAnalysis) && (
                                              <div className="border-t border-slate-700 bg-slate-950 p-4 max-h-[300px] overflow-y-auto text-xs font-mono text-slate-300 whitespace-pre-wrap">
                                                  {aiResponse || activeCrisis.aiAnalysis}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </main>

      {/* Detail Panel (Re-integrated) */}
      <EntityDetailsPanel 
        entity={selectedEntity} 
        onClose={() => setSelectedEntity(null)} 
        onEdit={handleEditTrigger} 
        onDelete={handleDeleteEntity}
        onPrint={generateSitePdf}
      />

      <EntityFormModal 
        isOpen={showNewEntityModal}
        onClose={() => setShowNewEntityModal(false)}
        onSubmit={handleAddEntity}
        entityType={newEntityType}
        initialData={modalInitialData}
        isLoading={isLoading}
      />

      {/* Crisis Start Modal */}
      {showCrisisModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Déclencher Plan Communal</h2>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Intitulé de la crise</label>
                          <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" value={simpleFormData.title || ''} onChange={e => setSimpleFormData({...simpleFormData, title: e.target.value})} placeholder="ex: Incendie Usine Nord"/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label>
                          <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" value={simpleFormData.type || ''} onChange={e => setSimpleFormData({...simpleFormData, type: e.target.value})} placeholder="ex: Incendie, Inondation"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Niveau</label>
                              <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" value={simpleFormData.level || 'Jaune'} onChange={e => setSimpleFormData({...simpleFormData, level: e.target.value})}>
                                  <option value="Vigilance">Vigilance</option>
                                  <option value="Jaune">Jaune</option>
                                  <option value="Orange">Orange</option>
                                  <option value="Rouge">Rouge</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rayon (m)</label>
                              <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" value={simpleFormData.radius || 500} onChange={e => setSimpleFormData({...simpleFormData, radius: e.target.value})}/>
                           </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Adresse Centre Opérations</label>
                          <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white" value={simpleFormData.address || ''} onChange={e => setSimpleFormData({...simpleFormData, address: e.target.value})} placeholder="ex: Mairie"/>
                      </div>
                      <button onClick={startCrisis} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-2 flex justify-center">
                          {isLoading ? <Spinner className="animate-spin"/> : 'ACTIVER LE P.C.S'}
                      </button>
                      <button onClick={() => setShowCrisisModal(false)} className="w-full text-slate-400 text-sm py-2">Annuler</button>
                  </div>
              </div>
          </div>
      )}

      {/* Document Preview Modal - FIXED: Added PDF support and explicit download button */}
      {previewDoc && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className="bg-slate-900 border border-slate-700 w-full h-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                      <h3 className="font-bold text-white">{previewDoc.title}</h3>
                      <div className="flex items-center gap-2">
                          <button onClick={() => handleDownloadDoc(previewDoc)} className="text-slate-200 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold">
                              <DownloadSimple size={18} />
                              Télécharger
                          </button>
                          <div className="w-px h-6 bg-slate-700 mx-2"></div>
                          <button onClick={() => setPreviewDoc(null)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                      </div>
                  </div>
                  <div className="flex-1 bg-slate-950 p-4 overflow-hidden relative flex items-center justify-center">
                       {previewDoc.mimeType?.startsWith('image/') ? (
                           <img src={previewDoc.url} alt={previewDoc.title} className="max-w-full max-h-full object-contain" />
                       ) : previewDoc.mimeType === 'application/pdf' ? (
                           <object data={previewDoc.url} type="application/pdf" className="w-full h-full rounded-lg border border-slate-800">
                               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                   <Files size={48} className="mb-4 opacity-50"/>
                                   <p className="mb-4">L'aperçu PDF n'est pas supporté par votre navigateur.</p>
                                   <button onClick={() => handleDownloadDoc(previewDoc)} className="text-blue-400 hover:underline font-bold">
                                       Cliquez ici pour télécharger le fichier
                                   </button>
                               </div>
                           </object>
                       ) : (
                           <div className="text-center text-slate-500">
                               <Files size={64} className="mx-auto mb-4 opacity-20"/>
                               <p>Aperçu non disponible pour ce format.</p>
                               <button onClick={() => handleDownloadDoc(previewDoc)} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 mx-auto">
                                  <DownloadSimple size={18} /> Télécharger le fichier
                               </button>
                           </div>
                       )}
                  </div>
              </div>
          </div>
      )}

      {/* ARCHIVE DETAILS MODAL */}
      {selectedArchivedCrisis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-white">{selectedArchivedCrisis.title}</h2>
                            <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded uppercase">Archivé</span>
                        </div>
                        <p className="text-slate-400 text-xs flex items-center gap-3">
                           <span className="flex items-center gap-1"><MapPin size={14}/> {selectedArchivedCrisis.address}</span>
                           <span className="flex items-center gap-1"><Clock size={14}/> {new Date(selectedArchivedCrisis.startedAt).toLocaleString()} - {selectedArchivedCrisis.endedAt ? new Date(selectedArchivedCrisis.endedAt).toLocaleString() : '?'}</span>
                        </p>
                    </div>
                    <button onClick={() => setSelectedArchivedCrisis(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Map & AI */}
                    <div className="space-y-6">
                        <div className="h-[300px] bg-slate-800 rounded-xl border border-slate-700 overflow-hidden relative p-1">
                            {/* Reuse InteractiveMap but passing the archived crisis to center/draw circle */}
                            <InteractiveMap 
                                entities={[...data.sites, ...data.rooms]}
                                onEntitySelect={() => {}}
                                crisis={{ ...selectedArchivedCrisis, isActive: true }}
                            />
                             <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-slate-700 pointer-events-none z-[400] text-white">
                                ZONE D'IMPACT HISTORIQUE
                            </div>
                        </div>

                        {selectedArchivedCrisis.aiAnalysis && (
                            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                <div className="p-3 bg-slate-900/50 border-b border-slate-700 font-bold text-white flex items-center gap-2">
                                    <Robot size={20} className="text-purple-400"/> Rapport IA Généré
                                </div>
                                <div className="p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {selectedArchivedCrisis.aiAnalysis}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Main Courante */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden min-h-[400px]">
                        <div className="p-4 bg-slate-900/50 border-b border-slate-700 font-bold text-white flex items-center gap-2">
                            <ListBullets size={20} className="text-blue-400"/> Main Courante ({selectedArchivedCrisis.logs.length} entrées)
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {selectedArchivedCrisis.logs.map((log, idx) => (
                                <div key={log.id} className="flex gap-4 relative">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full z-10 mt-1.5 ${log.type === 'DECISION' ? 'bg-purple-500' : log.type === 'INFO' ? 'bg-slate-500' : 'bg-blue-500'}`}></div>
                                        {idx !== selectedArchivedCrisis.logs.length - 1 && <div className="w-px bg-slate-700 flex-1 my-1"></div>}
                                    </div>
                                    <div className="pb-2 flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-slate-500 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                log.type === 'DECISION' ? 'bg-purple-500/20 text-purple-400' : 
                                                log.type === 'INFO' ? 'bg-slate-500/20 text-slate-400' : 
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>{log.type}</span>
                                        </div>
                                        <p className="text-slate-200 text-sm bg-slate-900/30 p-3 rounded-lg border border-slate-700/30">{log.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
