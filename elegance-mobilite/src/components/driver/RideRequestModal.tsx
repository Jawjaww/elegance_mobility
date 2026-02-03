'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Clock, Star, DollarSign, User, X } from 'lucide-react'
import { useDriverStore } from '@/stores/driverStore'
import { useRealtimeRides } from '@/hooks/useRealtimeRides'
import { cn } from '@/lib/utils'

const COUNTDOWN_SECONDS = 15

export function RideRequestModal() {
  const { availableRide } = useDriverStore()
  const { acceptRide, declineRide } = useRealtimeRides()
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isAccepting, setIsAccepting] = useState(false)

  // Compte à rebours
  useEffect(() => {
    if (!availableRide) {
      setCountdown(COUNTDOWN_SECONDS)
      return
    }

    setCountdown(COUNTDOWN_SECONDS)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          declineRide()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [availableRide, declineRide])

  const handleAccept = useCallback(async () => {
    if (!availableRide || isAccepting) return
    setIsAccepting(true)
    try {
      await acceptRide(availableRide.id)
    } finally {
      setIsAccepting(false)
    }
  }, [availableRide, acceptRide, isAccepting])

  const handleDecline = useCallback(() => {
    declineRide()
  }, [declineRide])

  return (
    <AnimatePresence>
      {availableRide && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 bg-neutral-950 rounded-t-3xl shadow-2xl border-t border-neutral-800"
        >
          {/* Handle drag */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1 bg-neutral-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 pt-2 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔔</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Nouvelle course !</h3>
                  <p className="text-sm text-neutral-400">Acceptez rapidement</p>
                </div>
              </div>
              <button 
                onClick={handleDecline}
                className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Countdown bar */}
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: '100%' }}
                animate={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
                style={{ 
                  backgroundColor: countdown <= 5 ? '#ef4444' : countdown <= 10 ? '#f59e0b' : '#22c55e'
                }}
              />
            </div>

            {/* Route info */}
            <div className="space-y-3 mb-4">
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Prise en charge</p>
                  <p className="text-white font-medium truncate">{availableRide.pickup_address}</p>
                </div>
              </div>

              {/* Dropoff */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Navigation className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Destination</p>
                  <p className="text-white font-medium truncate">{availableRide.dropoff_address}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-neutral-900 rounded-xl p-3 text-center">
                <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{availableRide.price.toFixed(2)}€</p>
                <p className="text-xs text-neutral-500">Course</p>
              </div>
              <div className="bg-neutral-900 rounded-xl p-3 text-center">
                <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{availableRide.estimated_duration_min} min</p>
                <p className="text-xs text-neutral-500">Durée</p>
              </div>
              <div className="bg-neutral-900 rounded-xl p-3 text-center">
                <Navigation className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{availableRide.distance_km.toFixed(1)} km</p>
                <p className="text-xs text-neutral-500">Distance</p>
              </div>
            </div>

            {/* Passenger info */}
            {availableRide.passenger_name && (
              <div className="flex items-center gap-3 bg-neutral-900 rounded-xl p-3 mb-4">
                <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{availableRide.passenger_name}</p>
                  {availableRide.passenger_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-neutral-400">{availableRide.passenger_rating}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className={cn(
                  "w-full h-14 text-lg font-bold rounded-xl transition-all",
                  countdown <= 5 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-green-600 hover:bg-green-700"
                )}
              >
                {isAccepting ? (
                  "Acceptation..."
                ) : (
                  <>
                    🎯 ACCEPTER ({countdown}s)
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDecline}
                variant="ghost"
                className="w-full text-neutral-500 hover:text-neutral-300"
              >
                Passer cette course
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
