'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  Clock, 
  MapPin, 
  Navigation, 
  User, 
  Menu,
  Star,
  Phone,
  MessageCircle
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
  const { acceptRide, declineRide } = useRealtimeRides()
  const { isInstalled, canInstall, install } = usePWA()
  
  useDriverLocation(isOnline)
  useWakeLock(isOnline)

  useEffect(() => {
    if (isOnline && 'Notification' in window) {
      Notification.requestPermission()
    }
  }, [isOnline])

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
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <DriverMap 
          pickup={pickupLocation} 
          dropoff={dropoffLocation}
          showRoute={!!availableRide}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button className="w-10 h-10 bg-neutral-900/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg border border-white/10">
            <Menu className="w-5 h-5 text-white" />
          </button>

          <div className="bg-neutral-900/90 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-white/10">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-neutral-500'}`} />
            <span className="text-sm font-medium text-white">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>

          <button className="bg-neutral-900/90 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-white/10">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="font-bold text-white">{stats.todayEarnings.toFixed(0)}€</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet */}
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

function DashboardSheet({ stats, isOnline, isInstalled, canInstall, install }: any) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-white/10"
    >
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1 bg-neutral-700 rounded-full" />
      </div>

      <div className="px-4 pb-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatBox value={stats.todayRides} label="Courses" />
          <StatBox value={`${stats.todayEarnings.toFixed(0)}€`} label="Gains" />
          <StatBox value={stats.rating > 0 ? stats.rating.toFixed(1) : '--'} label="Note" />
        </div>

        <OnlineToggle />

        {isInstalled === false && canInstall && (
          <Button onClick={install} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
            Installer l&apos;app
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function StatBox({ value, label }: { value: string | number, label: string }) {
  return (
    <div className="bg-neutral-800 rounded-2xl p-3 text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  )
}

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
      className="bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-white/10 max-h-[70vh] overflow-y-auto"
    >
      <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-neutral-900">
        <div className="w-12 h-1 bg-neutral-700 rounded-full" />
      </div>

      <div className="px-4 pb-6">
        {/* Header */}
        <div className="text-center mb-4">
          <span className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium mb-2">
            Nouvelle course
          </span>
          <h2 className="text-3xl font-bold text-white">{ride.price.toFixed(2)}€</h2>
          <p className="text-neutral-400">{ride.estimated_duration_min} min • {ride.distance_km} km</p>
          
          <div className="mt-3 mx-auto max-w-[200px] h-1 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-green-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(countdown / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Route */}
        <div className="bg-neutral-800 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Prise en charge</p>
              <p className="text-white font-medium">{ride.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Destination</p>
              <p className="text-white font-medium">{ride.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Passenger */}
        {ride.passenger_name && (
          <div className="bg-neutral-800 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{ride.passenger_name}</p>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <span className="text-sm">{ride.passenger_rating || '4.8'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-600">
                  <Phone className="w-4 h-4 text-white" />
                </button>
                <button className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-600">
                  <MessageCircle className="w-4 h-4 text-white" />
                </button>
              </div>
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
