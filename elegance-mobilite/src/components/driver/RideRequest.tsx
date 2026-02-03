'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Clock, Star, DollarSign, User, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from './Sheet'
import { usePendingRides } from '@/lib/driver/usePendingRides'
import { formatPrice, formatDistance, formatDuration } from '@/lib/driver/utils'

const COUNTDOWN_SECONDS = 15

export function RideRequest() {
  const { availableRide, acceptCurrentRide, declineCurrentRide } = usePendingRides()
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Compte à rebours
  useEffect(() => {
    if (!availableRide) {
      setCountdown(COUNTDOWN_SECONDS)
      setError(null)
      return
    }

    setCountdown(COUNTDOWN_SECONDS)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          declineCurrentRide()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [availableRide, declineCurrentRide])

  const handleAccept = async () => {
    if (!availableRide || isAccepting) return
    setIsAccepting(true)
    setError(null)
    
    try {
      const result = await acceptCurrentRide()
      if (!result.success) {
        setError(result.error || "Impossible d'accepter cette course")
      }
    } catch (e) {
      setError("Erreur lors de l'acceptation")
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = () => {
    declineCurrentRide()
  }

  if (!availableRide) return null

  const progress = (countdown / COUNTDOWN_SECONDS) * 100
  const isUrgent = countdown <= 5

  return (
    <Sheet open={!!availableRide} onClose={handleDecline}>
      {/* Barre de progression */}
      <div className="mb-6">
        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
        <p className="text-center text-sm text-neutral-400 mt-2">
          {countdown}s pour répondre
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-2xl">🚗</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Nouvelle course !</h3>
          <p className="text-neutral-400 text-sm">
            {availableRide.pickupLocation.slice(0, 30)}...
          </p>
        </div>
      </div>

      {/* Route */}
      <div className="bg-neutral-800/50 rounded-2xl p-4 mb-6 border border-white/5">
        <LocationRow 
          icon={MapPin} 
          label="Prise en charge" 
          address={availableRide.pickupLocation}
          color="emerald"
        />
        <div className="ml-5 my-2 w-0.5 h-6 bg-neutral-700" />
        <LocationRow 
          icon={Navigation} 
          label="Destination" 
          address={availableRide.dropoffLocation}
          color="blue"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatBox 
          icon={DollarSign}
          value={formatPrice(availableRide.estimatedPrice || 0)}
          label="Estimé"
        />
        <StatBox 
          icon={Clock}
          value={formatDuration(Math.round((availableRide.estimatedDuration || 0) / 60))}
          label="Durée"
        />
        <StatBox 
          icon={Navigation}
          value={formatDistance((availableRide.estimatedDistance || 0) / 1000)}
          label="Distance"
        />
      </div>

      {/* Passager - Info non dispo pour l'instant */}
      <div className="flex items-center gap-3 bg-neutral-800/30 rounded-xl p-4 mb-6 border border-white/5">
        <div className="w-12 h-12 bg-neutral-700 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-neutral-400" />
        </div>
        <div>
          <p className="text-white font-medium">Client</p>
          <p className="text-sm text-neutral-400">Course {availableRide.vehicleType}</p>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className={`w-full h-14 text-lg font-bold rounded-xl transition-all ${
            isUrgent 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isAccepting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              ACCEPTER
            </span>
          )}
        </Button>
        
        <Button
          onClick={handleDecline}
          variant="ghost"
          className="w-full text-neutral-500 hover:text-neutral-300 hover:bg-white/5 h-12"
        >
          <X className="w-4 h-4 mr-2" />
          Passer cette course
        </Button>
      </div>
    </Sheet>
  )
}

// Sous-composants
function LocationRow({ 
  icon: Icon, 
  label, 
  address,
  color 
}: { 
  icon: React.ElementType
  label: string
  address: string
  color: 'emerald' | 'blue'
}) {
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
        <p className="text-white font-medium text-sm leading-snug truncate">{address}</p>
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
    <div className="bg-neutral-800/50 rounded-xl p-3 text-center border border-white/5">
      <Icon className="w-5 h-5 mx-auto mb-1 text-neutral-400" />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  )
}
