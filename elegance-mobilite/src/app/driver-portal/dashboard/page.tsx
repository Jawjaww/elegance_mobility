'use client'

import { useDriverStore } from '@/lib/driver/store'
import { useDriverLocation, useWakeLock } from '@/lib/driver/hooks'
import { 
  Map, 
  Header, 
  DriverBottomSheet, 
  FullscreenRideModal,
  ScheduledRideNotifications 
} from '@/components/driver'

export default function DriverDashboardPage() {
  const { isOnline, availableRide, activeRide } = useDriverStore()
  
  useDriverLocation(isOnline)
  useWakeLock(isOnline)

  const pickup = availableRide ? {
    lat: availableRide.pickupLat,
    lng: availableRide.pickupLng
  } : activeRide ? {
    lat: activeRide.pickupLat,
    lng: activeRide.pickupLng
  } : null

  const dropoff = availableRide ? {
    lat: availableRide.dropoffLat,
    lng: availableRide.dropoffLng
  } : activeRide ? {
    lat: activeRide.dropoffLat,
    lng: activeRide.dropoffLng
  } : null

  return (
    <div className="relative w-full h-[100dvh] bg-neutral-950">
      {/* Carte plein écran */}
      <div className="absolute inset-0 w-full h-full">
        <Map pickup={pickup} dropoff={dropoff} />
      </div>

      {/* Header flottant */}
      <Header />

      {/* Notifications pour courses planifiées */}
      <ScheduledRideNotifications />

      {/* Bottom sheet avec onglets */}
      <DriverBottomSheet />

      {/* Modal plein écran pour courses en temps réel */}
      <FullscreenRideModal />
    </div>
  )
}
