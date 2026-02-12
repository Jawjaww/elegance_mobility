"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { useUnassignedRidesStore } from "@/lib/unassignedRidesStore"
import { MapMarker, Location } from "@/lib/types/map-types"
import { Card } from "@/components/ui/card"
import RideRequestMap from "@/components/map/RideRequestMap" // Nouveau composant RideRequestMap

export function UnassignedRidesMap() {
  const router = useRouter()
  const { rides, loading, error, fetchRides } = useUnassignedRidesStore()

  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-[300px] animate-pulse bg-neutral-800 rounded-lg" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">{error}</div>
      </Card>
    )
  }

  if (rides.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Courses non attribuées</h2>
          <p className="text-sm text-neutral-400">
            Aucune course en attente d&apos;attribution
          </p>
        </div>
        <div className="h-[300px] rounded-lg flex items-center justify-center bg-neutral-800/50">
          <p className="text-neutral-400">Aucune course non attribuée</p>
        </div>
      </Card>
    )
  }

  // Créer la location de départ pour la première course
  const firstRide = rides[0]
  const departure: Location | null = firstRide?.pickup_lat && firstRide?.pickup_lon ? {
    display_name: firstRide.pickup_address,
    lat: firstRide.pickup_lat,
    lon: firstRide.pickup_lon,
    address: { formatted: firstRide.pickup_address }
  } : null
  
  // Utiliser Paris comme valeur par défaut
  const initialCenter: Location = departure || {
    display_name: "Paris",
    lat: 48.8566,
    lon: 2.3522,
    address: { formatted: "Paris, France" }
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Courses non attribuées</h2>
        <p className="text-sm text-neutral-400">
          {rides.length} course{rides.length !== 1 ? "s" : ""} en attente
          d&apos;attribution
        </p>
      </div>
      <div className="h-[300px] rounded-lg overflow-hidden">
        <RideRequestMap
          departure={initialCenter}
          destination={null}
          enableRouting={false}
        />
      </div>
    </Card>
  )
}
