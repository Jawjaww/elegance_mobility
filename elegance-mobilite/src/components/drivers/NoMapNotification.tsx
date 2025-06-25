/**
 * NoMapNotification - Notification de course SANS carte
 * Évite complètement les erreurs de réinitialisation de cartes
 */

'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Clock, 
  Euro, 
  Navigation, 
  X, 
  Car,
  Timer,
  Route,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/types/database.types'

type RideRow = Database['public']['Tables']['rides']['Row']

interface NoMapNotificationProps {
  ride: RideRow
  onAccept: (rideId: string) => void
  onDecline: (rideId: string) => void
  onDismiss: () => void
  driverLocation?: { lat: number; lon: number }
}

export default function NoMapNotification({
  ride,
  onAccept,
  onDecline,
  onDismiss,
  driverLocation
}: NoMapNotificationProps) {

  // Calculer la distance estimée (simple calcul)
  const estimatedDistance = driverLocation && ride.pickup_lat && ride.pickup_lon 
    ? Math.sqrt(
        Math.pow(driverLocation.lat - ride.pickup_lat, 2) + 
        Math.pow(driverLocation.lon - ride.pickup_lon, 2)
      ) * 111 // Approximation km
    : null

  const estimatedTime = estimatedDistance ? Math.round(estimatedDistance * 2) : null // Minutes

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden border-green-200 bg-white shadow-xl">
          {/* Header avec badge nouvelle course */}
          <CardHeader className="relative bg-gradient-to-r from-green-500 to-green-600 pb-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Nouvelle course</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {ride.vehicle_type || 'Standard'}
                  </Badge>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Informations de trajet */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <MapPin className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Départ</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {ride.pickup_address}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                  <MapPin className="h-3 w-3 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Arrivée</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {ride.dropoff_address}
                  </p>
                </div>
              </div>
            </div>

            {/* Informations de course */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-gray-500">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm">Distance</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {estimatedDistance ? `${estimatedDistance.toFixed(1)} km` : '~5 km'}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Temps</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {estimatedTime ? `${estimatedTime} min` : '~10 min'}
                </p>
              </div>
            </div>

            {/* Prix estimé */}
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="flex items-center justify-center space-x-1 text-green-600">
                <Euro className="h-5 w-5" />
                <span className="text-lg font-bold">
                  {ride.price ? `${(ride.price / 100).toFixed(2)} €` : 
                   ride.estimated_price ? `${(ride.estimated_price / 100).toFixed(2)} €` : 
                   '25.00 €'}
                </span>
              </div>
              <p className="text-sm text-green-600">Prix estimé</p>
            </div>

            {/* Notes additionnelles */}
            {ride.pickup_notes && (
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="flex items-center space-x-2 text-blue-600">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm font-medium">Note du client</span>
                </div>
                <p className="mt-1 text-sm text-blue-700">{ride.pickup_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onDecline(ride.id)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Refuser
              </Button>
              <Button
                onClick={() => onAccept(ride.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Accepter
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
