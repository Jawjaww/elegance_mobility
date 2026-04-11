import { Badge } from "@/components/ui/badge"

interface RideStatusBadgeProps {
  status: string // Utiliser string pour accepter tout type de statut
}

// Mapping des statuts avec leurs configurations visuelles
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: {
    label: "En attente",
    color: "bg-yellow-500/20 text-yellow-500"
  },
  scheduled: {
    label: "Programmée",
    color: "bg-purple-500/20 text-purple-500"
  },
  accepted: {
    label: "Acceptée",
    color: "bg-blue-500/20 text-blue-500"
  },
  assigned: {
    label: "Assignée",
    color: "bg-blue-500/20 text-blue-500"
  },
  "in-progress": {
    label: "En cours",
    color: "bg-blue-600/20 text-blue-400"
  },
  in_progress: {
    label: "En cours",
    color: "bg-blue-600/20 text-blue-400"
  },
  completed: {
    label: "Terminée",
    color: "bg-green-500/20 text-green-500"
  },
  canceled: {
    label: "Annulée",
    color: "bg-red-500/20 text-red-500"
  },
  "client-canceled": {
    label: "Annulation du client",
    color: "bg-red-500/20 text-red-500"
  },
  "driver-canceled": {
    label: "Annulation du chauffeur",
    color: "bg-red-500/20 text-red-500"
  },
  "admin-canceled": {
    label: "Annulée par admin",
    color: "bg-red-500/20 text-red-500"
  },
  "no-show": {
    label: "Client absent",
    color: "bg-orange-500/20 text-orange-500"
  },
  no_show: {
    label: "Client absent",
    color: "bg-orange-500/20 text-orange-500"
  },
  delayed: {
    label: "Retardée",
    color: "bg-orange-300/20 text-orange-300"
  }
}

export function RideStatusBadge({ status }: RideStatusBadgeProps) {
  // Standardiser le format du statut (convertir underscore en tiret)
  let normalizedStatus = status;
  if (status === "in_progress") normalizedStatus = "in-progress";
  if (status === "no_show") normalizedStatus = "no-show";

  // Obtenir la configuration (ou utiliser une valeur par défaut)
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: "Inconnu",
    color: "bg-gray-500/20 text-gray-500"
  }

  return (
    <Badge className={`${config.color}`}>
      {config.label}
    </Badge>
  )
}