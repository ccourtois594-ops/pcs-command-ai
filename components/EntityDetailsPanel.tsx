
import React from 'react';
import { EntityType, BaseEntity, SensitiveSite, Intervener, Room, Material } from '../types';
import { X, PencilSimple, Trash, Printer, WarningOctagon, Users, Package, HouseLine, Phone, Envelope, MapPin, Warning, CheckCircle, XCircle } from '@phosphor-icons/react';

interface EntityDetailsPanelProps {
    entity: BaseEntity | null;
    onClose: () => void;
    onEdit: (entity: BaseEntity) => void;
    onDelete: (entity: BaseEntity) => void;
    onPrint: () => void;
}

const EntityDetailsPanel: React.FC<EntityDetailsPanelProps> = ({ entity, onClose, onEdit, onDelete, onPrint }) => {
    if (!entity) return null;

    const renderHeaderIcon = () => {
        switch (entity.type) {
            case EntityType.SITE_SENSIBLE: return <WarningOctagon size={32} className="text-red-500" />;
            case EntityType.INTERVENANT: return <Users size={32} className="text-blue-500" />;
            case EntityType.SALLE: return <HouseLine size={32} className="text-green-500" />;
            case EntityType.MATERIEL: return <Package size={32} className="text-amber-500" />;
            default: return <WarningOctagon size={32} />;
        }
    };

    const renderDetails = () => {
        if (entity.type === EntityType.INTERVENANT) {
            const i = entity as Intervener;
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold">Organisation</p>
                            <p className="text-white font-medium">{i.organization}</p>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold">Disponibilité</p>
                            <div className={`flex items-center gap-2 font-bold ${i.available ? 'text-green-400' : 'text-red-400'}`}>
                                {i.available ? <CheckCircle weight="fill" /> : <XCircle weight="fill" />}
                                {i.available ? 'Disponible' : 'Indisponible'}
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Coordonnées</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-200"><Phone size={16} className="text-blue-400"/> {i.phone}</div>
                            {i.emergencyPhone && <div className="flex items-center gap-2 text-red-300 font-bold"><Phone size={16} /> {i.emergencyPhone} (Urgence)</div>}
                            <div className="flex items-center gap-2 text-slate-200"><Envelope size={16} className="text-blue-400"/> {i.email}</div>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Compétences</p>
                        <div className="flex flex-wrap gap-2">
                            {i.skills?.map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        
        if (entity.type === EntityType.SITE_SENSIBLE) {
            const s = entity as SensitiveSite;
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold">Niveau Risque</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold mt-1 ${
                                s.riskLevel === 'Critical' ? 'bg-red-500 text-white' :
                                s.riskLevel === 'High' ? 'bg-orange-500 text-white' :
                                'bg-blue-500 text-white'
                            }`}>{s.riskLevel}</span>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold">Population</p>
                            <p className="text-white font-bold text-lg">{s.population} <span className="text-sm font-normal text-slate-400">pers.</span></p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-800 p-3 rounded-lg border-l-4 border-red-500">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2 flex items-center gap-2"><Warning size={16} className="text-red-500"/> Risques Identifiés</p>
                        <div className="flex flex-wrap gap-2">
                            {s.hazards?.map((h, idx) => (
                                <span key={idx} className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold">
                                    {h}
                                </span>
                            ))}
                        </div>
                    </div>

                    {(s.contactName || s.contactPhone) && (
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Contact Site</p>
                            <p className="text-white font-medium">{s.contactName}</p>
                            <p className="text-blue-400 font-mono">{s.contactPhone}</p>
                        </div>
                    )}
                    
                    {s.accessInstructions && (
                        <div className="bg-slate-800 p-3 rounded-lg">
                             <p className="text-xs text-slate-400 uppercase font-bold mb-1">Accès</p>
                             <p className="text-slate-300 text-sm italic">"{s.accessInstructions}"</p>
                        </div>
                    )}
                </div>
            );
        }

        if (entity.type === EntityType.SALLE) {
            const r = entity as Room;
            return (
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold">Capacité Totale</p>
                            <p className="text-white font-bold text-lg">{r.capacity} <span className="text-sm font-normal text-slate-400">pers.</span></p>
                        </div>
                         <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold">Capacité Assise</p>
                            <p className="text-white font-bold text-lg">{r.seatedCapacity || 0} <span className="text-sm font-normal text-slate-400">pers.</span></p>
                        </div>
                    </div>
                     <div className="flex gap-2">
                         {r.hasKitchen && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold border border-green-500/30">Cuisine</span>}
                         {r.hasHeating && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold border border-green-500/30">Chauffage</span>}
                         {r.isOccupied && <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30">Actuellement Occupé</span>}
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Équipements</p>
                        <div className="flex flex-wrap gap-2">
                             {r.facilities?.map((f, idx) => <span key={idx} className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded">{f}</span>)}
                        </div>
                    </div>
                     {(r.managerName || r.managerPhone) && (
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Gestionnaire</p>
                            <p className="text-white font-medium">{r.managerName}</p>
                            <p className="text-blue-400 font-mono">{r.managerPhone}</p>
                        </div>
                    )}
                </div>
            );
        }

        if (entity.type === EntityType.MATERIEL) {
             const m = entity as Material;
             return (
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold">Quantité</p>
                            <p className="text-white font-bold text-lg">{m.quantity}</p>
                        </div>
                         <div className="bg-slate-800 p-3 rounded-lg">
                            <p className="text-xs text-slate-400 uppercase font-bold">État</p>
                             <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold mt-1 ${
                                m.condition === 'New' || m.condition === 'Good' ? 'text-green-400' : 'text-orange-400'
                            }`}>{m.condition}</span>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 uppercase font-bold">Catégorie</p>
                        <p className="text-white">{m.category}</p>
                    </div>
                 </div>
             );
        }

        return null;
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 z-40 flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                   Fiche Détails
                </h2>
                <div className="flex items-center gap-2">
                     <button onClick={onPrint} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors" title="Imprimer PDF">
                        <Printer size={20} />
                    </button>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6" id="site-detail-content">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg">
                        {renderHeaderIcon()}
                    </div>
                    <div>
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1 block">{entity.type}</span>
                        <h1 className="text-2xl font-bold text-white leading-tight">{entity.name}</h1>
                        <p className="text-slate-400 text-sm flex items-center gap-1 mt-1"><MapPin size={14} /> {entity.address}</p>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-6">
                    {renderDetails()}
                </div>
                
                {entity.description && (
                    <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-800 italic text-slate-400 text-sm">
                        "{entity.description}"
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
                <button 
                    onClick={() => onEdit(entity)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                    <PencilSimple size={20} /> Modifier
                </button>
                <button 
                    onClick={() => onDelete(entity)}
                    className="px-4 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 border border-slate-700 hover:border-red-500/50 text-slate-400 rounded-lg transition-all flex items-center justify-center">
                    <Trash size={20} />
                </button>
            </div>
        </div>
    );
};

export default EntityDetailsPanel;
