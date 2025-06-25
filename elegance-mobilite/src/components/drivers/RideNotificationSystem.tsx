/**
 * RideNotificationSystem - Version simplifiée utilisant NoMapNotification
 * Évite toutes les erreurs de cartes/SSR en délégant à NoMapNotification
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { Database } from '@/lib/types/database.types'

// Import dynamique de la notification SANS carte pour éviter erreurs de cartes
const NoMapNotification = dynamic(
  () => import('./NoMapNotification'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    )
  }
)

type RideRow = Database['public']['Tables']['rides']['Row']

interface RideNotificationSystemProps {
  newRide: RideRow | null
  onAccept: (rideId: string) => void
  onDecline: (rideId: string) => void
  onDismiss: () => void
  driverLocation?: { lat: number; lon: number }
}

export function RideNotificationSystem({
  newRide,
  onAccept,
  onDecline,
  onDismiss,
  driverLocation
}: RideNotificationSystemProps) {
  const [showNotification, setShowNotification] = useState(false)

  // Déclencher l'affichage dès qu'une nouvelle course arrive
  useEffect(() => {
    if (newRide) {
      setShowNotification(true)
    }
  }, [newRide])

  const handleAccept = useCallback(() => {
    if (newRide) {
      onAccept(newRide.id)
      setShowNotification(false)
    }
  }, [newRide, onAccept])

  const handleDecline = useCallback(() => {
    if (newRide) {
      onDecline(newRide.id)
      setShowNotification(false)
    }
  }, [newRide, onDecline])

  const handleDismiss = useCallback(() => {
    setShowNotification(false)
    onDismiss()
  }, [onDismiss])

  if (!newRide || !showNotification) return null

  return (
    <NoMapNotification
      ride={newRide}
      onAccept={handleAccept}
      onDecline={handleDecline}
      onDismiss={handleDismiss}
      driverLocation={driverLocation}
    />
  )
}
