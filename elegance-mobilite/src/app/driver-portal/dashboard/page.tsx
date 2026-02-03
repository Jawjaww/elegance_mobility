'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  Clock, 
  MapPin, 
  Navigation, 
  User, 
  ArrowRight, 
  X,
  Menu,
  Star,
  Phone,
  MessageCircle,
  TrendingUp
} from 'lucide-react'
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
  const [sheetOpen, setSheetOpen] = useState(false)
  
  useDriverLocation(isOnline)
  useWakeLock(isOnline)

  useEffect(() => {
    if (isOnline && 'Notification' in window) {
      Notification.requestPermission()
    }
  }, [isOnline])

  // Auto-expand sheet when ride arrives
  useEffect(() => {
    if (availableRide) {
      setSheetOpen(true)
    }
  }, [availableRide])

  const pickupLocation = availableRide ? {
    lat: availableRide.pickup_lat,
    lng: availableRide.pickup_lng
  } : null

  const dropoffLocation = availableRide ? {
    lat: availableRide.dropoff_lat,
    lng: availableRide.dropoff_lng
  } : null

  return (
    <div className="relative w-full h-full">
      {/* Map - Full screen behind everything */}
      <div className="absolute inset-0">
        <DriverMap 
          pickup={pickupLocation} 
          dropoff={dropoffLocation}
          showRoute={!!availableRide}
        />
      </div>

      {/* Top floating bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Menu className="w-5 h-5 text-neutral-900" />
          </button>

          <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-neutral-400'}`} />
            <span className="text-sm font-medium text-neutral-900">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>

          <button className="bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-bold text-neutral-900">{stats.todayEarnings.toFixed(0)}€</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet - Always visible, sits at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <AnimatePresence mode="wait">
          {availableRide ? (
            <RideSheet 
              key="ride"
              ride={availableRide}
              onAccept={() => acceptRide(availableRide.id)}
              onDecline={declineRide}
            />
          ) : (
            <DashboardSheet 
              key="dashboard"
              stats={stats}
              isOnline={isOnline}
              isInstalled={isInstalled}
              canInstall={canInstall}
              install={install}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Dashboard Bottom Sheet
function DashboardSheet({ stats, isOnline, isInstalled, canInstall, install }: any) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="bg-white rounded-t-3xl shadow-2xl"
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1 bg-neutral-300 rounded-full" />
      </div>

      <div className="px-4 pb-6">
        {/* Stats Row */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-neutral-100 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-neutral-900">{stats.todayRides}</p>
            <p className="text-xs text-neutral-500">Courses</p>
          </div>
          <div className="flex-1 bg-neutral-100 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-neutral-900">{stats.todayEarnings.toFixed(0)}€</p>
            <p className="text-xs text-neutral-500">Gains</p>
          </div>
          <div className="flex-1 bg-neutral-100 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-neutral-900">{stats.rating > 0 ? stats.rating.toFixed(1) : '--'}</p>
            <p className="text-xs text-neutral-500">Note</p>
          </div>
        </div>

        {/* Online Toggle */}
        <OnlineToggle />

        {/* PWA Install */}
        {!isInstalled && canInstall && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={install}
            className="mt-4 w-full bg-blue-600 text-white rounded-xl py-3 font-medium"
          >
            Installer l&apos;app
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// Ride Request Bottom Sheet
function RideSheet({ ride, onAccept, onDecline }: any) {
  const [countdown, setCountdown] = useState(20)

  useEffect(() => {
    if (countdown <= 0) {
      onDecline()
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, onDecline])

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto"
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white">
        <div className="w-12 h-1 bg-neutral-300 rounded-full" />
      </div>

      <div className="px-4 pb-6">
        {/* Header */}
        <div className="text-center mb-4">
          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
            Nouvelle course
          </span>
          <h2 className="text-3xl font-bold text-neutral-900">{ride.price.toFixed(2)}€</h2>
          <p className="text-neutral-500">{ride.estimated_duration_min} min • {ride.distance_km} km</p>
          
          {/* Countdown bar */}
          <div className="mt-3 mx-auto max-w-[200px] h-1 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-green-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(countdown / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Route */}
        <div className="bg-neutral-50 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Prise en charge</p>
              <p className="font-medium text-neutral-900">{ride.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Destination</p>
              <p className="font-medium text-neutral-900">{ride.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Passenger */}
        {ride.passenger_name && (
          <div className="flex items-center justify-between bg-neutral-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{ride.passenger_name}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-neutral-600">{ride.passenger_rating || '4.8'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-neutral-700" />
              </button>
              <button className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-neutral-700" />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <Button
          onClick={onAccept}
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-lg mb-2"
        >
          ACCEPTER
        </Button>
        <Button
          onClick={onDecline}
          variant="ghost"
          className="w-full text-neutral-500 h-12"
        >
          Passer
        </Button>
      </div>
    </motion.div>
  )
}
