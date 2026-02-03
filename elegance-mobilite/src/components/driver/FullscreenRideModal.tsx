'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign, 
  User, 
  Star,
  Phone,
  MessageSquare,
  Check,
  ChevronUp,
  Navigation2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDriverStore } from '@/lib/driver/store'
import { usePendingRides } from '@/lib/driver/usePendingRides'
import { formatPrice, formatDistance, formatDuration } from '@/lib/driver/utils'
import type { Ride } from '@/lib/driver/types'

const COUNTDOWN_SECONDS = 15

export function FullscreenRideModal() {
  const { availableRide, setAvailableRide } = useDriverStore()
  const { acceptCurrentRide, declineCurrentRide } = usePendingRides()
  const [isOpen, setIsOpen] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Écouter l'événement d'ouverture
  useEffect(() => {
    const handleOpen = (e: CustomEvent<Ride>) => {
      setIsOpen(true)
      setCountdown(COUNTDOWN_SECONDS)
      setError(null)
    }
    
    window.addEventListener('open-ride-modal', handleOpen as EventListener)
    return () => window.removeEventListener('open-ride-modal', handleOpen as EventListener)
  }, [])

  // Auto-ouvrir quand availableRide arrive
  useEffect(() => {
    if (availableRide && !isOpen) {
      setIsOpen(true)
      setCountdown(COUNTDOWN_SECONDS)
    }
  }, [availableRide])

  // Compte à rebours
  useEffect(() => {
    if (!isOpen || !availableRide) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleDecline()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, availableRide])

  const handleAccept = async () => {
    if (!availableRide || isAccepting) return
    setIsAccepting(true)
    setError(null)

    try {
      const result = await acceptCurrentRide()
      if (result.success) {
        setIsOpen(false)
      } else {
        setError(result.error || "Impossible d'accepter")
      }
    } catch (e) {
      setError("Erreur lors de l'acceptation")
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = () => {
    declineCurrentRide()
    setIsOpen(false)
  }

  if (!availableRide) return null

  const progress = (countdown / COUNTDOWN_SECONDS) * 100
  const isUrgent = countdown <= 5

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-neutral-950"
        >
          {/* Header avec compte à rebours */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent pt-safe-top">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  isUrgent ? 'bg-red-500 text-white' : 'bg-white text-neutral-900'
                }`}>
                  {countdown}
                </div>
                <div>
                  <p className="text-white font-semibold">Nouvelle course</p>
                  <p className={`text-sm ${isUrgent ? 'text-red-400' : 'text-neutral-400'}`}>
                    {isUrgent ? 'Dépêchez-vous !' : 'Répondez rapidement'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDecline}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Barre de progression */}
            <div className="mx-4 h-1 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Carte avec trajet */}
          <div className="absolute inset-0 pt-20 pb-[320px]">
            <RideMap 
              pickup={{ lat: availableRide.pickupLat, lng: availableRide.pickupLng }}
              dropoff={{ lat: availableRide.dropoffLat, lng: availableRide.dropoffLng }}
            />
          </div>

          {/* Bottom sheet avec détails */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-neutral-950 rounded-t-3xl shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex justify-center pt-3 pb-2"
            >
              <div className="w-12 h-1 bg-neutral-700 rounded-full" />
            </button>

            {/* Prix principal */}
            <div className="px-6 pb-4 text-center">
              <p className="text-4xl font-bold text-white">
                {formatPrice(availableRide.estimatedPrice || 0)}
              </p>
              <p className="text-neutral-400 text-sm">Estimation du prix</p>
            </div>

            {/* Détails de la course */}
            <div className="px-4 space-y-3 max-h-[200px] overflow-y-auto">
              {/* Trajet */}
              <div className="bg-neutral-900 rounded-xl p-4 space-y-3">
                <LocationRow 
                  icon={MapPin}
                  color="emerald"
                  label="Prise en charge"
                  address={availableRide.pickupLocation}
                />
                <div className="ml-5 w-0.5 h-6 bg-neutral-700" />
                <LocationRow 
                  icon={Navigation}
                  color="blue"
                  label="Destination"
                  address={availableRide.dropoffLocation}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatBox 
                  icon={Clock}
                  value={formatDuration(Math.round((availableRide.estimatedDuration || 0) / 60))}
                  label="Durée"
                />
                <StatBox 
                  icon={Navigation2}
                  value={formatDistance((availableRide.estimatedDistance || 0) / 1000)}
                  label="Distance"
                />
                <StatBox 
                  icon={DollarSign}
                  value={availableRide.vehicleType}
                  label="Type"
                />
              </div>

              {/* Passager (placeholder) */}
              <div className="bg-neutral-900 rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Client</p>
                  <p className="text-sm text-neutral-400">{availableRide.vehicleType}</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700">
                    <Phone className="w-5 h-5 text-neutral-400" />
                  </button>
                  <button className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700">
                    <MessageSquare className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3">
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className={`w-full h-16 text-lg font-bold rounded-xl ${
                  isUrgent 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-emerald-500 hover:bg-emerald-600'
                } text-white`}
              >
                {isAccepting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-6 h-6" />
                    ACCEPTER LA COURSE
                  </span>
                )}
              </Button>
              
              <Button
                onClick={handleDecline}
                variant="ghost"
                className="w-full text-neutral-500 hover:text-neutral-300 hover:bg-white/5 h-12"
              >
                Passer cette course
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Sous-composants

function RideMap({ 
  pickup, 
  dropoff 
}: { 
  pickup: { lat: number; lng: number }
  dropoff: { lat: number; lng: number }
}) {
  // Pour l'instant, on affiche une carte statique avec MapLibre
  // À remplacer par la vraie carte interactive
  return (
    <div className="w-full h-full bg-neutral-900 relative">
      {/* Placeholder pour la carte */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <Navigation2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Carte du trajet</p>
          <p className="text-sm">{pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}</p>
          <p className="text-sm">→</p>
          <p className="text-sm">{dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}</p>
        </div>
      </div>
      
      {/* Markers visuels (placeholder) */}
      <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <MapPin className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="absolute bottom-1/3 right-1/3 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
          <Navigation className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

function LocationRow({ 
  icon: Icon, 
  color,
  label,
  address
}: { 
  icon: React.ElementType
  color: 'emerald' | 'blue'
  label: string
  address: string
}) {
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400'
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
        <p className="text-white font-medium text-sm leading-snug">{address}</p>
      </div>
    </div>
  )
}

function StatBox({ 
  icon: Icon, 
  value, 
  label 
}: { 
  icon: React.ElementType
  value: string
  label: string
}) {
  return (
    <div className="bg-neutral-900 rounded-xl p-3 text-center">
      <Icon className="w-5 h-5 mx-auto mb-1 text-neutral-400" />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  )
}
