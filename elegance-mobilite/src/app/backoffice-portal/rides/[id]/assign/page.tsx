"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Car, Clock, CalendarRange, MapPin, Users } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/useToast"
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore"
import { useDriversStore } from "@/lib/stores/driversStore"
import { supabase } from "@/lib/database/client"
import type { Database } from "@/lib/types/database.types"

// Définir les types à partir de la Database
type Driver = Database['public']['Tables']['drivers']['Row']
type Ride = Database['public']['Tables']['rides']['Row']

export default function AssignDriverPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const fetchDrivers = useDriversStore(state => state.fetchDrivers)
  const drivers = useDriversStore(state => state.drivers)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [ride, setRide] = useState<Ride | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [tab, setTab] = useState("list")

  // Trouver tous les conducteurs disponibles
  const availableDrivers = drivers.filter(d => d.status === 'active')

  useEffect(() => {
    // Vérifier si params et params.id existent
    if (params && params.id) {
      fetchRide()
      fetchDrivers()
    }
  }, [params])

  // Récupérer les détails du trajet
  const fetchRide = async () => {
    if (!params || !params.id) {
      toast({
        variant: "destructive", 
        title: "Erreur",
        description: "ID de trajet manquant."
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setRide(data)
    } catch (error) {
      console.error("Erreur lors de la récupération du trajet:", error)
      toast({
        variant: "destructive", 
        title: "Erreur",
        description: "Impossible de charger les détails du trajet."
      })
    } finally {
      setLoading(false)
    }
  }

  // Assigner un chauffeur au trajet
  const assignDriver = async () => {
    if (!selectedDriverId || !ride) return

    setAssigning(true)
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          driver_id: selectedDriverId,
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', ride.id)

      if (error) throw error

      // Ajouter une entrée dans l'historique des statuts
      const { error: historyError } = await supabase
        .from('ride_status_history')
        .insert({
          ride_id: ride.id,
          status: 'scheduled',
          previous_status: ride.status,
          changed_at: new Date().toISOString(),
        })

      if (historyError) {
        console.error("Erreur lors de l'ajout à l'historique:", historyError)
      }

      toast({
        title: "Chauffeur assigné",
        description: "Le chauffeur a été assigné à cette course avec succès."
      })

      router.push('/backoffice-portal/rides')
    } catch (error: any) {
      console.error("Erreur lors de l'assignation:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'assigner le chauffeur."
      })
    } finally {
      setAssigning(false)
    }
  }

  // Filtrer les chauffeurs par nom
  const filteredDrivers = availableDrivers.filter((driver) => {
    if (!searchQuery) return true
    const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 text-center">
        <p className="text-neutral-400">Chargement...</p>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="py-8 px-4 sm:px-6 text-center">
        <p className="text-neutral-400">Trajet non trouvé</p>
        <Button className="mt-4" onClick={() => router.push('/backoffice-portal/rides')}>
          Retour aux trajets
        </Button>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 sm:px-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assigner un chauffeur</h1>
        <Button variant="outline" onClick={() => router.push('/backoffice-portal/rides')}>
          Retour
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Détails du trajet */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Détails du trajet</CardTitle>
            <CardDescription>Information du trajet à assigner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-neutral-400">
                <Clock className="mr-2 h-4 w-4" />
                <span>Date et heure</span>
              </div>
              <p className="font-medium">
                {format(new Date(ride.pickup_time), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
              </p>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex items-center text-sm text-neutral-400">
                <MapPin className="mr-2 h-4 w-4" />
                <span>Adresse de départ</span>
              </div>
              <p className="font-medium">{ride.pickup_address}</p>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex items-center text-sm text-neutral-400">
                <MapPin className="mr-2 h-4 w-4" />
                <span>Adresse d'arrivée</span>
              </div>
              <p className="font-medium">{ride.dropoff_address}</p>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex items-center text-sm text-neutral-400">
                <Car className="mr-2 h-4 w-4" />
                <span>Type de véhicule</span>
              </div>
              <p className="font-medium">{ride.vehicle_type}</p>
            </div>
          </CardContent>
        </Card>

        {/* Sélection du chauffeur */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Chauffeurs disponibles</CardTitle>
            <CardDescription>Sélectionnez un chauffeur pour ce trajet</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="w-full" value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Liste</TabsTrigger>
                <TabsTrigger value="map">Carte</TabsTrigger>
              </TabsList>
              <TabsContent value="list" className="space-y-4">
                <div className="relative mt-4">
                  <input
                    type="text"
                    placeholder="Rechercher un chauffeur..."
                    className="w-full py-2 px-4 rounded-md bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredDrivers.length === 0 ? (
                    <p className="text-center py-8 text-neutral-400">Aucun chauffeur disponible</p>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <div
                        key={driver.id}
                        className={`p-4 rounded-md cursor-pointer transition-colors ${
                          selectedDriverId === driver.id
                            ? "bg-primary/20 border border-primary"
                            : "bg-neutral-800 hover:bg-neutral-700"
                        }`}
                        onClick={() => setSelectedDriverId(driver.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-neutral-700 flex items-center justify-center">
                              <User className="h-6 w-6 text-neutral-300" />
                            </div>
                            <div>
                              <p className="font-medium">{driver.first_name} {driver.last_name}</p>
                              <p className="text-sm text-neutral-400">{driver.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="map">
                <div className="h-[400px] rounded-md bg-neutral-900 flex items-center justify-center">
                  <p className="text-neutral-400">Carte en développement</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <Button
                className="w-full"
                size="lg"
                disabled={!selectedDriverId || assigning}
                onClick={assignDriver}
              >
                {assigning ? "Assignation en cours..." : "Assigner ce chauffeur"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}