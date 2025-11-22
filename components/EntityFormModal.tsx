
import React, { useState, useEffect } from 'react';
import { EntityType } from '../types';
import { Spinner } from '@phosphor-icons/react';

interface EntityFormModalProps {
    isOpen: boolean;
    entityType: EntityType;
    initialData?: any;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

const EntityFormModal: React.FC<EntityFormModalProps> = ({
    isOpen,
    entityType,
    initialData,
    onClose,
    onSubmit,
    isLoading
}) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-slate-700 flex-shrink-0">
                      <h2 className="text-xl font-bold text-white">{formData.id ? 'Modifier' : 'Ajouter'} {entityType === EntityType.ALERT ? 'Alerte' : entityType}</h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                      
                      {/* --- ALERT FORM --- */}
                      {entityType === EntityType.ALERT && (
                          <>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Source de l'alerte</label>
                                <input 
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.source || ''}
                                    onChange={e => setFormData({...formData, source: e.target.value})}
                                    placeholder="ex: Météo France, Préfecture"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.category || 'Météo'}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="Météo">Météo</option>
                                        <option value="Sécurité">Sécurité</option>
                                        <option value="Santé">Santé</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sévérité</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.severity || 'Info'}
                                        onChange={e => setFormData({...formData, severity: e.target.value})}
                                    >
                                        <option value="Info">Info</option>
                                        <option value="Jaune">Jaune</option>
                                        <option value="Orange">Orange</option>
                                        <option value="Rouge">Rouge</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Message</label>
                                <textarea 
                                    required
                                    rows={4}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.message || ''}
                                    onChange={e => setFormData({...formData, message: e.target.value})}
                                    placeholder="Description de l'alerte..."
                                />
                            </div>
                          </>
                      )}

                      {/* COMMON FIELDS FOR OTHER ENTITIES */}
                      {entityType !== EntityType.ALERT && (
                          <>
                              <div>
                                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nom</label>
                                  <input 
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="ex: Gymnase A"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Adresse</label>
                                  <input 
                                    required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.address || ''}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                    placeholder="ex: 10 Rue de la Paix"
                                  />
                              </div>
                          </>
                      )}
                      
                      {/* --- INTERVENANT FORM --- */}
                      {entityType === EntityType.INTERVENANT && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rôle</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.role || ''}
                                        onChange={e => setFormData({...formData, role: e.target.value})}
                                        placeholder="ex: Médecin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Organisation</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.organization || ''}
                                        onChange={e => setFormData({...formData, organization: e.target.value})}
                                        placeholder="ex: Croix-Rouge"
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Téléphone</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.phone || ''}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        placeholder="06 01..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                                    <input 
                                        type="email"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        placeholder="contact@..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Compétences (séparées par virgule)</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.skills || ''}
                                    onChange={e => setFormData({...formData, skills: e.target.value})}
                                    placeholder="ex: Secourisme, Permis PL, Anglais"
                                />
                            </div>
                            {formData.id && (
                                <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer pt-2">
                                    <input 
                                        type="checkbox"
                                        className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500"
                                        checked={formData.available ?? true}
                                        onChange={e => setFormData({...formData, available: e.target.checked})}
                                    />
                                    Disponible
                                </label>
                            )}
                          </>
                      )}

                       {/* --- SITE SENSIBLE FORM --- */}
                       {entityType === EntityType.SITE_SENSIBLE && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Niveau Risque</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.riskLevel || 'Medium'}
                                        onChange={e => setFormData({...formData, riskLevel: e.target.value})}
                                    >
                                        <option value="Low">Faible</option>
                                        <option value="Medium">Moyen</option>
                                        <option value="High">Élevé</option>
                                        <option value="Critical">Critique</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Population</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.population || ''}
                                        onChange={e => setFormData({...formData, population: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Risques (séparés par virgule)</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.hazards || ''}
                                    onChange={e => setFormData({...formData, hazards: e.target.value})}
                                    placeholder="ex: Inondation, Incendie"
                                />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nom Contact</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.contactName || ''}
                                        onChange={e => setFormData({...formData, contactName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tél Contact</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.contactPhone || ''}
                                        onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Instructions d'accès</label>
                                <textarea 
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.accessInstructions || ''}
                                    onChange={e => setFormData({...formData, accessInstructions: e.target.value})}
                                    placeholder="ex: Clé chez le gardien, digicode 1234"
                                />
                            </div>
                          </>
                      )}

                      {/* --- SALLE FORM --- */}
                      {entityType === EntityType.SALLE && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Capacité Totale</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.capacity || ''}
                                        onChange={e => setFormData({...formData, capacity: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Capacité Assise</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.seatedCapacity || ''}
                                        onChange={e => setFormData({...formData, seatedCapacity: e.target.value})}
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Gestionnaire</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.managerName || ''}
                                        onChange={e => setFormData({...formData, managerName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tél Gestionnaire</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.managerPhone || ''}
                                        onChange={e => setFormData({...formData, managerPhone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Équipements (séparés par virgule)</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.facilities || ''}
                                    onChange={e => setFormData({...formData, facilities: e.target.value})}
                                    placeholder="ex: Wifi, Sonorisation, Douches"
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500"
                                        checked={formData.hasKitchen || false}
                                        onChange={e => setFormData({...formData, hasKitchen: e.target.checked})}
                                    />
                                    Cuisine Disponible
                                </label>
                                <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500"
                                        checked={formData.hasHeating || false}
                                        onChange={e => setFormData({...formData, hasHeating: e.target.checked})}
                                    />
                                    Chauffage Fonctionnel
                                </label>
                            </div>
                          </>
                      )}

                      {/* --- MATERIEL FORM --- */}
                      {entityType === EntityType.MATERIEL && (
                          <>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantité</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                        value={formData.quantity || ''}
                                        onChange={e => setFormData({...formData, quantity: e.target.value})}
                                    />
                                </div>
                                <div>
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">État</label>
                                     <select 
                                         className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                         value={formData.condition || 'Good'}
                                         onChange={e => setFormData({...formData, condition: e.target.value})}
                                     >
                                         <option value="New">Neuf</option>
                                         <option value="Good">Bon</option>
                                         <option value="Fair">Moyen</option>
                                         <option value="Poor">Mauvais</option>
                                     </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                                    value={formData.category || 'Logistics'}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="Medical">Médical</option>
                                    <option value="Logistics">Logistique</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Communication">Communication</option>
                                </select>
                            </div>
                          </>
                      )}

                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex justify-center mt-6">
                          {isLoading ? <Spinner className="animate-spin"/> : (formData.id ? 'Enregistrer Modifications' : 'Ajouter')}
                      </button>
                  </form>
                  <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-center">
                      <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">Annuler</button>
                  </div>
              </div>
          </div>
    );
};

export default EntityFormModal;
