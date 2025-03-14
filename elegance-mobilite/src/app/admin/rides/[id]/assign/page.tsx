"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUnassignedRidesStore } from "@/lib/unassignedRidesStore"
import { useDriversStore } from "@/lib/driversStore"
import { supabase } from "@/lib/supabaseClient"
import { Vehicle } from "@/lib/types/types"
import { Location } from "@/lib/types/map-types"
import MapLibreMap from "@/components/map/MapLibreMap"

export default function AssignRidePage() {
  const params = useParams()
  const rideId = params?.id as string
  const router = useRouter()
  const { rides } = useUnassignedRidesStore()
  const { drivers, fetchDrivers } = useDriversStore()
  const [selectedDriver, setSelectedDriver] = useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = useState<string>("")
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)

  const ride = rides.find((r) => r.id === rideId)

  useEffect(() => {
    fetchDrivers()
  }, [fetchDrivers])

  useEffect(() => {
    const fetchVehicles = async () => {
      if (selectedDriver) {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("status", "available")
          .eq("type", ride?.vehicle_type)

        if (!error && data) {
          setAvailableVehicles(data)
        }
      }
    }

    fetchVehicles()
  }, [selectedDriver, ride?.vehicle_type])

  if (!ride) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">Course non trouvée</Card>
      </div>
    )
  }

  const handleAssign = async () => {
    if (!selectedDriver || !selectedVehicle) return

    setLoading(true)
    try {
      await useUnassignedRidesStore
        .getState()
        .assignRide(ride.id, selectedDriver, selectedVehicle)
      router.push("/admin")
    } catch (error) {
      console.error("Erreur lors de l'attribution:", error)
    } finally {
      setLoading(false)
    }
  }

  const activeDrivers = drivers.filter((d) => d.status === "active")

  // Création des objets Location pour la carte MapLibre
  const departure: Location = {
    display_name: ride.pickup_address,
    lat: ride.pickup_lat,
    lon: ride.pickup_lon,
    address: { formatted: ride.pickup_address }
  }
  
  const destination: Location = {
    display_name: ride.dropoff_address,
    lat: ride.dropoff_lat,
    lon: ride.dropoff_lon,
    address: { formatted: ride.dropoff_address }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Attribution de course</h1>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Détails de la course</h2>
            <div className="grid gap-2">
              <p>
                <span className="text-neutral-400">Départ:</span>{" "}
                {ride.pickup_address}
              </p>
              <p>
                <span className="text-neutral-400">Arrivée:</span>{" "}
                {ride.dropoff_address}
              </p>
              <p>
                <span className="text-neutral-400">Heure:</span>{" "}
                {new Date(ride.pickup_time).toLocaleString()}
              </p>
              <p>
                <span className="text-neutral-400">Type de véhicule:</span>{" "}
                {ride.vehicle_type}
              </p>
            </div>
          </div>

          <div className="h-[300px] rounded-lg overflow-hidden">
            <MapLibreMap
              departure={departure}
              destination={destination}
              onRouteCalculated={(distance, duration) => {}}
            />
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="driver">Chauffeur</Label>
              <Select onValueChange={setSelectedDriver} value={selectedDriver}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  {activeDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vehicle">Véhicule</Label>
              <Select
                onValueChange={setSelectedVehicle}
                value={selectedVehicle}
                disabled={!selectedDriver}
              >
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.plate_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedDriver || !selectedVehicle || loading}
              >
                {loading ? "Attribution..." : "Attribuer la course"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}