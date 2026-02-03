'use client'

import { useDriverStore } from '@/lib/driver/store'
import { useDriverLocation, useWakeLock } from '@/lib/driver/hooks'
import { Map, Header, DashboardPanel, RideRequest } from '@/components/driver'

export default function DriverDashboardPage() {
  const { isOnline, availableRide } = useDriverStore()
  
  useDriverLocation(isOnline)
  useWakeLock(isOnline)

  const pickup = availableRide ? {
    lat: availableRide.pickupLat,
    lng: availableRide.pickupLng
  } : null

  const dropoff = availableRide ? {
    lat: availableRide.dropoffLat,
    lng: availableRide.dropoffLng
  } : null

  return (
    <div className="relative w-full h-[100dvh] bg-neutral-950">
      {/* Carte plein écran */}
      <div className="absolute inset-0 w-full h-full">
        <Map pickup={pickup} dropoff={dropoff} />
      </div>

      {/* Header flottant */}
      <Header />

      {/* Panneau inférieur */}
      {!availableRide && <DashboardPanel />}

      {/* Modal course */}
      <RideRequest />
    </div>
  )
}
