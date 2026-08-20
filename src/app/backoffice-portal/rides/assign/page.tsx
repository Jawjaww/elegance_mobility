"use client";

import { Suspense, useState, useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Car, Clock, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageLoading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { useDriversStore } from "@/lib/stores/driversStore";
import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import { syncExistingDrivers } from "@/lib/utils/driver-sync";

type Driver = Database["public"]["Tables"]["drivers"]["Row"];
type Ride = Database["public"]["Tables"]["rides"]["Row"];

function AssignDriverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideId = searchParams?.get("id") || null;
  const { toast } = useToast();
  const { fetchDrivers, drivers, loading: driversLoading } = useDriversStore();
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [ride, setRide] = useState<Ride | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("list");

  const availableDrivers = drivers.filter((d) => d.status === "active");

  useEffect(() => {
    if (rideId) {
      initializePage();
    }
  }, [rideId]);

  const initializePage = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRide(), fetchDrivers()]);
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRide = async () => {
    if (!rideId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID de trajet manquant.",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("id", rideId)
        .single();

      if (error) throw error;
      setRide(data);
    } catch (error) {
      console.error("Erreur lors de la récupération du trajet:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les détails du trajet.",
      });
    }
  };

  const assignDriver = async () => {
    if (!selectedDriverId || !ride) return;

    setAssigning(true);
    try {
      const { adminReassignRide } = await import(
        "@/services/adminRideService"
      );
      const result: any = await adminReassignRide(ride.id, selectedDriverId);

      if (result?.success === false) {
        throw new Error(result.error || "Réaffectation impossible");
      }

      toast({
        title: "Chauffeur assigné",
        description: "Le chauffeur a été assigné à cette course avec succès.",
      });

      router.push("/backoffice-portal/rides");
    } catch (error: any) {
      console.error("Erreur lors de l'assignation:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'assigner le chauffeur.",
      });
    } finally {
      setAssigning(false);
    }
  };

  const filteredDrivers = availableDrivers.filter((driver) => {
    if (!searchQuery) return true;
    const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (!rideId) {
    return (
      <div className="py-8 px-4 sm:px-6 text-center">
        <p className="text-neutral-400">ID de trajet manquant</p>
        <Button
          className="mt-4"
          onClick={() => router.push("/backoffice-portal/rides")}
        >
          Retour aux trajets
        </Button>
      </div>
    );
  }

  if (loading || driversLoading) {
    return <PageLoading text="Chargement de la page d'assignation..." />;
  }

  if (!ride) {
    return (
      <div className="py-8 px-4 sm:px-6 text-center">
        <p className="text-neutral-400">Trajet non trouvé</p>
        <Button
          className="mt-4"
          onClick={() => router.push("/backoffice-portal/rides")}
        >
          Retour aux trajets
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assigner un chauffeur</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/backoffice-portal/rides")}
        >
          Retour
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
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
                {format(
                  new Date(ride.pickup_time),
                  "EEEE d MMMM yyyy 'à' HH'h'mm",
                  { locale: fr },
                )}
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

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Chauffeurs disponibles</CardTitle>
                <CardDescription>
                  Sélectionnez un chauffeur pour ce trajet
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDrivers()}
                disabled={driversLoading}
              >
                {driversLoading ? "Chargement..." : "Actualiser"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const result = await syncExistingDrivers();
                    toast({
                      title: "Synchronisation réussie",
                      description: result.message || "Chauffeurs synchronisés",
                    });
                    await fetchDrivers();
                  } catch (err: any) {
                    toast({
                      variant: "destructive",
                      title: "Erreur de synchronisation",
                      description: err.message,
                    });
                  }
                }}
              >
                Sync Drivers
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="list"
              className="w-full"
              value={tab}
              onValueChange={setTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Liste</TabsTrigger>
                <TabsTrigger value="map">Carte</TabsTrigger>
              </TabsList>
              <TabsContent value="list" className="space-y-4">
                <div className="relative mt-4">
                  <input
                    type="text"
                    placeholder="Rechercher un chauffeur..."
                    className="w-full py-2 px-4 rounded-md bg-neutral-900 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="text-xs text-neutral-500 p-2 bg-neutral-900 rounded">
                  Total chauffeurs: {drivers.length} | Actifs:{" "}
                  {availableDrivers.length} | Filtrés: {filteredDrivers.length}
                </div>

                <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredDrivers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-400">
                        {getEmptyDriversMessage(
                          drivers.length,
                          availableDrivers.length,
                        )}
                      </p>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setSearchQuery("")}
                        >
                          Effacer la recherche
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredDrivers.map((driver) => {
                      const isSelected = selectedDriverId === driver.id;
                      return (
                      <button
                        type="button"
                        key={driver.id}
                        className={`w-full text-left p-4 rounded-md cursor-pointer transition-colors border ${
                          isSelected
                            ? "bg-primary/20 border-primary shadow-md"
                            : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700"
                        }`}
                        onClick={() => setSelectedDriverId(driver.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {driver.first_name} {driver.last_name}
                              </p>
                              <p className="text-sm text-neutral-400">
                                {driver.phone || "Téléphone non renseigné"}
                              </p>
                              <p className="text-xs text-neutral-500">
                                Statut: {driver.status}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </button>
                      );
                    })
                  )}
                </div>
              </TabsContent>
              <TabsContent value="map">
                <div className="h-[400px] rounded-md bg-neutral-900 flex items-center justify-center">
                  <p className="text-neutral-400">Carte en développement</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-4">
              {selectedDriverId && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-sm text-primary">
                    Chauffeur sélectionné:{" "}
                    {
                      filteredDrivers.find((d) => d.id === selectedDriverId)
                        ?.first_name
                    }{" "}
                    {
                      filteredDrivers.find((d) => d.id === selectedDriverId)
                        ?.last_name
                    }
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!selectedDriverId || assigning}
                onClick={assignDriver}
              >
                {getAssignButtonContent(assigning, Boolean(selectedDriverId))}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getEmptyDriversMessage(
  totalDrivers: number,
  activeDrivers: number,
): string {
  if (totalDrivers === 0) {
    return "Aucun chauffeur trouvé dans la base de données";
  }
  if (activeDrivers === 0) {
    return "Aucun chauffeur actif";
  }
  return "Aucun chauffeur trouvé pour cette recherche";
}

function getAssignButtonContent(
  assigning: boolean,
  hasSelection: boolean,
): ReactNode {
  if (assigning) {
    return (
      <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
        Assignation en cours...
      </>
    );
  }
  if (hasSelection) {
    return "Assigner ce chauffeur";
  }
  return "Sélectionnez d'abord un chauffeur";
}

export default function AssignDriverPage() {
  return (
    <Suspense fallback={<PageLoading text="Chargement..." />}>
      <AssignDriverContent />
    </Suspense>
  );
}
