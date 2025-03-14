/**
 * Service unifié pour gérer les statuts de réservation
 */

// Mapping entre les valeurs affichées dans l'UI et les valeurs stockées en DB
export const RIDE_STATUS_MAP = {
  // Valeurs de l'interface - féminisées pour "réservation"
  pending: 'pending',       // En attente
  accepted: 'scheduled',    // Acceptée (nouveau statut)
  inProgress: 'in-progress', // En cours
  completed: 'completed',   // Terminée
  // Suppression de 'canceled' obsolète
  
  // Ajout de statuts plus précis
  driverCanceled: 'driver-canceled', // Annulée par le chauffeur
  clientCanceled: 'client-canceled', // Annulée par le client
  adminCanceled: 'admin-canceled',   // Annulée par l'admin
  noShow: 'no-show',        // Client absent
  delayed: 'delayed'        // Retardée
};

// Mapping inverse de DB vers UI
export const RIDE_STATUS_DB_TO_UI = {
  'unassigned': 'pending',      // Non assignée → En attente
  'pending': 'pending',         // En attente
  'scheduled': 'accepted',      // Programmée → Acceptée
  'in-progress': 'inProgress',  // En cours
  'completed': 'completed',     // Terminée
  // Suppression de 'canceled' obsolète
  'client-canceled': 'clientCanceled', // Annulée par le client
  'driver-canceled': 'driverCanceled', // Annulée par le chauffeur
  'admin-canceled': 'adminCanceled',   // Annulée par l'admin
  'no-show': 'noShow',          // Client absent
  'delayed': 'delayed'          // Retardée
};

// Labels pour l'affichage - Féminisés pour "réservation"
export const STATUS_LABELS = {
  pending: "En attente",
  accepted: "Acceptée", 
  inProgress: "En cours",
  completed: "Terminée",
  // Suppression de 'canceled' obsolète et utilisation des labels spécifiques
  driverCanceled: "Annulée par chauffeur",
  clientCanceled: "Annulée par client",
  adminCanceled: "Annulée par admin",
  noShow: "Client absent",
  delayed: "Retardée",
  unassigned: "Non assignée"
};

// Conversion d'un statut UI vers DB avec vérification
export function mapStatusToDb(uiStatus: string): string {
  if (!uiStatus) {
    console.warn("mapStatusToDb: statut UI vide, utilisation de pending par défaut");
    return 'pending';
  }
  
  const statusKey = uiStatus.toString().toLowerCase().replace(/\s+/g, '');
  const dbStatus = RIDE_STATUS_MAP[statusKey as keyof typeof RIDE_STATUS_MAP];
  
  if (!dbStatus) {
    console.warn(`mapStatusToDb: statut UI inconnu "${uiStatus}", utilisation de pending par défaut`);
    return 'pending';
  }
  
  return dbStatus;
}

// Conversion d'un statut DB vers UI avec vérification
export function mapStatusFromDb(dbStatus: string): string {
  if (!dbStatus) {
    console.warn("mapStatusFromDb: statut DB vide, utilisation de pending par défaut");
    return 'pending';
  }
  
  const statusKey = dbStatus.toString().toLowerCase().replace(/\s+/g, '');
  const uiStatus = RIDE_STATUS_DB_TO_UI[statusKey as keyof typeof RIDE_STATUS_DB_TO_UI];
  
  if (!uiStatus) {
    console.warn(`mapStatusFromDb: statut DB inconnu "${dbStatus}", utilisation de pending par défaut`);
    return 'pending';
  }
  
  return uiStatus;
}

// Liste des statuts pour l'UI (vérifiés pour être valides)
export const ALL_UI_STATUSES = ["pending", "accepted", "inProgress", "completed", 
                               "clientCanceled", "driverCanceled", "adminCanceled", "noShow", "delayed"];

// Liste des statuts pour la DB (vérifiés pour être valides en DB)
// Corriger pour utiliser uniquement les valeurs qui existent vraiment dans Supabase
export const ALL_DB_STATUSES = ["unassigned", "pending", "scheduled", "in-progress", "completed", 
                               "client-canceled", "driver-canceled", "admin-canceled", 
                               "no-show", "delayed"];

// Fonction utilitaire pour vérifier si un statut existe dans la BD
export function isValidDbStatus(status: string): boolean {
  return ALL_DB_STATUSES.includes(status);
}
