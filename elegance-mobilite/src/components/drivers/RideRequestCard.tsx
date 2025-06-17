'use client'

import { formatCurrency } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils/date-format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MapPin, Clock, User, Car, Timer } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import type { Database } from "@/lib/types/database.types"

interface RideRequestCardProps {
  ride: Database["public"]["Tables"]["rides"]["Row"]
  onAccept: (rideId: string) => void
  onDecline: (rideId: string) => void
  timeRemaining?: number // Temps restant en secondes pour accepter
}

export function RideRequestCard({ 
  ride, 
  onAccept, 
  onDecline, 
  timeRemaining 
}: RideRequestCardProps) {
  const formattedDateTime = formatDateTime(ride.pickup_time)
  
  // Calculer la distance estimée (placeholder - à implémenter avec vraies données)
  const estimatedDistance = "5.2 km"
  const estimatedDuration = "12 min"

  // Formater le temps restant
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getVehicleTypeDisplay = () => {
    if (!ride.vehicle_type) return "Standard"
    return ride.vehicle_type.charAt(0).toUpperCase() + ride.vehicle_type.slice(1)
  }

  return (
    <Card className="border-blue-800 bg-blue-900/10 hover:bg-blue-900/20 transition-colors">
      <CardHeader className="border-b border-blue-800/30 bg-blue-950/30 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-blue-200">Nouvelle course</h3>
            <Badge variant="outline" className="border-blue-600 text-blue-300">
              {getVehicleTypeDisplay()}
            </Badge>
          </div>
          {timeRemaining && (
            <div className="flex items-center gap-1 text-amber-400">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-mono">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Date et heure */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-200">
            {formattedDateTime}
          </span>
        </div>

        {/* Trajet */}
        <div className="space-y-3">
          <div className="flex">
            <div className="mr-3 flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <div className="h-8 w-0.5 bg-neutral-700"></div>
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <p className="text-xs font-medium text-green-400 mb-1">DÉPART</p>
                <p className="text-sm text-neutral-200">{ride.pickup_address}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-red-400 mb-1">DESTINATION</p>
                <p className="text-sm text-neutral-200">{ride.dropoff_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations de la course */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-neutral-800">
          <div className="text-center">
            <p className="text-xs text-neutral-400">Distance</p>
            <p className="text-sm font-medium text-neutral-200">{estimatedDistance}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-400">Durée</p>
            <p className="text-sm font-medium text-neutral-200">{estimatedDuration}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-400">Prix</p>
            <p className="text-lg font-semibold text-green-400">
              {ride.estimated_price ? formatCurrency(ride.estimated_price) : "N/A"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-red-900/20 border-red-700 text-red-300 hover:bg-red-900/40"
            onClick={() => onDecline(ride.id)}
          >
            Refuser
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onAccept(ride.id)}
          >
            Accepter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
