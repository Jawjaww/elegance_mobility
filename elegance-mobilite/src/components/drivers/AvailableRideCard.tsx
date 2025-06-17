'use client'

import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Check, X } from "lucide-react"
import type { Database } from "@/lib/types/database.types"

interface AvailableRideCardProps {
  ride: Database["public"]["Tables"]["rides"]["Row"]
  onAccept: (rideId: string) => void
  onDecline: (rideId: string) => void
}

export function AvailableRideCard({ 
  ride, 
  onAccept, 
  onDecline 
}: AvailableRideCardProps) {
  
  const getVehicleTypeColor = (vehicleType: string) => {
    switch (vehicleType) {
      case 'premium':
        return 'border-amber-600 bg-amber-900/20 text-amber-300'
      case 'luxury':
        return 'border-purple-600 bg-purple-900/20 text-purple-300'
      default:
        return 'border-neutral-600 bg-neutral-900/20 text-neutral-300'
    }
  }

  const getVehicleTypeLabel = (vehicleType: string) => {
    switch (vehicleType) {
      case 'premium': return 'Premium'
      case 'luxury': return 'Luxe'
      case 'standard': return 'Standard'
      default: return vehicleType
    }
  }

  return (
    <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50 hover:border-neutral-600/50 transition-colors">
      {/* Header avec badge véhicule */}
      <div className="flex items-center justify-between mb-3">
        <Badge 
          variant="outline" 
          className={`text-xs ${getVehicleTypeColor(ride.vehicle_type)} border-opacity-50`}
        >
          {getVehicleTypeLabel(ride.vehicle_type)}
        </Badge>
        <span className="text-green-400 font-semibold text-lg">
          {formatCurrency((ride.estimated_price || 0) / 100)}
        </span>
      </div>

      {/* Itinéraire */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{ride.pickup_address}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-neutral-300 text-sm truncate">{ride.dropoff_address}</p>
          </div>
        </div>
      </div>

      {/* Heure et actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-neutral-400">
          <Clock className="h-4 w-4" />
          <span className="text-xs">
            {new Date(ride.pickup_time).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDecline(ride.id)}
            className="py-2 inline-flex items-center justify-center text-sm font-medium h-11 px-8 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-600 hover:to-red-400 transition-all duration-300 ease-out rounded-md"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            onClick={() => onAccept(ride.id)}
            className="py-2 inline-flex items-center justify-center text-sm font-medium h-11 px-8 bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-600 hover:to-green-400 transition-all duration-300 ease-out rounded-md"
          >
            <Check className="h-4 w-4 mr-1" />
            Accepter
          </Button>
        </div>
      </div>
    </div>
  )
}
