
import { EntityType, PCSData } from './types';

// Simulation of a small town "Ville-Demo" (Centered approx on Lyon for demo purposes: 45.76, 4.83)
export const MAP_CENTER = { lat: 45.764043, lng: 4.835659 };

export const INITIAL_DATA: PCSData = {
  interveners: [
    {
      id: 'i1', type: EntityType.INTERVENANT, name: 'Jean Dupont', address: '12 Rue de la Mairie',
      location: { lat: 45.764043, lng: 4.835659 }, role: 'Maire', organization: 'Mairie Ville-Demo', 
      phone: '06 01 02 03 04', emergencyPhone: '04 72 00 00 01', email: 'maire@ville-demo.fr', available: true,
      skills: ['Gestion de crise', 'Commandement', 'Communication publique']
    },
    {
      id: 'i2', type: EntityType.INTERVENANT, name: 'Dr. Sarah Connor', address: '45 Av. de la République',
      location: { lat: 45.7580, lng: 4.8420 }, role: 'Médecin Chef', organization: 'Hôpital Central', 
      phone: '06 99 88 77 66', emergencyPhone: '04 78 00 99 88', email: 's.connor@hopital.fr', available: true,
      skills: ['Urgence médicale', 'Tri patients', 'Gestion risques biologiques']
    },
    {
      id: 'i3', type: EntityType.INTERVENANT, name: 'Lt. Marc Spencer', address: 'Caserne Sud',
      location: { lat: 45.7500, lng: 4.8250 }, role: 'Chef de Colonne', organization: 'SDIS 69', 
      phone: '06 11 22 33 44', emergencyPhone: '18 (Ligne Prioritaire)', email: 'feu@secours.fr', available: false,
      skills: ['Lutte incendie', 'Sauvetage aquatique', 'Risques chimiques']
    },
    {
      id: 'i4', type: EntityType.INTERVENANT, name: 'Marie Curie', address: 'Laboratoire Municipal',
      location: { lat: 45.7720, lng: 4.8300 }, role: 'Responsable Technique', organization: 'Services Techniques', 
      phone: '06 55 44 33 22', email: 'tech@ville-demo.fr', available: true,
      skills: ['Génie civil', 'Électricité', 'Conduite engins']
    }
  ],
  sites: [
    {
      id: 's1', type: EntityType.SITE_SENSIBLE, name: 'École Primaire Jules Ferry', address: '8 Impasse des Lilas',
      location: { lat: 45.7610, lng: 4.8310 }, riskLevel: 'High', priority: 'P1', population: 250, hazards: ['Inondation', 'Intrusion'],
      contactName: 'Mme. Directeur', contactPhone: '04 72 11 22 33', accessInstructions: 'Portail principal rue des Lilas. Clé boite à feu #1234.'
    },
    {
      id: 's2', type: EntityType.SITE_SENSIBLE, name: 'Usine Chimique Alpha', address: 'Zone Industrielle Nord',
      location: { lat: 45.7750, lng: 4.8500 }, riskLevel: 'Critical', priority: 'P2', population: 50, hazards: ['Explosion', 'Toxique'],
      contactName: 'M. Securité Indus', contactPhone: '06 00 99 88 77', accessInstructions: 'Entrée Poids Lourds uniquement. Badge requis.'
    },
    {
      id: 's3', type: EntityType.SITE_SENSIBLE, name: 'EHPAD Les Glycines', address: '10 Rue du Parc',
      location: { lat: 45.7680, lng: 4.8150 }, riskLevel: 'Medium', priority: 'P1', population: 80, hazards: ['Canicule', 'Isolement'],
      contactName: 'Infirmière Coordinatrice', contactPhone: '04 78 44 55 66', accessInstructions: 'Accès ambulance via parking arrière. Digicode 4567A.'
    }
  ],
  rooms: [
    {
      id: 'r1', type: EntityType.SALLE, name: 'Gymnase Municipal', address: '2 Rue du Stade',
      location: { lat: 45.7550, lng: 4.8380 }, capacity: 300, seatedCapacity: 0, facilities: ['Douches', 'Électricité', 'Parking'], isOccupied: false,
      managerName: 'Gardien Gymnase', managerPhone: '06 55 55 55 55', accessInfo: 'Logement de fonction sur place. Clés passe général.',
      hasHeating: true, hasKitchen: false
    },
    {
      id: 'r2', type: EntityType.SALLE, name: 'Salle des Fêtes', address: 'Place du Marché',
      location: { lat: 45.7630, lng: 4.8360 }, capacity: 150, seatedCapacity: 100, facilities: ['Cuisine', 'Wifi', 'Sonorisation'], isOccupied: false,
      managerName: 'Service Asso Mairie', managerPhone: '04 72 00 00 00', accessInfo: 'Clés à retirer à l\'accueil Mairie.',
      hasHeating: true, hasKitchen: true
    }
  ],
  materials: [
    {
      id: 'm1', type: EntityType.MATERIEL, name: 'Groupe Électrogène 50kW', address: 'Atelier Municipal',
      location: { lat: 45.7700, lng: 4.8200 }, quantity: 2, condition: 'Good', category: 'Logistics'
    },
    {
      id: 'm2', type: EntityType.MATERIEL, name: 'Lits de camp', address: 'Stockage Gymnase',
      location: { lat: 45.7555, lng: 4.8385 }, quantity: 100, condition: 'New', category: 'Logistics'
    },
    {
      id: 'm3', type: EntityType.MATERIEL, name: 'Défibrillateur', address: 'Mairie',
      location: { lat: 45.7642, lng: 4.8358 }, quantity: 4, condition: 'Good', category: 'Medical'
    }
  ],
  documents: [
    {
      id: 'd1', title: 'Plan Inondation (PPRI)', category: 'Procédures', updatedAt: new Date('2023-10-15'),
      url: '#', fileName: 'PPRI_2023.pdf', mimeType: 'application/pdf', size: 1024000
    },
    {
      id: 'd2', title: 'Liste des contacts d\'urgence', category: 'Annuaire', updatedAt: new Date('2024-01-10'),
      url: '#', fileName: 'Contacts_2024.pdf', mimeType: 'application/pdf', size: 512000
    }
  ],
  crisisHistory: [],
  drawings: [],
  systemLogs: [
    { 
      id: 'sys1', 
      timestamp: new Date(), 
      message: 'Initialisation du système PCS Command AI v1.0', 
      category: 'SYSTEM' 
    }
  ],
  activeAlerts: [
      {
          id: 'a1',
          source: 'Météo France',
          category: 'Météo',
          severity: 'Orange',
          message: 'Vigilance Orange Orages violents prévue ce soir à partir de 20h.',
          receivedAt: new Date()
      }
  ]
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: 'ChartPieSlice' },
  { id: 'crisis', label: 'Gestion de Crise', icon: 'Siren' },
  { id: 'map', label: 'Cartographie', icon: 'MapTrifold' },
  { id: 'interveners', label: 'Intervenants', icon: 'Users' },
  { id: 'sites', label: 'Sites Sensibles', icon: 'WarningOctagon' },
  { id: 'rooms', label: 'Salles', icon: 'HouseLine' },
  { id: 'materials', label: 'Matériel', icon: 'Package' },
  { id: 'documents', label: 'Documentation', icon: 'Files' },
  { id: 'users', label: 'Utilisateurs', icon: 'IdentificationBadge' },
  { id: 'archives', label: 'Historique & Archives', icon: 'Archive' },
];