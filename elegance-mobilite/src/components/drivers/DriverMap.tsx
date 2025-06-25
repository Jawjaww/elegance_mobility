'use client'

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LocateFixed, Navigation, Car, Clock, Euro } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DynamicMapLibreMap from "@/components/map/DynamicMapLibreMap"
import type { Database } from "@/lib/types/database.types"

type RideRow = Database["public"]["Tables"]["rides"]["Row"]

interface DriverMapProps {
  availableRides: RideRow[]
  onAcceptRide: (rideId: string) => void
  onDeclineRide: (rideId: string) => void
  onRecenterMap?: (recenterFn: () => void) => void
  className?: string
}

interface UserLocation {
  lat: number
  lon: number
  accuracy?: number
}

export function DriverMap({ 
  availableRides, 
  onAcceptRide, 
  onDeclineRide,
  onRecenterMap,
  className = ''
}: DriverMapProps) {
  console.log('🚗 DriverMap render:', { 
    availableRidesCount: availableRides.length,
    timestamp: new Date().toISOString() 
  })
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [selectedRide, setSelectedRide] = useState<RideRow | null>(null)
  const [showRideRequests, setShowRideRequests] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  // Géolocalisation en temps réel
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Géolocalisation non supportée")
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache 1 minute
    }

    const successCallback = (position: GeolocationPosition) => {
      setUserLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy
      })
      setLocationError(null)
      setIsLocating(false)
    }

    const errorCallback = (error: GeolocationPositionError) => {
      let message = "Erreur de géolocalisation"
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Autorisation de localisation refusée"
          break
        case error.POSITION_UNAVAILABLE:
          message = "Position indisponible"
          break
        case error.TIMEOUT:
          message = "Délai de localisation dépassé"
          break
      }
      setLocationError(message)
      setIsLocating(false)
    }

    // Position initiale
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)

    // Suivi en temps réel
    watchIdRef.current = navigator.geolocation.watchPosition(
      successCallback, 
      errorCallback, 
      { ...options, maximumAge: 30000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Recentrer sur la position utilisateur
  const recenterMap = () => {
    if (!userLocation) {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
          setIsLocating(false)
        },
        (error) => {
          setLocationError("Impossible de récupérer la position")
          setIsLocating(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  // Format du prix
  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2)
  }

  // Format du temps
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffMinutes = Math.round((date.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffMinutes < 0) return "Maintenant"
    if (diffMinutes < 60) return `${diffMinutes} min`
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`
  }

  const handleRideSelect = (ride: RideRow) => {
    setSelectedRide(ride)
  }

  const handleAccept = () => {
    if (selectedRide) {
      onAcceptRide(selectedRide.id)
      setSelectedRide(null)
    }
  }

  const handleDecline = () => {
    if (selectedRide) {
      onDeclineRide(selectedRide.id)
      setSelectedRide(null)
    }
  }

  // Position pour la carte - utilisateur ou première course
  const mapLocation = userLocation ? {
    lat: userLocation.lat,
    lon: userLocation.lon,
    display_name: "Ma position"
  } : availableRides.length > 0 ? {
    lat: availableRides[0].pickup_lat || 48.8566,
    lon: availableRides[0].pickup_lon || 2.3522,
    display_name: availableRides[0].pickup_address
  } : null

  return (
    <>
      {/* Carte principale plein écran - Background complet */}
      <DynamicMapLibreMap
        origin={mapLocation}
        destination={selectedRide ? {
          lat: selectedRide.pickup_lat || 0,
          lon: selectedRide.pickup_lon || 0,
          display_name: selectedRide.pickup_address
        } : null}
        enableRouting={!!selectedRide}
      />

      {/* Contrôles de la carte */}
      <div className="absolute top-4 right-4 z-20 space-y-3">
        {/* Bouton de recentrage */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <Button
            size="icon"
            variant="outline"
            onClick={recenterMap}
            disabled={isLocating}
            className="bg-white/90 border-white/20 shadow-lg backdrop-blur-sm hover:bg-white"
          >
            <motion.div
              animate={{ rotate: isLocating ? 360 : 0 }}
              transition={{ duration: 1, repeat: isLocating ? Infinity : 0, ease: "linear" }}
            >
              <LocateFixed className="h-5 w-5 text-neutral-700" />
            </motion.div>
          </Button>
        </motion.div>

        {/* Indicateur de précision GPS */}
        {userLocation?.accuracy && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1"
          >
            <span className="text-xs text-neutral-600">
              GPS ±{Math.round(userLocation.accuracy)}m
            </span>
          </motion.div>
        )}
      </div>

      {/* Badge du nombre de courses disponibles */}
      <AnimatePresence>
        {availableRides.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 z-20"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRideRequests(!showRideRequests)}
              className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-lg backdrop-blur-sm"
            >
              <Car className="h-4 w-4 mr-2" />
              {availableRides.length} course{availableRides.length > 1 ? 's' : ''}
              <Badge className="ml-2 bg-white text-blue-600">
                {availableRides.length}
              </Badge>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel des courses disponibles */}
      <AnimatePresence>
        {showRideRequests && availableRides.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute left-4 top-20 bottom-4 w-80 z-20"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl h-full overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-900">Courses disponibles</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRideRequests(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              
              <div className="overflow-y-auto h-full pb-20">
                {availableRides.map((ride) => (
                  <motion.div
                    key={ride.id}
                    className="p-4 border-b border-neutral-100 cursor-pointer hover:bg-neutral-50"
                    onClick={() => handleRideSelect(ride)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {ride.vehicle_type}
                        </Badge>
                        <div className="flex items-center text-green-600 font-semibold">
                          <Euro className="h-4 w-4 mr-1" />
                          {formatPrice(ride.estimated_price || 0)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900">
                              {ride.pickup_address}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-neutral-600">
                              {ride.dropoff_address}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs text-neutral-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Prise en charge dans {formatTime(ride.pickup_time)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de détail de course */}
      <AnimatePresence>
        {selectedRide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-end"
            onClick={() => setSelectedRide(null)}
          >
            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-3xl p-6 pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-neutral-900">Nouvelle course</h3>
                  <div className="flex items-center text-2xl font-bold text-green-600">
                    <Euro className="h-6 w-6 mr-1" />
                    {formatPrice(selectedRide.estimated_price || 0)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-4 h-4 rounded-full bg-green-500 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">Prise en charge</p>
                      <p className="text-neutral-600">{selectedRide.pickup_address}</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Dans {formatTime(selectedRide.pickup_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-4 h-4 rounded-full bg-red-500 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">Destination</p>
                      <p className="text-neutral-600">{selectedRide.dropoff_address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDecline}
                  >
                    Refuser
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleAccept}
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Accepter
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton de recentrage sur la position */}
      <div className="absolute bottom-24 right-4 z-20">
        <Button
          onClick={recenterMap}
          size="sm"
          className="h-12 w-12 rounded-full bg-white/90 backdrop-blur-sm text-neutral-700 hover:bg-white border border-neutral-200 shadow-lg"
          disabled={isLocating}
        >
          {isLocating ? (
            <div className="h-5 w-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <LocateFixed className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Erreur de géolocalisation */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-4 left-4 right-4 z-20"
          >
            <div className="bg-red-600 text-white p-3 rounded-lg shadow-lg">
              <p className="text-sm">{locationError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-red-600 border-red-200 bg-white/90"
                onClick={recenterMap}
              >
                Réessayer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Mémoriser le composant avec une comparaison intelligente
const DriverMapMemo = React.memo(DriverMap, (prevProps, nextProps) => {
  // Comparaison en profondeur pour les rides
  const prevRideIds = prevProps.availableRides.map(r => r.id).sort()
  const nextRideIds = nextProps.availableRides.map(r => r.id).sort()
  
  const ridesEqual = prevRideIds.length === nextRideIds.length && 
    prevRideIds.every((id, index) => id === nextRideIds[index])
    
  const propsEqual = ridesEqual && 
    prevProps.onAcceptRide === nextProps.onAcceptRide &&
    prevProps.onDeclineRide === nextProps.onDeclineRide &&
    prevProps.onRecenterMap === nextProps.onRecenterMap &&
    prevProps.className === nextProps.className
    
  if (!propsEqual) {
    console.log('🚗 DriverMap props changed:', {
      ridesChanged: !ridesEqual,
      prevCount: prevProps.availableRides.length,
      nextCount: nextProps.availableRides.length,
      prevIds: prevRideIds,
      nextIds: nextRideIds
    })
  }
  
  return propsEqual
})

export default DriverMapMemo
