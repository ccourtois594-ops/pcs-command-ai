
export enum EntityType {
  INTERVENANT = 'INTERVENANT',
  SITE_SENSIBLE = 'SITE_SENSIBLE',
  SALLE = 'SALLE',
  MATERIEL = 'MATERIEL',
  DOCUMENT = 'DOCUMENT',
  ALERT = 'ALERT'
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BaseEntity {
  id: string;
  name: string;
  address: string;
  description?: string;
  location: GeoPoint;
  type: EntityType;
}

export interface User {
    username: string;
    role: string;
    password?: string; // Only used for creation
}

export interface Intervener extends BaseEntity {
  role: string;
  organization: string; // Mairie, Pompiers, Croix-Rouge, etc.
  phone: string;
  emergencyPhone?: string; // Ligne directe urgence
  email: string;
  available: boolean;
  skills?: string[]; // Permis Poids lourd, Secourisme, Pilotage drone...
}

export interface SensitiveSite extends BaseEntity {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  priority: 'P1' | 'P2' | 'P3'; // P1 = Evacuation Prioritaire
  population: number;
  hazards: string[];
  contactName?: string; // Responsable du site / Directeur
  contactPhone?: string; // Ligne urgence site
  accessInstructions?: string; // "Clé boite à feu", "Entrée arrière", "Code portail"
}

export interface Room extends BaseEntity {
  capacity: number; // Capacité Debout / Max
  seatedCapacity?: number; // Capacité Assise (Repas/Réunion)
  facilities: string[]; // Wifi, Generator, Beds
  isOccupied: boolean;
  managerName?: string; // Gardien / Gestionnaire
  managerPhone?: string;
  accessInfo?: string; // "Clés en mairie", "Badge requis"
  hasKitchen: boolean;
  hasHeating: boolean;
}

export interface Material extends BaseEntity {
  quantity: number;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  category: 'Medical' | 'Transport' | 'Logistics' | 'Communication';
}

export interface DocumentResource {
  id: string;
  title: string;
  category: string;
  url: string; // URL pointing to the server storage
  fileName: string;
  mimeType: string; // 'application/pdf', 'image/png', 'text/plain'
  size?: number; // Size in bytes
  updatedAt: Date;
}

export type CrisisLevel = 'Vigilance' | 'Jaune' | 'Orange' | 'Rouge';

export interface CrisisLogEntry {
    id: string;
    timestamp: Date;
    message: string;
    type: 'EVOLUTION' | 'DECISION' | 'INFO';
}

export interface Crisis {
    id: string;
    isActive: boolean;
    title: string;
    type: string; // Incendie, Inondation, Attentat
    level: CrisisLevel;
    address: string;
    location: GeoPoint;
    radius: number; // Zone impactée en mètres
    startedAt: Date;
    endedAt?: Date; // Date de fin de crise
    logs: CrisisLogEntry[];
    aiAnalysis?: string; // Fiche réflexe générée par IA
}

export interface MapDrawing {
    id: string;
    layerType: 'marker' | 'circle' | 'rectangle' | 'polygon' | 'polyline' | 'text';
    latlngs: any; // Coordinates structure differs by type (Point, Array of Points, etc.)
    options: {
        color?: string;
        radius?: number; // Only for circles
        fillColor?: string;
        text?: string; // For text labels
    };
}

export interface SystemLogEntry {
    id: string;
    timestamp: Date;
    message: string;
    category: 'SYSTEM' | 'DATA' | 'ALERT';
    entityType?: EntityType;
}

export interface IncomingAlert {
    id: string;
    source: string; // "Météo France", "Préfecture", "Vigipirate"
    category: 'Météo' | 'Sécurité' | 'Santé' | 'Autre';
    severity: 'Info' | 'Jaune' | 'Orange' | 'Rouge';
    message: string;
    receivedAt: Date;
}

export type PCSData = {
  interveners: Intervener[];
  sites: SensitiveSite[];
  rooms: Room[];
  materials: Material[];
  documents: DocumentResource[];
  crisisHistory: Crisis[]; // Historique des crises
  drawings: MapDrawing[]; // Custom user drawings
  systemLogs: SystemLogEntry[]; // Global activity feed
  activeAlerts: IncomingAlert[]; // Veille et alertes reçues
};
