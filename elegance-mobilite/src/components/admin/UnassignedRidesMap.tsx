"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { useUnassignedRidesStore } from "@/lib/unassignedRidesStore"
import type { MapMarker } from "@/lib/types"
import type { LatLngTuple } from "leaflet"
import { Card } from "@/components/ui/card"

const DynamicMap = dynamic(() => import("@/components/map/DynamicLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full animate-pulse bg-neutral-800 rounded-lg" />
  ),
})

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

  const markers: MapMarker[] = rides.map((ride) => {
    const position: LatLngTuple = [ride.pickup_lat, ride.pickup_lng]
    return {
      position,
      popup: `Course #${ride.id} - ${new Date(ride.pickup_time).toLocaleString()}`,
      onClick: () => router.push(`/admin/rides/${ride.id}/assign`),
      color: "red"
    }
  })

  const initialCenter: LatLngTuple = markers[0]?.position || [48.8566, 2.3522]

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
    </Card>
  )
}