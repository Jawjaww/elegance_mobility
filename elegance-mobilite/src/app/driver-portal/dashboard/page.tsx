'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Car, Clock, DollarSign, Star, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useDriverStore } from '@/stores/driverStore'
import { useRealtimeRides } from '@/hooks/useRealtimeRides'
import { useDriverLocation } from '@/hooks/useDriverLocation'
import { useWakeLock } from '@/hooks/useWakeLock'
import { usePWA } from '@/hooks/usePWA'
import { OnlineToggle } from '@/components/driver/OnlineToggle'
import { RideRequestModal } from '@/components/driver/RideRequestModal'
import { DriverMap } from '@/components/driver/DriverMap'
import { Button } from '@/components/ui/button'

export default function DriverDashboardPage() {
  const { isOnline, stats, activeRide } = useDriverStore()
  const { hasPendingRide } = useRealtimeRides()
  const { isInstalled, canInstall, install } = usePWA()
  
  // Activer les features quand online
  useDriverLocation(isOnline)
  useWakeLock(isOnline)

  // Demander permission notifs au premier online
  useEffect(() => {
    if (isOnline && 'Notification' in window) {
      Notification.requestPermission()
    }
  }, [isOnline])

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      {/* Status indicator en haut (pas de header complet car déjà dans layout) */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
          <span className="text-sm text-neutral-400">
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
        {stats.todayRides > 0 && (
          <span className="text-sm text-neutral-400">
            {stats.todayRides} course{stats.todayRides > 1 ? 's' : ''} aujourd'hui
          </span>
        )}
      </div>

      <div className="px-4 py-2 space-y-4">
        {/* Install PWA prompt (if not installed) */}
        {!isInstalled && canInstall && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-white">Installer l&apos;app</p>
              <p className="text-sm text-blue-200">Pour recevoir les courses en arrière-plan</p>
            </div>
            <Button 
              onClick={install}
              variant="secondary"
              size="sm"
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              Installer
            </Button>
          </motion.div>
        )}

        {/* Map (only when online) */}
        {isOnline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[300px] rounded-2xl overflow-hidden"
          >
            <DriverMap />
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-green-500" />}
            value={`${stats.todayEarnings.toFixed(2)}€`}
            label="Aujourd'hui"
            trend="+12%"
          />
          <StatCard
            icon={<Car className="w-5 h-5 text-blue-500" />}
            value={stats.todayRides.toString()}
            label="Courses"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-purple-500" />}
            value={`${Math.floor(stats.onlineTimeMinutes / 60)}h${stats.onlineTimeMinutes % 60}m`}
            label="En ligne"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-yellow-500" />}
            value={stats.rating > 0 ? stats.rating.toFixed(1) : '--'}
            label="Note"
          />
        </motion.div>

        {/* Main Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <OnlineToggle />
        </motion.div>

        {/* Status message */}
        {isOnline && !hasPendingRide && !activeRide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-neutral-600 animate-bounce" />
            </div>
            <p className="text-neutral-400">En attente de courses...</p>
            <p className="text-sm text-neutral-600 mt-1">Restez dans une zone active</p>
          </motion.div>
        )}

        {/* Active ride indicator */}
        {activeRide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-600 rounded-xl p-4"
          >
            <p className="font-bold text-white mb-1">🚗 Course en cours</p>
            <p className="text-blue-200 text-sm mb-3">{activeRide.pickup_address}</p>
            <Link href={`/driver-portal/rides/${activeRide.id}`}>
              <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                Voir la course
              </Button>
            </Link>
          </motion.div>
        )}
      </div>

      {/* Ride Request Modal (slides up) */}
      <RideRequestModal />

      {/* Install prompt for iOS (Safari doesn't support beforeinstallprompt) */}
      {!isInstalled && !canInstall && (
        <div className="fixed bottom-20 left-4 right-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-sm text-neutral-400">
            📱 Pour installer: Touchez 
            <span className="inline-flex items-center mx-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
            </span>
            puis &quot;Sur l&apos;écran d&apos;accueil&quot;
          </p>
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  icon, 
  value, 
  label, 
  trend 
}: { 
  icon: React.ReactNode
  value: string
  label: string
  trend?: string 
}) {
  return (
    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 bg-neutral-800 rounded-lg">{icon}</div>
        {trend && (
          <span className="text-xs text-green-500 font-medium">{trend}</span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  )
}
