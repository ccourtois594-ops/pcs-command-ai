import React from 'react';
import { NAV_ITEMS } from '../constants';
import { Crisis, User } from '../types';
import { 
  ChartPieSlice, 
  MapTrifold, 
  Users, 
  WarningOctagon, 
  HouseLine, 
  Package, 
  Files, 
  Siren, 
  Archive, 
  IdentificationBadge,
  ShieldWarning,
  User as UserIcon,
  SignOut,
  PlugsConnected,
  Plugs,
  Spinner
} from '@phosphor-icons/react';

// Helper for Icons in Sidebar
const IconMap: Record<string, React.ElementType> = {
  ChartPieSlice, MapTrifold, Users, WarningOctagon, HouseLine, Package, Files, Siren, Archive, IdentificationBadge
};

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    activeCrisis: Crisis | null;
    currentUser: { username: string, role: string } | null;
    serverStatus: 'connected' | 'disconnected' | 'checking';
    onLogout: () => void;
    onRetryConnection: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeTab, 
    setActiveTab, 
    activeCrisis, 
    currentUser, 
    serverStatus,
    onLogout,
    onRetryConnection
}) => {
    return (
        <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 h-full z-20">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldWarning size={20} className="text-white" />
            </div>
            <span className="ml-3 font-bold text-white hidden lg:block tracking-tight">PCS Command</span>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar px-2">
            {NAV_ITEMS.map(item => {
                const Icon = IconMap[item.icon];
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center p-3 rounded-lg transition-all group relative ${
                            isActive 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <Icon size={24} weight={isActive ? "fill" : "regular"} className="flex-shrink-0" />
                        <span className="ml-3 font-medium hidden lg:block text-sm">{item.label}</span>
                        
                        {/* Tooltip for small screen */}
                        <div className="lg:hidden absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                            {item.label}
                        </div>
                    </button>
                );
            })}
        </nav>

        <div className="p-4 border-t border-slate-800">
            {activeCrisis && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 hidden lg:block animate-pulse">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase mb-1">
                        <Siren size={16} /> Crise en cours
                    </div>
                    <div className="text-white text-sm font-bold truncate">{activeCrisis.title}</div>
                </div>
            )}
            
            <div className="flex items-center gap-3 mb-2 px-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <UserIcon size={16} className="text-slate-400" />
                </div>
                <div className="hidden lg:block overflow-hidden">
                    <div className="text-sm font-bold text-white truncate">{currentUser?.username}</div>
                    <div className="text-xs text-slate-500 truncate">{currentUser?.role}</div>
                </div>
            </div>
             {/* Server Status Indicator */}
             <div className="flex items-center gap-2 px-2 mt-3">
                {serverStatus === 'connected' ? (
                     <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-2 py-1 rounded text-[10px] font-bold border border-green-500/20 w-full justify-center">
                        <PlugsConnected size={14} weight="fill"/>
                        <span className="hidden lg:inline">CONNECTÉ</span>
                    </div>
                ) : serverStatus === 'checking' ? (
                    <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-[10px] font-bold border border-yellow-500/20 w-full justify-center">
                        <Spinner size={14} className="animate-spin"/>
                        <span className="hidden lg:inline">CONNEXION...</span>
                    </div>
                ) : (
                     <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2 py-1 rounded text-[10px] font-bold border border-red-500/20 w-full justify-center cursor-pointer hover:bg-red-500/20" onClick={onRetryConnection}>
                        <Plugs size={14} weight="fill"/>
                        <span className="hidden lg:inline">DÉCONNECTÉ</span>
                    </div>
                )}
            </div>

            <button 
                onClick={onLogout}
                className="mt-2 w-full flex items-center justify-center lg:justify-start gap-2 text-slate-500 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors text-xs">
                <SignOut size={16} />
                <span className="hidden lg:inline">Déconnexion</span>
            </button>
        </div>
      </aside>
    );
};

export default Sidebar;