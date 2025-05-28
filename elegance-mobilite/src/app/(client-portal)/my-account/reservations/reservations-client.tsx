"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/database/client";
import type { User } from "@/lib/types/common.types";
import { reservationService } from "@/lib/services/reservationService";

import type { Database } from "@/lib/types/database.types";
type Reservation = Database["public"]["Tables"]["rides"]["Row"];

// Components
import ReservationCard from "@/components/reservation/ReservationCard";
import DetailModal from "@/components/reservation/DetailModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReservationFilters } from "@/components/reservation/ReservationFilters";
import { useToast } from "@/hooks/useToast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Services
import { ALL_DB_STATUSES, mapStatusToDb } from "@/lib/services/statusService";

interface ReservationsClientProps {
  user: User;
}

export default function ReservationsClient({ user }: ReservationsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedRide, setSelectedRide] = useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadReservations();
  }, [user, selectedStatuses]);

  const loadReservations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        setError("Utilisateur non connecté");
        return;
      }

      const sessionResult = await supabase.auth.getSession();
      console.log("[DEBUG] Session Supabase côté client:", sessionResult);
      if (sessionResult.error) {
        console.error(
          "Erreur lors de la récupération de la session:",
          sessionResult.error
        );
        setError("Erreur lors de la récupération de la session");
        return;
      }

      let dbStatusFilters =
        selectedStatuses.length > 0
          ? selectedStatuses.map(mapStatusToDb)
          : [
              "pending",
              "scheduled",
              "completed",
              "in-progress",
              "client-canceled",
              "driver-canceled",
              "admin-canceled",
              "no-show",
              "delayed",
            ];

      console.log(
        "[DEBUG] Tentative de récupération des réservations pour userId:",
        user.id
      );

      // Utiliser reservationService qui gère les erreurs de rôle
      const { success, data, error } =
        await reservationService.getUserReservations(user.id);

      if (!success) {
        console.error(
          "Erreur lors de la récupération des réservations:",
          error
        );
        // Correction : gestion robuste du message d'erreur
        let errorMessage = "Erreur lors de la récupération des réservations";
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error && typeof error === "object") {
          if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          } else if ("code" in error && typeof error.code === "string") {
            errorMessage = `Erreur Supabase [${error.code}]`;
          } else {
            errorMessage = JSON.stringify(error);
          }
        }
        setError(errorMessage);
        return;
      }

      // Appliquer les filtres côté client si nécessaire
      const filteredData = dbStatusFilters.length
        ? (data || []).filter((ride) => dbStatusFilters.includes(ride.status))
        : data;

      setReservations(filteredData || []);
    } catch (err: any) {
      console.error("Exception lors de la récupération:", err);
      setError(err.message || "Impossible de charger les réservations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/my-account/reservations/${id}/edit`);
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from("rides")
        .update({ status: "client-canceled" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Réservation annulée",
        description: "Votre réservation a été annulée avec succès",
      });

      loadReservations();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'annuler la réservation",
        variant: "destructive",
      });
    }
  };

  const handleDetails = (id: string) => {
    const ride = reservations.find((r) => r.id === id);
    if (ride) {
      setSelectedRide(ride);
      setIsDetailModalOpen(true);
    }
  };

  const groupedReservations = reservations.reduce<
    Record<string, Reservation[]>
  >((groups, ride) => {
    const dateKey = format(new Date(ride.pickup_time), "yyyy-MM-dd");
    groups[dateKey] = groups[dateKey] || [];
    groups[dateKey].push(ride);
    return groups;
  }, {});

  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-6">
      <h1 className="text-2xl font-bold text-white mb-6">Mes réservations</h1>

      <ReservationFilters
        onFilterChange={({ status }) => {
          if (status && status !== "all") {
            setSelectedStatuses([status]);
          } else {
            setSelectedStatuses([]);
          }
        }}
      />

      {isLoading ? (
        <div className="flex justify-center my-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : reservations.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">
            Aucune réservation trouvée
          </h3>
          <p className="text-neutral-400 mb-6">
            {selectedStatuses.length > 0
              ? "Aucune réservation ne correspond aux filtres sélectionnés"
              : "Vous n'avez pas encore de réservation"}
          </p>
          <Button onClick={() => router.push("/reservation")}>
            Faire une réservation
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedReservations).map(([dateKey, rides]) => (
            <div key={dateKey}>
              <h2 className="text-lg font-semibold text-white mb-4 border-b border-neutral-800 pb-2">
                {format(new Date(dateKey), "EEEE d MMMM yyyy", { locale: fr })}
              </h2>
              <div className="space-y-4">
                {rides.map((ride) => (
                  <ReservationCard
                    key={ride.id}
                    ride={ride}
                    onEdit={
                      ride.status === "pending"
                        ? () => handleEdit(ride.id)
                        : undefined
                    }
                    onCancel={
                      ride.status === "pending"
                        ? () => handleCancel(ride.id)
                        : undefined
                    }
                    onDetails={() => handleDetails(ride.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailModal
        ride={selectedRide}
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
