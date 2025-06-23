"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useDriversAdmin } from "@/hooks/queries"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Clock, 
  User, 
  Car, 
  CheckCircle2,
  XCircle,
  AlertCircle 
} from "lucide-react"

const statusConfig = {
  unassigned: { color: "bg-orange-500/20 text-orange-500", icon: AlertCircle, label: "Non assignée" },
  pending: { color: "bg-yellow-500/20 text-yellow-500", icon: Clock, label: "En attente" },
  "in-progress": { color: "bg-blue-500/20 text-blue-500", icon: CheckCircle2, label: "En cours" },
  completed: { color: "bg-green-500/20 text-green-500", icon: CheckCircle2, label: "Terminée" },
  canceled: { color: "bg-red-500/20 text-red-500", icon: XCircle, label: "Annulée" },
}

interface RideCardProps {
  ride: {
    id: string
    clientName: string
    pickupAddress: string
    dropoffAddress: string
    status: keyof typeof statusConfig
    driverId: string | null
    createdAt: string
    pickupTime?: string
    estimatedPrice?: number
  }
  onAssignDriver: (rideId: string) => void
  onAssignVehicle: (rideId: string) => void
  onDetails?: (rideId: string) => void
}

export function RideCard({ ride, onAssignDriver, onAssignVehicle, onDetails }: RideCardProps) {
  const { data: drivers = [] } = useDriversAdmin()
  const driver = drivers.find(d => d.id === ride.driverId)
  const StatusIcon = statusConfig[ride.status]?.icon || AlertCircle

  // Fonction pour formater la date et l'heure
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return format(new Date(ride.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })
    
    try {
      return format(new Date(dateString), "d MMMM yyyy à HH:mm", { locale: fr })
    } catch {
      return format(new Date(ride.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })
    }
  }

  // Formater le prix
  const formatCurrency = (price?: number) => {
    if (!price) return "Prix non défini"
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <Card className="overflow-hidden border-neutral-800 bg-neutral-900 mx-auto w-[80vw] max-w-2xl" style={{width: '80vw', maxWidth: 600}}>
      <CardHeader className="border-b border-neutral-800 bg-neutral-950/50 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-neutral-100">{ride.clientName}</h3>
          </div>
          <Badge 
            variant="secondary" 
            className={`${statusConfig[ride.status]?.color} shadow-sm`}
          >
            <StatusIcon className="w-4 h-4 mr-1" />
            {statusConfig[ride.status]?.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="text-sm">
          <p className="font-medium text-neutral-100">{formatDateTime(ride.pickupTime)}</p>
        </div>

        <div className="space-y-3">
          <div className="flex">
            <div className="mr-2 flex flex-col items-center">
              <MapPin className="h-4 w-4 text-green-500" />
              <div className="h-10 w-0.5 bg-neutral-800"></div>
              <MapPin className="h-4 w-4 text-red-500" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-400">Départ</p>
                <p className="text-sm text-neutral-100">{ride.pickupAddress}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-400">Destination</p>
                <p className="text-sm text-neutral-100">{ride.dropoffAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {driver && (
          <div className="flex items-center gap-2 mt-4 p-2 rounded-md bg-neutral-800/50">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-neutral-300">
              Chauffeur: {driver.first_name} {driver.last_name}
            </span>
          </div>
        )}

        {/* Prix affiché directement */}
        <div className="flex justify-end pt-2">
          <div className="text-lg font-semibold text-neutral-100">
            {formatCurrency(ride.estimatedPrice)}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-neutral-800 bg-neutral-950/50 px-4 py-2">
        <div className="flex w-full justify-end gap-2">
          {onDetails && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:text-neutral-100"
              onClick={() => onDetails(ride.id)}
            >
              Détails
            </Button>
          )}
          {!ride.driverId && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs bg-blue-900/30 border-blue-600/50 text-blue-400 hover:bg-blue-900/50 hover:border-blue-500 hover:text-blue-300"
                onClick={() => onAssignDriver(ride.id)}
              >
                <User className="w-4 h-4 mr-1" />
                Assigner chauffeur
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs bg-green-900/30 border-green-600/50 text-green-400 hover:bg-green-900/50 hover:border-green-500 hover:text-green-300"
                onClick={() => onAssignVehicle(ride.id)}
              >
                <Car className="w-4 h-4 mr-1" />
                Assigner véhicule
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
