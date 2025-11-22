
import { PCSData, Crisis, User } from '../types';
import { INITIAL_DATA } from '../constants';

const API_URL = '/api';

// Helper pour traiter les réponses API
const handleResponse = async (response: Response, errorMessageDefault: string) => {
    // Si succès (200-299)
    if (response.ok) {
        if (response.status === 204) return null;
        return response.json();
    }

    // Si erreur
    let errorMessage = errorMessageDefault;
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            if (errData.error) errorMessage = errData.error;
        } else {
            // Fallback textuel si ce n'est pas du JSON (ex: erreur 500 générique serveur web)
            const text = await response.text();
            if (text && text.length < 200) errorMessage += `: ${text}`; 
        }
    } catch (e) {
        // Ignore parsing error
    }

    throw new Error(errorMessage);
};

// Helper pour restaurer les dates
const sanitizeData = (rawData: any): PCSData => {
    if (!rawData) return INITIAL_DATA;
    return {
        ...INITIAL_DATA, 
        ...rawData,      
        // Re-apply date objects if they came as strings (basic parsing)
        crisisHistory: (rawData.crisisHistory || []).map((c: any) => ({
            ...c,
            startedAt: new Date(c.startedAt),
            endedAt: c.endedAt ? new Date(c.endedAt) : undefined,
            logs: (c.logs || []).map((l: any) => ({...l, timestamp: new Date(l.timestamp)}))
        })),
        activeAlerts: (rawData.activeAlerts || []).map((a: any) => ({...a, receivedAt: new Date(a.receivedAt)})),
        systemLogs: (rawData.systemLogs || []).map((l: any) => ({...l, timestamp: new Date(l.timestamp)}))
    };
}

export const StorageService = {
    login: async (username: string, password: string): Promise<{ success: boolean, user?: any, error?: string }> => {
        try {
            const response = await fetch(`${API_URL}/login`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                if (response.status === 401) return { success: false, error: 'Identifiants incorrects' };
                await handleResponse(response, "Erreur de connexion");
            }
            
            const data = await response.json();
            return { success: true, user: data.user };
        } catch (error: any) {
            return { success: false, error: error.message || "Serveur injoignable" };
        }
    },

    loadFullState: async (): Promise<{ data: PCSData, activeCrisis: Crisis | null }> => {
        const response = await fetch(`${API_URL}/state`);
        const json = await handleResponse(response, "Erreur de chargement des données");
        
        // Process Active Crisis Dates
        let activeCrisis = json.activeCrisis;
        if (activeCrisis) {
            activeCrisis = {
                ...activeCrisis,
                startedAt: new Date(activeCrisis.startedAt),
                logs: activeCrisis.logs.map((l: any) => ({...l, timestamp: new Date(l.timestamp)}))
            };
        }

        return {
            data: sanitizeData(json.data),
            activeCrisis: activeCrisis || null
        };
    },

    saveFullState: async (data: PCSData, activeCrisis: Crisis | null): Promise<boolean> => {
        const payload = { data, activeCrisis };
        const response = await fetch(`${API_URL}/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        await handleResponse(response, "Erreur de sauvegarde");
        return true;
    },

    getUsers: async (): Promise<User[]> => {
        const response = await fetch(`${API_URL}/users`);
        return handleResponse(response, "Impossible de récupérer la liste des utilisateurs");
    },

    createUser: async (user: User): Promise<void> => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        await handleResponse(response, "Impossible de créer l'utilisateur");
    },

    deleteUser: async (username: string): Promise<void> => {
        const response = await fetch(`${API_URL}/users/${username}`, { method: 'DELETE' });
        await handleResponse(response, "Impossible de supprimer l'utilisateur");
    }
};
