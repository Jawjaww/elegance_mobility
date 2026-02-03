'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Clock, MapPin, Navigation, User, ArrowRight, X } from 'lucide-react'
import { useDriverStore } from '@/stores/driverStore'
import { useRealtimeRides } from '@/hooks/useRealtimeRides'
import { useDriverLocation } from '@/hooks/useDriverLocation'
import { useWakeLock } from '@/hooks/useWakeLock'
import { usePWA } from '@/hooks/usePWA'
import { OnlineToggle } from '@/components/driver/OnlineToggle'
import { DriverMap } from '@/components/driver/DriverMap'
import { Button } from '@/components/ui/button'

export default function DriverDashboardPage() {
  const { isOnline, stats, availableRide } = useDriverStore()
  const { hasPendingRide, acceptRide, declineRide } = useRealtimeRides()
  const { isInstalled, canInstall, install } = usePWA()
  
  useDriverLocation(isOnline)
  useWakeLock(isOnline)

  useEffect(() => {
    if (isOnline && 'Notification' in window) {
      Notification.requestPermission()
    }
  }, [isOnline])

  // Prepare pickup/dropoff for map
  const pickupLocation = availableRide ? {
    lat: availableRide.pickup_lat,
    lng: availableRide.pickup_lng
  } : null

  const dropoffLocation = availableRide ? {
    lat: availableRide.dropoff_lat,
    lng: availableRide.dropoff_lng
  } : null

  return (
    <div className="fixed inset-0 bg-neutral-950">
      {/* Full screen map as background */}
      <div className="absolute inset-0 h-full w-full">
        <DriverMap 
          pickup={pickupLocation} 
          dropoff={dropoffLocation}
          showRoute={!!availableRide}
        />
      </div>

      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-4 bg-gradient-to-b from-neutral-950/80 to-transparent">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-neutral-950/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">E</span>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Statut</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
                <span className="text-sm font-medium text-white">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            </div>
          </div>

          {/* Earnings pill */}
          <div className="bg-neutral-950/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="font-bold text-white">{stats.todayEarnings.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        {/* PWA Install Banner */}
        {!isInstalled && canInstall && !hasPendingRide && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-4 mb-4"
          >
            <div className="max-w-lg mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Installer l&apos;app</p>
                  <p className="text-xs text-blue-200">Pour recevoir les courses en temps réel</p>
                </div>
              </div>
              <Button 
                onClick={install}
                size="sm"
                className="bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold"
              >
                Installer
              </Button>
            </div>
          </motion.div>
        )}

        {/* Main controls */}
        {!hasPendingRide && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="px-4 pb-8"
          >
            <div className="max-w-lg mx-auto space-y-4">
              {/* Stats row */}
              <div className="flex gap-3">
                <div className="flex-1 bg-neutral-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.todayRides}</p>
                      <p className="text-xs text-neutral-400">Courses</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-neutral-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {Math.floor(stats.onlineTimeMinutes / 60)}h{stats.onlineTimeMinutes % 60}
                      </p>
                      <p className="text-xs text-neutral-400">En ligne</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Toggle */}
              <OnlineToggle />
            </div>
          </motion.div>
        )}

        {/* Ride Request Bottom Sheet */}
        {availableRide && (
          <RideRequestSheet 
            ride={availableRide}
            onAccept={() => acceptRide(availableRide.id)}
            onDecline={declineRide}
          />
        )}
      </div>
    </div>
  )
}

// Ride Request Sheet Component
function RideRequestSheet({ 
  ride, 
  onAccept, 
  onDecline 
}: { 
  ride: any
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="bg-neutral-950 rounded-t-[2.5rem] border-t border-white/10 shadow-2xl"
    >
      {/* Handle */}
      <div className="flex justify-center pt-4 pb-2">
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
      </div>

      <div className="px-6 pb-8 max-h-[60vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                Nouvelle course
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{ride.price.toFixed(2)}€</h2>
            <p className="text-neutral-400 text-sm">{ride.estimated_duration_min} min • {ride.distance_km} km</p>
          </div>
          <button 
            onClick={onDecline}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Route visualization */}
        <div className="bg-neutral-900 rounded-2xl p-4 mb-6 border border-white/5">
          {/* Pickup */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="absolute top-10 left-1/2 w-0.5 h-8 bg-neutral-700 -translate-x-1/2" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Départ</p>
              <p className="text-white font-medium">{ride.pickup_address}</p>
            </div>
          </div>

          {/* Dropoff */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Destination</p>
              <p className="text-white font-medium">{ride.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Passenger */}
        {ride.passenger_name && (
          <div className="flex items-center gap-4 bg-neutral-900 rounded-2xl p-4 mb-6 border border-white/5">
            <div className="w-12 h-12 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-neutral-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{ride.passenger_name}</p>
              <p className="text-sm text-neutral-400">{ride.passenger_rating ? `⭐ ${ride.passenger_rating}` : 'Nouveau client'}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onAccept}
            className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-xl shadow-green-500/25"
          >
            <span className="flex items-center gap-2">
              ACCEPTER LA COURSE
              <ArrowRight className="w-5 h-5" />
            </span>
          </Button>
          
          <Button
            onClick={onDecline}
            variant="ghost"
            className="w-full text-neutral-500 hover:text-neutral-300 h-12"
          >
            Passer cette course
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
