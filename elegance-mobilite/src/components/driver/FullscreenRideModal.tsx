'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Check, X, Clock, Navigation, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDriverStore } from '@/lib/driver/store'
import { usePendingRides } from '@/lib/driver/usePendingRides'
import { formatPrice, formatDistance } from '@/lib/driver/utils'
import type { Ride } from '@/lib/driver/types'
import { RideRequestMap } from './RideRequestMap'

const COUNTDOWN_SECONDS = 20

// Barre de progression fluide avec CSS
function ProgressBar({ isUrgent, startTime }: { isUrgent: boolean; startTime: number }) {
  const [progress, setProgress] = useState(100)
  
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / (COUNTDOWN_SECONDS * 1000)) * 100)
      setProgress(remaining)
    }, 50) // Update every 50ms for smooth animation
    
    return () => clearInterval(interval)
  }, [startTime])
  
  return (
    <div className="mx-4 h-1 bg-neutral-800 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-none ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function FullscreenRideModal() {
  const { availableRide, currentLocation } = useDriverStore()
  const { acceptCurrentRide, declineCurrentRide } = usePendingRides()
  const [isOpen, setIsOpen] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [route, setRoute] = useState<any>(null)
  const [startTime, setStartTime] = useState(Date.now())

  const handleDecline = useCallback(() => {
    declineCurrentRide()
    setIsOpen(false)
    setRoute(null)
  }, [declineCurrentRide])

  useEffect(() => {
    const handleOpen = () => {
      if (availableRide) {
        setIsOpen(true)
        setCountdown(COUNTDOWN_SECONDS)
        setStartTime(Date.now())
        setError(null)
      }
    }
    window.addEventListener('open-ride-modal', handleOpen as EventListener)
    return () => window.removeEventListener('open-ride-modal', handleOpen as EventListener)
  }, [availableRide])

  const prevRideIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (availableRide && availableRide.id !== prevRideIdRef.current && !isOpen) {
      setIsOpen(true)
      setCountdown(COUNTDOWN_SECONDS)
      setStartTime(Date.now())
      setError(null)
      prevRideIdRef.current = availableRide.id
    }
  }, [availableRide, isOpen])

  useEffect(() => {
    if (!availableRide && isOpen) {
      setIsOpen(false)
      setRoute(null)
    }
  }, [availableRide, isOpen])

  // Countdown logic
  useEffect(() => {
    if (!isOpen || !availableRide) return
    const timer = setInterval(() => setCountdown(p => p <= 1 ? 0 : p - 1), 1000)
    return () => clearInterval(timer)
  }, [isOpen, availableRide])

  useEffect(() => {
    if (countdown === 0 && isOpen) {
      const t = setTimeout(() => handleDecline(), 100)
      return () => clearTimeout(t)
    }
  }, [countdown, isOpen, handleDecline])

  // Fetch route to pickup
  useEffect(() => {
    if (isOpen && availableRide && currentLocation) {
      fetch('/api/directions?' + new URLSearchParams({
        start: `${currentLocation.lng},${currentLocation.lat}`,
        end: `${availableRide.pickupLng},${availableRide.pickupLat}`
      }))
        .then(r => r.json())
        .then(data => {
          if (data.routes?.[0]) setRoute({ toPickup: data.routes[0] })
        })
        .catch(console.error)
    }
  }, [isOpen, availableRide, currentLocation])

  const handleAccept = async () => {
    if (!availableRide || isAccepting) return
    setIsAccepting(true)
    try {
      const result = await acceptCurrentRide()
      if (result.success) {
        setIsOpen(false)
        setRoute(null)
      } else {
        setError(result.error || "Erreur")
        setIsAccepting(false)
      }
    } catch {
      setError("Erreur")
      setIsAccepting(false)
    }
  }

  const handleClose = () => setIsOpen(false)

  // Mémoriser les coordonnées AVANT le return conditionnel
  const pickupCoords = useMemo(() => availableRide ? ({ 
    lat: availableRide.pickupLat, 
    lng: availableRide.pickupLng 
  }) : { lat: 0, lng: 0 }, [availableRide?.pickupLat, availableRide?.pickupLng])
  
  const dropoffCoords = useMemo(() => availableRide ? ({ 
    lat: availableRide.dropoffLat, 
    lng: availableRide.dropoffLng 
  }) : { lat: 0, lng: 0 }, [availableRide?.dropoffLat, availableRide?.dropoffLng])

  if (!availableRide || !isOpen) return null

  const isUrgent = countdown <= 5
  const toPickupDist = route?.toPickup?.distance || 1000
  const toPickupTime = route?.toPickup?.duration || 300
  const tripDist = availableRide.estimatedDistance || 0
  const tripTime = availableRide.estimatedDuration || 0

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className={`px-3 py-1 rounded-full text-lg font-bold ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>
          {countdown}s
        </div>
        <div className="text-3xl font-black text-white">
          {formatPrice(availableRide.estimatedPrice || 0)}
        </div>
        <button onClick={handleClose} className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Progress bar fluide */}
      <ProgressBar isUrgent={isUrgent} startTime={startTime} />

      {/* DESTINATION */}
      <div className="px-4 mt-3">
        <div className="bg-emerald-600 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-emerald-100" />
            <span className="text-emerald-100 text-xs uppercase font-semibold">Destination</span>
          </div>
          <p className="text-white font-medium text-lg leading-tight">{availableRide.dropoffLocation}</p>
        </div>
      </div>

      {/* CARTE - mémorisée pour éviter re-render */}
      <div className="flex-1 mx-4 mt-3 mb-3 rounded-2xl overflow-hidden relative bg-slate-100 min-h-[200px]">
        <RideRequestMap pickup={pickupCoords} dropoff={dropoffCoords} />

        {/* Bulle Pickup - en bas à gauche près du point de départ */}
        <div className="absolute bottom-3 left-3 z-10">
          <div className="bg-emerald-500/90 backdrop-blur-sm text-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-2xl border border-emerald-400/30">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-black text-xl">{Math.round(toPickupTime / 60)} min</span>
            </div>
            <div className="text-emerald-100 text-lg font-bold">{formatDistance(toPickupDist / 1000)}</div>
          </div>
        </div>

        {/* Bulle Trajet - en haut à droite près de la destination */}
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-blue-500/90 backdrop-blur-sm text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-2xl border border-blue-400/30">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              <span className="font-black text-xl">{Math.round(tripTime / 60)} min</span>
            </div>
            <div className="text-blue-100 text-lg font-bold">{formatDistance(tripDist / 1000)}</div>
          </div>
        </div>
      </div>

      {/* DÉPART */}
      <div className="px-4 mb-2">
        <div className="bg-blue-500 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-blue-100" />
            <span className="text-blue-100 text-xs uppercase font-semibold">Prise en charge</span>
          </div>
          <p className="text-white font-medium text-lg leading-tight">{availableRide.pickupLocation}</p>
        </div>
      </div>

      {/* Type */}
      <div className="text-center pb-1">
        <span className="text-neutral-500 text-xs uppercase tracking-wider">{availableRide.vehicleType}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-2 bg-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</div>
      )}

      {/* Bouton */}
      <div className="px-4 pb-4">
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className={`w-full h-14 text-xl font-bold rounded-xl ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'} text-white`}
        >
          {isAccepting ? (
            <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Check className="w-6 h-6 mr-2" /> ACCEPTER</>
          )}
        </Button>
        <button onClick={handleClose} className="w-full mt-2 text-neutral-500 text-sm py-2">Passer</button>
      </div>
    </div>
  )
}
