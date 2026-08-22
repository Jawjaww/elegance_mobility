"use client";

import { useState, useEffect } from "react";
import { supabase, debugRlsProblem } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Search,
  Phone,
  MapPin,
  User,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";
import {
  driverStatusColors,
  driverStatusLabels,
} from "@/components/admin/drivers/driverStatusStyles";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];

export function DriversManagement() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingDriver, setAddingDriver] = useState(false);
  const [newDriver, setNewDriver] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    driving_license_number: "",
    address_line1: "",
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const errStr = typeof error === "string" ? error : String(error);
        console.error("Erreur lors du chargement des chauffeurs:", error, errStr);

        try {
          const diag = await debugRlsProblem();
          console.debug("[RLS DIAG] result:", diag);
        } catch (dErr) {
          console.warn("[RLS DIAG] échec du diagnostic:", dErr);
        }

        toast({
          title: "Erreur",
          description:
            "Impossible de charger les chauffeurs: " +
            (error.message || errStr || "Erreur inconnue"),
          variant: "destructive",
        });
        if (error.message?.includes("JWSInvalidSignature")) {
          toast({
            title: "Session invalide",
            description:
              "Le jeton d'authentification semble invalide — déconnectez-vous puis reconnectez-vous.",
            variant: "destructive",
          });
        }
        return;
      }

      setDrivers(data || []);
    } catch (err) {
      const errStr = String(err);
      console.error("Erreur lors du chargement (exception):", err, errStr);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue: " + errStr,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDriver = async () => {
    if (
      !newDriver.first_name ||
      !newDriver.last_name ||
      !newDriver.phone ||
      !newDriver.email
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setAddingDriver(true);

    try {
      const { data, error } = await supabase
        .from("drivers")
        .insert([
          {
            ...newDriver,
            status: "draft",
          },
        ])
        .select();

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter le chauffeur: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log("Chauffeur ajouté:", data);
      toast({
        title: "Succès",
        description: "Chauffeur ajouté avec succès",
      });

      setNewDriver({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        driving_license_number: "",
        address_line1: "",
      });
      setShowAddForm(false);
      loadDrivers();
    } catch (err) {
      console.error("Erreur lors de l'ajout:", err);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setAddingDriver(false);
    }
  };

  const filteredDrivers = drivers.filter(
    (driver) =>
      `${driver.first_name ?? ""} ${driver.last_name ?? ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (driver.phone ?? "").includes(searchTerm),
  );

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-100">Chauffeurs</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Gérez les chauffeurs de votre flotte
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 h-4 w-4" />
            <Input
              placeholder="Rechercher un chauffeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-700 text-white"
            />
          </div>
        </div>

        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un chauffeur
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-neutral-800">
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-100">
              Nouveau chauffeur
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Prénom *"
                value={newDriver.first_name}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, first_name: e.target.value })
                }
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Input
                placeholder="Nom *"
                value={newDriver.last_name}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, last_name: e.target.value })
                }
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Input
                placeholder="Téléphone *"
                value={newDriver.phone}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, phone: e.target.value })
                }
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Input
                placeholder="Email *"
                type="email"
                value={newDriver.email}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, email: e.target.value })
                }
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Input
                placeholder="Numéro de permis"
                value={newDriver.driving_license_number}
                onChange={(e) =>
                  setNewDriver({
                    ...newDriver,
                    driving_license_number: e.target.value,
                  })
                }
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Input
                placeholder="Adresse"
                value={newDriver.address_line1}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, address_line1: e.target.value })
                }
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addDriver} disabled={addingDriver}>
                {addingDriver ? "Ajout..." : "Ajouter"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {drivers.length === 0 ? (
        <Card className="border-neutral-800 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-100 mb-2">
            Aucun chauffeur
          </h3>
          <p className="text-neutral-400 mb-6 text-sm">
            Aucun chauffeur n&apos;est enregistré dans le système.
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            Ajouter le premier chauffeur
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDrivers.map((driver) => (
            <Card
              key={driver.id}
              className="overflow-hidden border-neutral-800 hover:border-blue-500/30 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-full">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-100 text-lg">
                        {driver.first_name ?? ""} {driver.last_name ?? ""}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${driverStatusColors[driver.status]}`}
                      >
                        {driverStatusLabels[driver.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {driver.phone && (
                  <div className="flex items-center gap-3 bg-neutral-800/50 p-3 rounded-lg">
                    <Phone className="h-4 w-4 text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-500">Téléphone</p>
                      <p className="text-sm text-neutral-100 font-medium">
                        {driver.phone}
                      </p>
                    </div>
                  </div>
                )}
                {driver.address_line1 && (
                  <div className="flex items-center gap-3 bg-neutral-800/50 p-3 rounded-lg md:col-span-2">
                    <MapPin className="h-4 w-4 text-neutral-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500">Adresse</p>
                      <p className="text-sm text-neutral-100 font-medium truncate">
                        {driver.address_line1}
                      </p>
                    </div>
                  </div>
                )}
                {driver.driving_license_number && (
                  <div className="bg-neutral-800/50 p-3 rounded-lg md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-neutral-500">
                        Numéro de permis
                      </p>
                      {driver.driving_license_expiry_date && (
                        <p className="text-xs text-neutral-500">
                          Expire :{" "}
                          {new Date(
                            driver.driving_license_expiry_date,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-neutral-100 font-mono font-medium">
                      {driver.driving_license_number}
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t border-neutral-800 pt-4">
                <Button
                  variant="outline"
                  className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                  asChild
                >
                  <Link
                    href={`/backoffice-portal/drivers/${driver.id}/documents`}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Gérer le dossier et les documents
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {filteredDrivers.length === 0 && drivers.length > 0 && (
        <p className="text-center py-8 text-neutral-400 text-sm">
          Aucun chauffeur ne correspond à votre recherche.
        </p>
      )}
    </div>
  );
}
