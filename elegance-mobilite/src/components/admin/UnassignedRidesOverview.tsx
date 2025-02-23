"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import dynamic from "next/dynamic"
import { useUnassignedRidesStore } from "@/lib/unassignedRidesStore"
import type { MapMarker } from "@/lib/types"

const DynamicMap = dynamic(() => import("@/components/map/DynamicLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full animate-pulse bg-neutral-800 rounded-lg" />
  ),
})

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

  const markers: MapMarker[] = rides.map((ride) => ({
    position: [ride.pickup_lat, ride.pickup_lng] as [number, number],
    popup: `Course #${ride.id} - ${new Date(ride.pickup_time).toLocaleString()}`,
    onClick: () => router.push(`/admin/rides/${ride.id}/assign`),
    color: "red"
  }))

  const initialCenter = markers[0]?.position || [48.8566, 2.3522] // Paris par défaut

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
          <DynamicMap 
            markers={markers} 
            initialCenter={initialCenter}
            initialZoom={12}
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