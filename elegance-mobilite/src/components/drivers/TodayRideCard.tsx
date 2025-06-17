'use client'

import { formatCurrency } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils/date-format"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Navigation } from "lucide-react"

import type { Database } from "@/lib/types/database.types"

interface TodayRideCardProps {
  ride: Database["public"]["Tables"]["rides"]["Row"]
  onNavigate?: (rideId: string) => void
  onComplete?: (rideId: string) => void
  onStart?: (rideId: string) => void
}

export function TodayRideCard({ 
  ride, 
  onNavigate, 
  onComplete, 
  onStart 
}: TodayRideCardProps) {
  const formattedDateTime = formatDateTime(ride.pickup_time)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'border-blue-600 bg-blue-900/20 text-blue-300'
      case 'in-progress':
        return 'border-amber-600 bg-amber-900/20 text-amber-300'
      case 'completed':
        return 'border-green-600 bg-green-900/20 text-green-300'
      default:
        return 'border-neutral-600 bg-neutral-900/20 text-neutral-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programmée'
      case 'in-progress':
        return 'En cours'
      case 'completed':
        return 'Terminée'
      default:
        return status
    }
  }

  const getVehicleTypeDisplay = () => {
    if (!ride.vehicle_type) return "Standard"
    return ride.vehicle_type.charAt(0).toUpperCase() + ride.vehicle_type.slice(1)
  }

  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader className="border-b border-neutral-800 bg-neutral-950/50 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-200">
              {formattedDateTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getVehicleTypeDisplay()}
            </Badge>
            <Badge className={getStatusColor(ride.status)}>
              {getStatusText(ride.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Trajet */}
        <div className="space-y-3">
          <div className="flex">
            <div className="mr-3 flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              <div className="h-6 w-0.5 bg-neutral-700"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <p className="text-xs font-medium text-green-400">DÉPART</p>
                <p className="text-sm text-neutral-200">{ride.pickup_address}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-red-400">DESTINATION</p>
                <p className="text-sm text-neutral-200">{ride.dropoff_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prix */}
        <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
          <span className="text-sm text-neutral-400">Prix</span>
          <span className="text-lg font-semibold text-green-400">
            {ride.estimated_price ? formatCurrency(ride.estimated_price) : "N/A"}
          </span>
        </div>

        {/* Actions selon le statut */}
        <div className="flex gap-2">
          {ride.status === 'scheduled' && (
            <>
              {onNavigate && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 py-2 inline-flex items-center justify-center text-sm font-medium h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 ease-out rounded-md"
                  onClick={() => onNavigate(ride.id)}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Naviguer
                </Button>
              )}
              {onStart && (
                <Button
                  size="sm"
                  className="flex-1 py-2 inline-flex items-center justify-center text-sm font-medium h-11 px-8 bg-gradient-to-r from-amber-400 to-amber-300 text-white hover:from-amber-400 hover:to-amber-300 transition-all duration-300 ease-out rounded-md"
                  onClick={() => onStart(ride.id)}
                >
                  Démarrer
                </Button>
              )}
            </>
          )}
          
          {ride.status === 'in-progress' && onComplete && (
            <Button
              size="sm"
            className="w-full py-2 inline-flex items-center justify-center text-sm font-medium h-11 px-8 bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-600 hover:to-green-500 transition-all duration-300 ease-out rounded-md"
              onClick={() => onComplete(ride.id)}
            >
              Terminer la course
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
