'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Car, Clock, DollarSign, Star, MapPin, Zap, TrendingUp, Navigation } from 'lucide-react'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DriverDashboardPage() {
  const { isOnline, stats, activeRide } = useDriverStore()
  const { hasPendingRide } = useRealtimeRides()
  const { isInstalled, canInstall, install } = usePWA()
  
  useDriverLocation(isOnline)
  useWakeLock(isOnline)

  useEffect(() => {
    if (isOnline && 'Notification' in window) {
      Notification.requestPermission()
    }
  }, [isOnline])

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 pb-32"
    >
      {/* Main Content */}
      <div className="px-4 py-2 space-y-4">
        
        {/* Earnings Card - Glassmorphism */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden bg-gradient-to-br from-green-600/20 via-emerald-600/10 to-transparent backdrop-blur-sm border border-green-500/20 rounded-3xl p-6">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-neutral-400 text-sm">Gains aujourd&apos;hui</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-bold text-white">{stats.todayEarnings.toFixed(2)}€</h2>
                      <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +12%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <StatBadge 
                  icon={<Car className="w-4 h-4" />} 
                  value={stats.todayRides} 
                  label="Courses" 
                />
                <StatBadge 
                  icon={<Clock className="w-4 h-4" />} 
                  value={`${Math.floor(stats.onlineTimeMinutes / 60)}h${stats.onlineTimeMinutes % 60}`} 
                  label="Online" 
                />
                <StatBadge 
                  icon={<Star className="w-4 h-4" />} 
                  value={stats.rating > 0 ? stats.rating.toFixed(1) : '--'} 
                  label="Note" 
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Install PWA Banner */}
        {!isInstalled && canInstall && (
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-blue-600/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Installer l&apos;app</p>
                <p className="text-sm text-blue-200">Recevez les courses en temps réel</p>
              </div>
            </div>
            <Button 
              onClick={install}
              className="bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold"
            >
              Installer
            </Button>
          </motion.div>
        )}

        {/* Online Toggle - Main Action */}
        <motion.div variants={itemVariants}>
          <OnlineToggle />
        </motion.div>

        {/* Map Card */}
        {isOnline && (
          <motion.div 
            variants={itemVariants}
            className="relative"
          >
            <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Votre position</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">GPS actif</span>
                </div>
              </div>
              <div className="h-[250px]">
                <DriverMap />
              </div>
            </div>
          </motion.div>
        )}

        {/* Waiting State */}
        {isOnline && !hasPendingRide && !activeRide && (
          <motion.div 
            variants={itemVariants}
            className="text-center py-12"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20"
            >
              <MapPin className="w-10 h-10 text-green-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-1">En attente de courses</h3>
            <p className="text-neutral-400 text-sm">Restez dans une zone active pour recevoir plus de courses</p>
          </motion.div>
        )}

        {/* Active Ride Card */}
        {activeRide && (
          <motion.div 
            variants={itemVariants}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-5 shadow-lg shadow-blue-600/20"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-blue-200 text-sm font-medium">Course en cours</span>
                </div>
                <h3 className="text-xl font-bold text-white">{activeRide.pickup_address}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
            </div>
            <Link href={`/driver-portal/rides/${activeRide.id}`}>
              <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 rounded-xl h-12 font-semibold">
                Continuer la course
              </Button>
            </Link>
          </motion.div>
        )}

        {/* iOS Install Hint */}
        {!isInstalled && !canInstall && (
          <motion.div 
            variants={itemVariants}
            className="bg-neutral-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center"
          >
            <p className="text-sm text-neutral-400">
              📱 Pour installer, touchez 
              <span className="inline-flex items-center mx-1.5 px-2 py-0.5 bg-neutral-800 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
              </span>
              puis &quot;Sur l&apos;écran d&apos;accueil&quot;
            </p>
          </motion.div>
        )}
      </div>

      {/* Ride Request Modal */}
      <RideRequestModal />
    </motion.div>
  )
}

// Stat Badge Component
function StatBadge({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode
  value: string | number
  label: string 
}) {
  return (
    <div className="bg-neutral-950/50 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/5">
      <div className="flex justify-center mb-1 text-green-400">
        {icon}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{label}</p>
    </div>
  )
}
