'use client'

import { useState } from "react"
import DynamicMapLibreMap from "@/components/map/DynamicMapLibreMap"
import { RideRequestCard } from "./RideRequestCard"
import { motion, AnimatePresence } from "framer-motion"
import { Car, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/lib/types/database.types"

type RideRow = Database["public"]["Tables"]["rides"]["Row"]

interface MapWithRidesProps {
  availableRides: RideRow[]
  onAcceptRide: (rideId: string) => void
  onDeclineRide: (rideId: string) => void
  className?: string
}

export function MapWithRides({ 
  availableRides, 
  onAcceptRide, 
  onDeclineRide,
  className 
}: MapWithRidesProps) {
  const [selectedRide, setSelectedRide] = useState<RideRow | null>(null)
  const [showRidesList, setShowRidesList] = useState(false)
  
  // Convertir la première course en location pour la carte
  const mapLocation = availableRides.length > 0 ? {
    lat: availableRides[0].pickup_lat || 48.8566,
    lon: availableRides[0].pickup_lon || 2.3522,
    display_name: availableRides[0].pickup_address
  } : null

  const handleRideClick = (ride: RideRow) => {
    setSelectedRide(ride)
  }

  const handleAccept = (rideId: string) => {
    onAcceptRide(rideId)
    setSelectedRide(null)
  }

  const handleDecline = (rideId: string) => {
    onDeclineRide(rideId)
    setSelectedRide(null)
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Carte */}
      <div className="absolute inset-0">
        <DynamicMapLibreMap
          origin={mapLocation}
          destination={null}
          enableRouting={false}
        />
      </div>

      {/* Overlay - Bouton pour afficher les courses */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={() => setShowRidesList(!showRidesList)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          <Car className="h-4 w-4 mr-2" />
          Courses
          {availableRides.length > 0 && (
            <Badge className="ml-2 bg-red-600 text-white">
              {availableRides.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Liste des courses - Slide depuis la droite */}
      <AnimatePresence>
        {showRidesList && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 w-80 h-full bg-neutral-900/95 backdrop-blur-xl border-l border-neutral-800 z-20"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Nouvelles courses
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRidesList(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {availableRides.length === 0 ? (
                  <p className="text-neutral-400 text-center py-8">
                    Aucune course disponible
                  </p>
                ) : (
                  availableRides.map((ride) => (
                    <motion.div
                      key={ride.id}
                      layoutId={`ride-${ride.id}`}
                      className="cursor-pointer"
                      onClick={() => handleRideClick(ride)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RideRequestCard
                        ride={ride}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        timeRemaining={120}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de détail d'une course */}
      <AnimatePresence>
        {selectedRide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4"
            onClick={() => setSelectedRide(null)}
          >
            <motion.div
              layoutId={`ride-${selectedRide.id}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <RideRequestCard
                ride={selectedRide}
                onAccept={handleAccept}
                onDecline={handleDecline}
                timeRemaining={120}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
