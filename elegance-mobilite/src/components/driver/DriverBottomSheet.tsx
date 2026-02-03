'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  Clock, 
  Calendar, 
  Play, 
  MapPin, 
  Navigation, 
  DollarSign,
  ChevronUp,
  Circle,
  Wifi,
  WifiOff,
  Power
} from 'lucide-react'
import { useDriverStore } from '@/lib/driver/store'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDistance, formatDuration } from '@/lib/driver/utils'
import type { Ride } from '@/lib/driver/types'

type Tab = 'available' | 'scheduled' | 'active'

// Hauteurs du bottomsheet
const SHEET_HEIGHTS = {
  collapsed: 140,  // Juste le handle + tabs
  peek: 280,       // Aperçu du contenu
  expanded: '100dvh' // Plein écran (couvre tout)
}

export function DriverBottomSheet() {
  const { isOnline, activeRide, availableRide, setIsOnline } = useDriverStore()
  const [activeTab, setActiveTab] = useState<Tab>(activeRide ? 'active' : 'available')
  const [sheetState, setSheetState] = useState<'collapsed' | 'peek' | 'expanded'>('peek')
  
  const constraintsRef = useRef<HTMLDivElement>(null)

  // Courses planifiées (mock - à remplacer par vraies données)
  const scheduledRides: Ride[] = []

  const handleDragEnd = (event: any, info: PanInfo) => {
    const velocity = info.velocity.y
    const offset = info.offset.y

    // Swipe vers le haut (velocity négative) = monter
    // Swipe vers le bas (velocity positive) = descendre
    if (velocity < -300 || offset < -80) {
      // Monter d'un niveau
      if (sheetState === 'collapsed') setSheetState('peek')
      else if (sheetState === 'peek') setSheetState('expanded')
    } else if (velocity > 300 || offset > 80) {
      // Descendre d'un niveau
      if (sheetState === 'expanded') setSheetState('peek')
      else if (sheetState === 'peek') setSheetState('collapsed')
    }
  }

  const getSheetHeight = () => {
    switch (sheetState) {
      case 'collapsed': return SHEET_HEIGHTS.collapsed
      case 'peek': return SHEET_HEIGHTS.peek
      case 'expanded': return SHEET_HEIGHTS.expanded
    }
  }

  const handleOpenRealtimeModal = () => {
    if (availableRide) {
      window.dispatchEvent(new CustomEvent('open-ride-modal', { detail: availableRide }))
    }
  }

  return (
    <>
      {/* Bouton Go Online flottant compact (visible quand collapsed) */}
      <AnimatePresence>
        {sheetState === 'collapsed' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setIsOnline(!isOnline)}
            className={`fixed bottom-6 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl font-medium text-sm transition-all ${
              isOnline 
                ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                : 'bg-white text-neutral-900 shadow-white/20'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>En ligne</span>
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                <span>Hors ligne</span>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <motion.div 
        ref={constraintsRef}
        className={`fixed left-0 right-0 z-20 bg-neutral-950 rounded-t-[2rem] shadow-2xl border-t border-white/10 overflow-hidden ${
          sheetState === 'expanded' ? 'bottom-0 h-[100dvh]' : 'bottom-0'
        }`}
        initial={{ y: '100%' }}
        animate={{ 
          height: sheetState === 'expanded' ? '100dvh' : getSheetHeight(),
          y: 0 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag={sheetState === 'expanded' ? false : 'y'}
        dragConstraints={{ top: -50, bottom: 50 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {/* Handle - Zone de drag */}
        <div className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-neutral-700 rounded-full mb-2" />
          <ChevronUp 
            className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${
              sheetState === 'expanded' ? 'rotate-180' : ''
            }`} 
          />
        </div>

        {/* Header avec tabs et toggle compact */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex-1 flex bg-neutral-900 rounded-xl p-1">
              <TabButton 
                active={activeTab === 'available'}
                onClick={() => setActiveTab('available')}
                icon={Clock}
                badge={availableRide ? 1 : 0}
                color="emerald"
              />
              <TabButton 
                active={activeTab === 'scheduled'}
                onClick={() => setActiveTab('scheduled')}
                icon={Calendar}
                badge={scheduledRides.length}
                color="blue"
              />
              <TabButton 
                active={activeTab === 'active'}
                onClick={() => setActiveTab('active')}
                icon={Play}
                badge={activeRide ? 1 : 0}
                color="amber"
              />
            </div>

            {/* Toggle compact (visible quand pas collapsed) */}
            {sheetState !== 'collapsed' && (
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${
                  isOnline 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{isOnline ? 'On' : 'Off'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content scrollable */}
        <div className="px-4 overflow-y-auto h-[calc(100%-110px)]">
          <AnimatePresence mode="wait">
            {activeTab === 'available' && (
              <AvailableTab 
                key="available"
                ride={availableRide}
                isOnline={isOnline}
                onOpenModal={handleOpenRealtimeModal}
                compact={sheetState === 'collapsed'}
              />
            )}
            {activeTab === 'scheduled' && (
              <ScheduledTab 
                key="scheduled"
                rides={scheduledRides}
              />
            )}
            {activeTab === 'active' && (
              <ActiveTab 
                key="active"
                ride={activeRide}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}

// Sous-composants

function TabButton({ 
  active, 
  onClick, 
  icon: Icon, 
  badge,
  color 
}: { 
  active: boolean
  onClick: () => void
  icon: React.ElementType
  badge: number
  color: 'emerald' | 'blue' | 'amber'
}) {
  const colors = {
    emerald: 'bg-emerald-500 text-white',
    blue: 'bg-blue-500 text-white',
    amber: 'bg-amber-500 text-white'
  }

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center py-2.5 rounded-lg transition-all relative ${
        active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      {badge > 0 && (
        <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 ${colors[color]} rounded-full text-xs flex items-center justify-center font-bold`}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

function AvailableTab({ 
  ride, 
  isOnline, 
  onOpenModal,
  compact
}: { 
  ride: Ride | null
  isOnline: boolean
  onOpenModal: () => void
  compact?: boolean
}) {
  if (!isOnline) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center h-full py-8 text-neutral-500"
      >
        <Circle className="w-10 h-10 mb-2 text-neutral-700" />
        <p className="text-sm">Passez en ligne</p>
      </motion.div>
    )
  }

  if (!ride) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center h-full py-8 text-neutral-500"
      >
        <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse mb-2" />
        <p className="text-sm">En attente...</p>
      </motion.div>
    )
  }

  // Version compacte (collapsed)
  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onOpenModal}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{ride.pickupLocation}</p>
            <p className="text-emerald-400 text-xs">→ {ride.dropoffLocation.slice(0, 30)}...</p>
          </div>
          <span className="text-emerald-400 font-bold">{formatPrice(ride.estimatedPrice || 0)}</span>
        </div>
      </motion.div>
    )
  }

  // Version normale
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 py-2"
    >
      <div 
        onClick={onOpenModal}
        className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold text-sm">NOUVELLE COURSE</span>
          </div>
          <span className="text-2xl font-bold text-white">{formatPrice(ride.estimatedPrice || 0)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-neutral-300 truncate">{ride.pickupLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-neutral-300 truncate">{ride.dropoffLocation}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-sm text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDuration(Math.round((ride.estimatedDuration || 0) / 60))}
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="w-4 h-4" />
            {formatDistance((ride.estimatedDistance || 0) / 1000)}
          </span>
        </div>

        <Button 
          className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
          onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
        >
          VOIR DÉTAILS
        </Button>
      </div>
    </motion.div>
  )
}

function ScheduledTab({ rides }: { rides: Ride[] }) {
  if (rides.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center h-full py-8 text-neutral-500"
      >
        <Calendar className="w-10 h-10 mb-2 text-neutral-700" />
        <p className="text-sm">Aucune course planifiée</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 py-2"
    >
      {rides.map((ride) => (
        <div key={ride.id} className="bg-neutral-900 rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                {ride.pickupTime ? new Date(ride.pickupTime).toLocaleString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Date non définie'}
              </span>
            </div>
            <span className="text-lg font-bold text-white">{formatPrice(ride.estimatedPrice || 0)}</span>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-neutral-300">
              <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="truncate">{ride.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <Navigation className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="truncate">{ride.dropoffLocation}</span>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}

function ActiveTab({ ride }: { ride: Ride | null }) {
  if (!ride) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center justify-center h-full py-8 text-neutral-500"
      >
        <Play className="w-10 h-10 mb-2 text-neutral-700" />
        <p className="text-sm">Aucune course en cours</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 py-2"
    >
      <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-amber-400 font-semibold text-sm">EN COURS</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-white">{ride.pickupLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-white">{ride.dropoffLocation}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20">
            Arrivé
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            Démarrer
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
