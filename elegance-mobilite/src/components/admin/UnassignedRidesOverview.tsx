"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { useUnassignedRidesStore } from "@/lib/unassignedRidesStore"
import MapLibreMap from "@/components/map/MapLibreMap" // Nouveau composant MapLibre

export function UnassignedRidesOverview() {
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

  // Créer la location de départ pour la première course
  const firstRide = rides[0]
  const departure = firstRide ? {
    display_name: firstRide.pickup_address,
    lat: firstRide.pickup_lat,
    lon: firstRide.pickup_lon,
    address: { formatted: firstRide.pickup_address }
  } : null
  
  // Utiliser Paris comme valeur par défaut
  const initialCenter = departure || {
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
        {rides.length > 0 ? (
          <MapLibreMap
            departure={initialCenter}
            destination={null}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-800/50">
            <p className="text-neutral-400">Aucune course non attribuée</p>
          </div>
        )}
      </div>
      {rides.length > 0 && (
        <div className="mt-4 grid gap-2">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 cursor-pointer"
              onClick={() => router.push(`/admin/rides/${ride.id}/assign`)}
            >
              <div>
                <p className="font-medium">{ride.pickup_address}</p>
                <p className="text-sm text-neutral-400">
                  {new Date(ride.pickup_time).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{ride.vehicle_type}</p>
                <p className="text-sm text-neutral-400">
                  {ride.distance_km} km - {ride.price}€
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}