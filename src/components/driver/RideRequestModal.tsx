'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Clock, Star, DollarSign, User, X, ArrowRight } from 'lucide-react'
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

  // Progress percentage
  const progress = (countdown / COUNTDOWN_SECONDS) * 100

  return (
    <AnimatePresence>
      {availableRide && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50"
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10" />
          
          {/* Modal content */}
          <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-t-[2.5rem] border-t border-white/10 shadow-2xl">
            {/* Handle drag */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
            </div>

            {/* Progress bar */}
            <div className="px-6 mb-4">
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full transition-colors duration-300",
                    countdown <= 5 ? "bg-red-500" : countdown <= 10 ? "bg-orange-500" : "bg-green-500"
                  )}
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </div>

            <div className="px-6 pb-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <span className="text-3xl">🚗</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Nouvelle course !</h3>
                    <p className="text-neutral-400 text-sm">
                      Départ dans {countdown} secondes
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleDecline}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Route */}
              <div className="bg-neutral-800/50 rounded-2xl p-4 mb-6 border border-white/5">
                {/* Pickup */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="absolute top-10 left-1/2 w-0.5 h-8 bg-neutral-700 -trangray-x-1/2" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Prise en charge</p>
                    <p className="text-white font-medium leading-snug">{availableRide.pickup_address}</p>
                  </div>
                </div>

                {/* Dropoff */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Destination</p>
                    <p className="text-white font-medium leading-snug">{availableRide.dropoff_address}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <StatBox
                  icon={<DollarSign className="w-5 h-5" />}
                  value={`${availableRide.price.toFixed(2)}€`}
                  label="Course"
                  color="green"
                />
                <StatBox
                  icon={<Clock className="w-5 h-5" />}
                  value={`${availableRide.estimated_duration_min} min`}
                  label="Durée"
                  color="blue"
                />
                <StatBox
                  icon={<Navigation className="w-5 h-5" />}
                  value={`${availableRide.distance_km.toFixed(1)} km`}
                  label="Distance"
                  color="purple"
                />
              </div>

              {/* Passenger */}
              {availableRide.passenger_name && (
                <div className="flex items-center gap-3 bg-neutral-800/30 rounded-xl p-4 mb-6 border border-white/5">
                  <div className="w-12 h-12 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-neutral-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{availableRide.passenger_name}</p>
                    {availableRide.passenger_rating && (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-neutral-400">{availableRide.passenger_rating} • Client vérifié</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className={cn(
                      "w-full h-16 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl",
                      countdown <= 5 
                        ? "bg-gradient-to-r from-red-600 to-red-700 shadow-red-600/30" 
                        : "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30 hover:shadow-green-500/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isAccepting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Acceptation...
                        </>
                      ) : (
                        <>
                          <span>ACCEPTER</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </div>
                  </Button>
                </motion.div>
                
                <Button
                  onClick={handleDecline}
                  variant="ghost"
                  className="w-full text-neutral-500 hover:text-neutral-300 hover:bg-white/5 h-12 rounded-xl"
                >
                  Passer cette course
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Stat Box Component
function StatBox({ 
  icon, 
  value, 
  label,
  color = "green"
}: { 
  icon: React.ReactNode
  value: string
  label: string
  color?: "green" | "blue" | "purple"
}) {
  const colorClasses = {
    green: "from-green-500/20 to-green-600/10 text-green-400",
    blue: "from-blue-500/20 to-blue-600/10 text-blue-400",
    purple: "from-purple-500/20 to-purple-600/10 text-purple-400",
  }

  return (
    <div className={cn(
      "bg-gradient-to-br rounded-2xl p-4 text-center border border-white/5",
      colorClasses[color]
    )}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  )
}
