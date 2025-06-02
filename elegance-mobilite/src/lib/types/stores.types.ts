import type { RideStatus as DbRideStatus } from './common.types'
import { 
  Clock, 
  CheckCircle2, 
  Car, 
  XCircle, 
  TimerOff,
  AlertTriangle
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Exporter RideStatus
export type RideStatus = DbRideStatus;

// Configuration UI des statuts (avec les variants supplémentaires)
export const RIDE_STATUS_CONFIG: Record<string, {
  label: string
  color: string
  icon: LucideIcon
  description: string
}> = {
  pending: {
    label: "En attente",
    color: "bg-yellow-500/20 text-yellow-500",
    icon: Clock,
    description: "En attente d'assignation"
  },
  scheduled: {
    label: "Programmée",
    color: "bg-blue-500/20 text-blue-500",
    icon: Clock,
    description: "Course programmée"
  },
  accepted: {
    label: "Acceptée",
    color: "bg-blue-500/20 text-blue-500",
    icon: CheckCircle2,
    description: "Course acceptée par un chauffeur"
  },
  assigned: {
    label: "Assignée",
    color: "bg-blue-500/20 text-blue-500",
    icon: CheckCircle2,
    description: "Course assignée à un chauffeur"
  },
  "in-progress": {
    label: "En cours",
    color: "bg-blue-600/20 text-blue-400",
    icon: Car,
    description: "Course en cours"
  },
  in_progress: {
    label: "En cours",
    color: "bg-blue-600/20 text-blue-400",
    icon: Car,
    description: "Course en cours"
  },
  completed: {
    label: "Terminée",
    color: "bg-green-500/20 text-green-500",
    icon: CheckCircle2,
    description: "Course terminée avec succès"
  },
  canceled: {
    label: "Annulée",
    color: "bg-red-500/20 text-red-500",
    icon: XCircle,
    description: "Course annulée"
  },
  "client-canceled": {
    label: "Annulation du client",
    color: "bg-red-500/20 text-red-500",
    icon: XCircle,
    description: "Course annulée par le client"
  },
  "driver-canceled": {
    label: "Annulation du chauffeur",
    color: "bg-red-500/20 text-red-500",
    icon: XCircle,
    description: "Course annulée par le chauffeur"
  },
  "admin-canceled": {
    label: "Annulée par admin",
    color: "bg-red-500/20 text-red-500",
    icon: XCircle,
    description: "Course annulée par l'administrateur"
  },
  "no-show": {
    label: "Client absent",
    color: "bg-orange-500/20 text-orange-500",
    icon: TimerOff,
    description: "Le client ne s'est pas présenté"
  },
  no_show: {
    label: "Client absent",
    color: "bg-orange-500/20 text-orange-500",
    icon: TimerOff,
    description: "Le client ne s'est pas présenté"
  },
  delayed: {
    label: "Retardée",
    color: "bg-orange-300/20 text-orange-300",
    icon: Clock,
    description: "Course retardée"
  }
}

// Types pour les filtres
export interface DateRange {
  start: Date | null
  end: Date | null
}

export interface Filters {
  selectedDate: Date
  selectedStatus: string
  driverFilter: string | null
  searchQuery: string
  dateRange: DateRange
  showMobileFilters: boolean
}

// Type des courses avec relations - avec toutes les propriétés utilisées
export interface StoreRide {
  id: string
  user_id: string | null
  driver_id: string | null
  status: string
  pickup_address: string
  dropoff_address: string
  pickup_lat: number | null
  pickup_lon: number | null
  dropoff_lat: number | null
  dropoff_lon: number | null
  pickup_time: string
  distance: number | null
  duration: number | null
  vehicle_type: string
  options: string[] | null
  estimated_price: number | null
  final_price: number | null
  created_at: string
  updated_at: string
  
  // Propriétés supplémentaires pour le store
  driver?: {
    id: string
    first_name: string
    last_name: string
    phone: string
  }
  driver_name?: string
  formatted_date?: string
  formatted_time?: string
}

// Types pour la pagination
export interface StorePagination {
  currentPage: number
  itemsPerPage: number
  totalResults: number
  totalPages: number
}

// Types pour le filtrage
export interface StoreFiltering {
  isFiltering: boolean
  filteredItems: StoreRide[]
}

// Interface pour l'état du store UnifiedRidesStore
export interface UnifiedRidesState extends Filters, StorePagination, StoreFiltering {
  // Filter actions
  setSelectedDate: (date: Date) => void
  setSelectedStatus: (status: string) => void
  setDriverFilter: (driverId: string | null) => void
  setSearchQuery: (query: string) => void
  setDateRange: (range: DateRange) => void
  toggleMobileFilters: () => void
  resetFilters: () => void

  // Pagination actions
  setCurrentPage: (page: number) => void
  setItemsPerPage: (count: number) => void

  // Filter application
  applyFilters: () => void
}

// Utilitaires pour les statuts
export function getStatusLabel(status: string): string {
  return RIDE_STATUS_CONFIG[status]?.label || "Inconnu"
}

export function getStatusIcon(status: string): LucideIcon {
  return RIDE_STATUS_CONFIG[status]?.icon || AlertTriangle
}

export function getStatusColor(status: string): string {
  return RIDE_STATUS_CONFIG[status]?.color || "bg-gray-500/20 text-gray-500"
}

export function getStatusDescription(status: string): string {
  return RIDE_STATUS_CONFIG[status]?.description || "Statut inconnu"
}