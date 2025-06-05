import type { Database } from '@/lib/types/database.types'

type DbStatus = Database['public']['Enums']['ride_status']

// Types de statuts pour l'UI
export type UiStatus = 
  | 'pending'
  | 'accepted'
  | 'inProgress'
  | 'completed'
  | 'clientCanceled'
  | 'driverCanceled'
  | 'adminCanceled'
  | 'noShow'
  | 'delayed'
  | 'scheduled'

// Mapping entre les valeurs affichées dans l'UI et les valeurs stockées en DB
export const RIDE_STATUS_MAP: Record<UiStatus, DbStatus> = {
  pending: 'pending',
  accepted: 'scheduled',
  inProgress: 'in-progress',
  completed: 'completed',
  clientCanceled: 'client-canceled',
  driverCanceled: 'driver-canceled',
  adminCanceled: 'admin-canceled',
  noShow: 'no-show',
  delayed: 'delayed',
  scheduled: 'scheduled'
}

// Mapping inverse de DB vers UI
export const RIDE_STATUS_DB_TO_UI: Record<DbStatus, UiStatus> = {
  'pending': 'pending',
  'scheduled': 'accepted',
  'in-progress': 'inProgress',
  'completed': 'completed',
  'client-canceled': 'clientCanceled',
  'driver-canceled': 'driverCanceled',
  'admin-canceled': 'adminCanceled',
  'no-show': 'noShow',
  'delayed': 'delayed'
}

// Labels pour l'affichage - Féminisés pour "réservation"
export const STATUS_LABELS: Record<UiStatus, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  inProgress: "En cours",
  completed: "Terminée",
  clientCanceled: "Annulée par le client",
  driverCanceled: "Annulée par le chauffeur",
  adminCanceled: "Annulée",
  noShow: "Client absent",
  delayed: "Retardée",
  scheduled: "Planifiée",
}

// Liste des statuts pour l'UI
export const ALL_UI_STATUSES: UiStatus[] = [
  "pending",
  "accepted",
  "inProgress",
  "completed",
  "clientCanceled",
  "driverCanceled",
  "adminCanceled",
  "noShow",
  "delayed"
]

// Liste des statuts pour la DB
export const ALL_DB_STATUSES: DbStatus[] = [
  "pending",
  "scheduled",
  "in-progress",
  "completed",
  "client-canceled",
  "driver-canceled",
  "admin-canceled",
  "no-show",
  "delayed"
]

/**
 * Conversion d'un statut UI vers DB avec vérification
 */
export function mapStatusToDb(uiStatus: string): DbStatus {
  if (!uiStatus) {
    console.warn("mapStatusToDb: statut UI vide, utilisation de pending par défaut")
    return 'pending'
  }
  
  const statusKey = uiStatus.toLowerCase().replace(/\s+/g, '')
  const dbStatus = RIDE_STATUS_MAP[statusKey as UiStatus]
  
  if (!dbStatus) {
    console.warn(`mapStatusToDb: statut UI inconnu "${uiStatus}", utilisation de pending par défaut`)
    return 'pending'
  }
  
  return dbStatus
}

/**
 * Conversion d'un statut DB vers UI avec vérification
 */
export function mapStatusFromDb(dbStatus: string): UiStatus {
  if (!dbStatus) {
    console.warn("mapStatusFromDb: statut DB vide, utilisation de pending par défaut")
    return 'pending'
  }
  
  const statusKey = dbStatus.toLowerCase().replace(/\s+/g, '')
  const uiStatus = RIDE_STATUS_DB_TO_UI[statusKey as DbStatus]
  
  if (!uiStatus) {
    console.warn(`mapStatusFromDb: statut DB inconnu "${dbStatus}", utilisation de pending par défaut`)
    return 'pending'
  }
  
  return uiStatus
}

/**
 * Fonction utilitaire pour vérifier si un statut existe dans la BD
 */
export function isValidDbStatus(status: string): status is DbStatus {
  return ALL_DB_STATUSES.includes(status as DbStatus)
}

/**
 * Fonction utilitaire pour vérifier si un statut existe dans l'UI
 */
export function isValidUiStatus(status: string): status is UiStatus {
  return ALL_UI_STATUSES.includes(status as UiStatus)
}