import { Clock, CheckCircle2, Car, XCircle, TimerOff } from "lucide-react"

// Type pour couvrir tous les statuts possibles (DB + compatibilité)
export type RideStatus = 
  | 'pending'
  | 'scheduled'
  | 'accepted'
  | 'assigned'
  | 'in_progress'
  | 'in-progress'
  | 'completed'
  | 'canceled'
  | 'client-canceled'
  | 'driver-canceled'
  | 'admin-canceled'
  | 'no_show'
  | 'no-show'
  | 'delayed'

export const RIDE_STATUS_CONFIG: Record<string, {
  label: string
  color: string
  icon: any
}> = {
  pending: {
    label: "En attente",
    color: "bg-yellow-500/20 text-yellow-500",
    icon: Clock
  },
  scheduled: {
    label: "Programmée", 
    color: "bg-purple-500/20 text-purple-500",
    icon: Clock
  },
  accepted: {
    label: "Acceptée",
    color: "bg-blue-500/20 text-blue-500",
    icon: CheckCircle2
  },
  assigned: {
    label: "Assignée",
    color: "bg-blue-500/20 text-blue-500",
    icon: CheckCircle2
  },
  "in-progress": {
    label: "En cours",
    color: "bg-blue-600/20 text-blue-400",
    icon: Car
  },
  in_progress: { // Pour compatibilité
    label: "En cours",
    color: "bg-blue-600/20 text-blue-400",
    icon: Car
  },
  completed: {
    label: "Terminée",
    color: "bg-green-500/20 text-green-500",
    icon: CheckCircle2
  },
  canceled: {
    label: "Annulée",
    color: "bg-red-500/20 text-red-500",
    icon: XCircle
  },
  "client-canceled": {
    label: "Annulation du client",
    color: "bg-red-500/20 text-red-500",
    icon: XCircle
  },
  "driver-canceled": {
    label: "Annulation du chauffeur",
    color: "bg-red-500/20 text-red-500",
    icon: XCircle
  },
  "admin-canceled": {
    label: "Annulée par admin",
    color: "bg-red-500/20 text-red-500",
    icon: XCircle
  },
  no_show: {
    label: "No-show",
    color: "bg-orange-500/20 text-orange-500",
    icon: TimerOff
  },
  "no-show": {
    label: "No-show",
    color: "bg-orange-500/20 text-orange-500",
    icon: TimerOff
  },
  delayed: {
    label: "Retardée",
    color: "bg-orange-300/20 text-orange-300",
    icon: Clock
  }
}