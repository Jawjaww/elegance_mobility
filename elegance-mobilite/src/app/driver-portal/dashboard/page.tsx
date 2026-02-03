'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  Clock, 
  MapPin, 
  Navigation, 
  User, 
  ArrowRight, 
  X, 
  Menu,
  Settings,
  TrendingUp,
  Battery,
  Signal,
  Star,
  Phone,
  MessageCircle,
  ChevronUp,
  Navigation2
} from 'lucide-react'
import { useDriverStore } from '@/stores/driverStore'
import { useRealtimeRides } from '@/hooks/useRealtimeRides'
import { useDriverLocation } from '@/hooks/useDriverLocation'
import { useWakeLock } from '@/hooks/useWakeLock'
import { usePWA } from '@/hooks/usePWA'
import { OnlineToggle } from '@/components/driver/OnlineToggle'
import { DriverMap } from '@/components/driver/DriverMap'
import { Button } from '@/components/ui/button'

// Snap points for bottom sheet (percentage of screen height)
const SNAP_POINTS = [15, 45, 85]

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

  // Bottom sheet state
  const [sheetSnap, setSheetSnap] = useState(0)
  const sheetY = useMotionValue(0)
  
  // Calculate sheet position
  const getSheetY = (snapIndex: number) => {
    if (typeof window === 'undefined') return 0
    return -(window.innerHeight * SNAP_POINTS[snapIndex] / 100)
  }

  const handleSheetDragEnd = (event: any, info: PanInfo) => {
    const velocity = info.velocity.y
    const offset = info.offset.y
    
    if (velocity > 500 || offset > 50) {
      // Dragging down
      setSheetSnap(Math.max(0, sheetSnap - 1))
    } else if (velocity < -500 || offset < -50) {
      // Dragging up
      setSheetSnap(Math.min(SNAP_POINTS.length - 1, sheetSnap + 1))
    }
  }

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
    <div className="relative w-full h-full overflow-hidden">
      {/* Map Layer - Bottom */}
      <div className="absolute inset-0 z-0 bg-[#1a1a1a]">
        <DriverMap 
          pickup={pickupLocation} 
          dropoff={dropoffLocation}
          showRoute={!!availableRide}
        />
      </div>

      {/* Top Bar - Floating */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-4 pointer-events-none">
        <div className="max-w-lg mx-auto flex items-center justify-between pointer-events-auto">
          {/* Menu Button */}
          <button className="w-12 h-12 bg-neutral-950/90 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors">
            <Menu className="w-5 h-5 text-white" />
          </button>

          {/* Status Badge */}
          <div className="bg-neutral-950/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
            <span className="text-sm font-medium text-white">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>

          {/* Earnings */}
          <button className="bg-neutral-950/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-neutral-800 transition-colors">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="font-bold text-white">{stats.todayEarnings.toFixed(2)}€</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet - Draggable */}
      <motion.div
        drag="y"
        dragConstraints={{ top: getSheetY(2), bottom: getSheetY(0) }}
        dragElastic={0.1}
        onDragEnd={handleSheetDragEnd}
        animate={{ y: getSheetY(sheetSnap) }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute left-0 right-0 bottom-0 z-30 bg-neutral-950 rounded-t-[2rem] shadow-2xl"
        style={{ height: '85%' }}
      >
        {/* Handle Bar */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onClick={() => setSheetSnap(sheetSnap === 2 ? 0 : 2)}
        >
          <div className="w-12 h-1.5 bg-neutral-700 rounded-full" />
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-32">
          {availableRide ? (
            <RideRequestContent 
              ride={availableRide}
              onAccept={() => acceptRide(availableRide.id)}
              onDecline={declineRide}
            />
          ) : (
            <DashboardContent 
              stats={stats}
              isOnline={isOnline}
              isInstalled={isInstalled}
              canInstall={canInstall}
              install={install}
            />
          )}
        </div>
      </motion.div>

      {/* Ride Request Overlay (when ride arrives) */}
      <AnimatePresence>
        {availableRide && sheetSnap < 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[25] bg-black/20 pointer-events-auto"
            onClick={() => setSheetSnap(2)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Dashboard Content Component
function DashboardContent({ 
  stats, 
  isOnline, 
  isInstalled, 
  canInstall, 
  install 
}: any) {
  return (
    <div className="px-4 space-y-4">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          icon={<DollarSign className="w-4 h-4" />} 
          value={`${stats.todayEarnings.toFixed(0)}€`}
          label="Gains"
          color="green"
        />
        <StatCard 
          icon={<Clock className="w-4 h-4" />} 
          value={`${stats.todayRides}`}
          label="Courses"
          color="blue"
        />
        <StatCard 
          icon={<Star className="w-4 h-4" />} 
          value={stats.rating > 0 ? stats.rating.toFixed(1) : '--'}
          label="Note"
          color="yellow"
        />
      </div>

      {/* Performance Card */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-neutral-400 text-sm">Performance</span>
          <span className="text-green-400 text-xs flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +12%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{Math.floor(stats.onlineTimeMinutes / 60)}h{stats.onlineTimeMinutes % 60}m</p>
            <p className="text-xs text-neutral-500">Temps en ligne</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-white">{stats.todayRides > 0 ? (stats.todayEarnings / stats.todayRides).toFixed(2) : '0'}€</p>
            <p className="text-xs text-neutral-500">Moyenne/course</p>
          </div>
        </div>
      </div>

      {/* Online Toggle */}
      <OnlineToggle />

      {/* Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <ActionButton icon={<Navigation2 className="w-5 h-5" />} label="Navigation" />
        <ActionButton icon={<Phone className="w-5 h-5" />} label="Support" />
      </div>

      {/* PWA Install */}
      {!isInstalled && canInstall && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Installer l&apos;app</p>
              <p className="text-xs text-blue-200">Recevez les alertes</p>
            </div>
          </div>
          <Button 
            onClick={install}
            size="sm"
            className="bg-white text-blue-700 hover:bg-blue-50 rounded-xl"
          >
            Installer
          </Button>
        </motion.div>
      )}

      {/* System Status */}
      <div className="bg-neutral-900/50 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-400">
          <Signal className="w-4 h-4" />
          <span className="text-xs">GPS</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <Battery className="w-4 h-4" />
          <span className="text-xs">85%</span>
        </div>
      </div>
    </div>
  )
}

// Ride Request Content Component
function RideRequestContent({ ride, onAccept, onDecline }: any) {
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
    <div className="px-4 pb-8">
      {/* Price Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium mb-2"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Nouvelle course
        </motion.div>
        <h2 className="text-4xl font-bold text-white">{ride.price.toFixed(2)}€</h2>
        <p className="text-neutral-400">{ride.estimated_duration_min} min • {ride.distance_km} km</p>
        
        {/* Countdown */}
        <div className="mt-3 h-1 bg-neutral-800 rounded-full overflow-hidden max-w-[200px] mx-auto">
          <motion.div 
            className="h-full bg-green-500"
            initial={{ width: '100%' }}
            animate={{ width: `${(countdown / 20) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-1">{countdown}s pour accepter</p>
      </div>

      {/* Route Card */}
      <div className="bg-neutral-900 rounded-2xl p-4 mb-4 border border-white/5">
        {/* Pickup */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="absolute top-10 left-1/2 w-0.5 h-8 bg-neutral-700 -translate-x-1/2" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-neutral-500 uppercase">Prise en charge</p>
            <p className="text-white font-medium">{ride.pickup_address}</p>
          </div>
        </div>

        {/* Dropoff */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-neutral-500 uppercase">Destination</p>
            <p className="text-white font-medium">{ride.dropoff_address}</p>
          </div>
        </div>
      </div>

      {/* Passenger Card */}
      {ride.passenger_name && (
        <div className="bg-neutral-900 rounded-2xl p-4 mb-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-neutral-400" />
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
              <button className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700">
                <Phone className="w-4 h-4 text-white" />
              </button>
              <button className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700">
                <MessageCircle className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="bg-neutral-900 rounded-2xl p-4 mb-4 border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 text-sm">Paiement</span>
          <span className="text-white font-medium">Carte •••• 4242</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={onAccept}
          className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl text-lg"
        >
          ACCEPTER
        </Button>
        
        <Button
          onClick={onDecline}
          variant="ghost"
          className="w-full text-neutral-500 hover:text-neutral-300 h-12"
        >
          Passer
        </Button>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, value, label, color }: any) {
  const colorClasses: any = {
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  }

  return (
    <div className="bg-neutral-900/80 backdrop-blur rounded-xl p-3 text-center border border-white/5">
      <div className={`w-8 h-8 ${colorClasses[color]} rounded-lg flex items-center justify-center mx-auto mb-2`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</p>
    </div>
  )
}

// Action Button Component
function ActionButton({ icon, label }: any) {
  return (
    <button className="bg-neutral-900/80 backdrop-blur rounded-xl p-4 flex flex-col items-center gap-2 border border-white/5 hover:bg-neutral-800 transition-colors">
      <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs text-neutral-400">{label}</span>
    </button>
  )
}
