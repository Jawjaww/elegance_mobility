'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Calendar, 
  Play, 
  MapPin, 
  Navigation, 
  DollarSign,
  ChevronUp,
  Bell,
  Circle
} from 'lucide-react'
import { useDriverStore } from '@/lib/driver/store'
import { OnlineToggle } from './OnlineToggle'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDistance, formatDuration } from '@/lib/driver/utils'
import type { Ride } from '@/lib/driver/types'

type Tab = 'available' | 'scheduled' | 'active'

export function DriverBottomSheet() {
  const { isOnline, activeRide, availableRide, stats } = useDriverStore()
  const [activeTab, setActiveTab] = useState<Tab>(activeRide ? 'active' : 'available')
  const [isExpanded, setIsExpanded] = useState(false)

  // Courses planifiées (mock - à remplacer par vraies données)
  const scheduledRides: Ride[] = []

  const handleOpenRealtimeModal = () => {
    if (availableRide) {
      // Ouvrir le modal plein écran
      window.dispatchEvent(new CustomEvent('open-ride-modal', { detail: availableRide }))
    }
  }

  return (
    <motion.div 
      className="fixed left-0 right-0 bottom-0 z-20 bg-neutral-950 rounded-t-[2rem] shadow-2xl border-t border-white/10"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Handle avec chevron pour expand */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex flex-col items-center pt-4 pb-2"
      >
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full mb-2" />
        <ChevronUp 
          className={`w-5 h-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-neutral-900 rounded-xl p-1">
          <TabButton 
            active={activeTab === 'available'}
            onClick={() => setActiveTab('available')}
            icon={Clock}
            label="Disponible"
            badge={availableRide ? 1 : 0}
            color="emerald"
          />
          <TabButton 
            active={activeTab === 'scheduled'}
            onClick={() => setActiveTab('scheduled')}
            icon={Calendar}
            label="Planifiées"
            badge={scheduledRides.length}
            color="blue"
          />
          <TabButton 
            active={activeTab === 'active'}
            onClick={() => setActiveTab('active')}
            icon={Play}
            label="En cours"
            badge={activeRide ? 1 : 0}
            color="amber"
          />
        </div>
      </div>

      {/* Content */}
      <div className={`px-4 overflow-y-auto transition-all duration-300 ${isExpanded ? 'h-[60vh]' : 'h-auto max-h-[300px]'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'available' && (
            <AvailableTab 
              key="available"
              ride={availableRide}
              isOnline={isOnline}
              onOpenModal={handleOpenRealtimeModal}
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

      {/* Bottom section */}
      <div className="p-4 border-t border-white/5">
        <OnlineToggle />
      </div>
    </motion.div>
  )
}

// Sous-composants

function TabButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  badge,
  color 
}: { 
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
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
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
        active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
      {badge > 0 && (
        <span className={`absolute -top-1 -right-1 w-5 h-5 ${colors[color]} rounded-full text-xs flex items-center justify-center font-bold`}>
          {badge}
        </span>
      )}
    </button>
  )
}

function AvailableTab({ 
  ride, 
  isOnline, 
  onOpenModal 
}: { 
  ride: Ride | null
  isOnline: boolean
  onOpenModal: () => void
}) {
  if (!isOnline) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center py-8 text-neutral-500"
      >
        <Circle className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
        <p>Passez en ligne pour recevoir des courses</p>
      </motion.div>
    )
  }

  if (!ride) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center py-8 text-neutral-500"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-800 animate-pulse" />
        <p>En attente de courses...</p>
        <p className="text-sm text-neutral-600 mt-1">Restez dans une zone active</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      {/* Preview de la course en temps réel */}
      <div 
        onClick={onOpenModal}
        className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold text-sm">NOUVELLE COURSE</span>
          </div>
          <span className="text-2xl font-bold text-white">{formatPrice(ride.estimatedPrice || 0)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-neutral-300 truncate">{ride.pickupLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-400" />
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
        className="text-center py-8 text-neutral-500"
      >
        <Calendar className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
        <p>Aucune course planifiée</p>
        <p className="text-sm text-neutral-600 mt-1">Les réservations apparaîtront ici</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      {rides.map((ride) => (
        <div key={ride.id} className="bg-neutral-900 rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-400">
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
              <MapPin className="w-4 h-4 text-neutral-500" />
              <span className="truncate">{ride.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <Navigation className="w-4 h-4 text-neutral-500" />
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
        className="text-center py-8 text-neutral-500"
      >
        <Play className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
        <p>Aucune course en cours</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-amber-400 font-semibold text-sm">COURSE EN COURS</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-white">{ride.pickupLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-400" />
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
