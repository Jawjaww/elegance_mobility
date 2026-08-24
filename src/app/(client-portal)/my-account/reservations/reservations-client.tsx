"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
} from "@tanstack/react-table";
import type { AppUser as User } from "@/lib/types/common.types";
import { reservationService } from "@/lib/services/reservationService";
import {
  clientCancelRide,
  isClientCancelFailure,
} from "@/services/clientRideService";

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
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ACCOUNT_CTA } from "@/components/account/accountUi";

const columnHelper = createColumnHelper<Reservation>();

interface ReservationsClientProps {
  user: User;
}

export default function ReservationsClient({ user }: ReservationsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // TanStack Table states
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([
    { id: "pickup_time", desc: true },
  ]);

  // Charger les réservations une seule fois au démarrage
  useEffect(() => {
    if (!user?.id) return;
    loadReservations();
  }, [user]);

  const loadReservations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        setError("Utilisateur non connecté");
        return;
      }
      console.debug(
        "[ReservationsClient] Chargement réservations pour userId:",
        user.id,
      );

      const result = await reservationService.getUserReservations(user.id);
      console.debug(
        "[ReservationsClient] reservationService.getUserReservations result:",
        result,
      );

      if (!result.success) {
        const err = result.error;
        console.error("[ReservationsClient] Erreur getUserReservations:", err);
        let errorMessage = "Erreur lors de la récupération des réservations";
        if (err && typeof err === "object") {
          if ("message" in err && typeof err.message === "string") {
            errorMessage = err.message;
          } else if ("code" in err && typeof err.code === "string") {
            errorMessage = `Erreur Supabase [${err.code}]`;
          } else {
            errorMessage = JSON.stringify(err);
          }
        } else if (typeof err === "string") {
          errorMessage = err;
        }
        setError(errorMessage);
        return;
      }

      // Pas de filtrage ici - TanStack Table s'en charge
      setReservations(result.data || []);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les réservations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/my-account/reservations/edit?id=${id}`);
  };

  const handleCancel = async (id: string) => {
    try {
      const result = await clientCancelRide(id);
      if (isClientCancelFailure(result)) {
        throw new Error(result.error || "Impossible d'annuler la réservation");
      }

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

  // Fonctions de filtrage personnalisées pour TanStack Table
  const dateFilter = (
    row: any,
    columnId: string,
    value: { startDate?: Date; endDate?: Date },
  ) => {
    if (!value.startDate || !value.endDate) return true;

    const rideDate = new Date(row.getValue(columnId));

    // Vérifier si c'est un filtre pour un jour spécifique ou un mois entier
    const isSpecificDayFilter =
      value.startDate.getDate() === value.endDate.getDate() ||
      value.endDate.getTime() - value.startDate.getTime() < 24 * 60 * 60 * 1000;

    if (isSpecificDayFilter) {
      // Filtrer par jour précis (ignorer l'heure)
      const rideDay = new Date(
        rideDate.getFullYear(),
        rideDate.getMonth(),
        rideDate.getDate(),
      );

      const filterDay = new Date(
        value.startDate.getFullYear(),
        value.startDate.getMonth(),
        value.startDate.getDate(),
      );

      return rideDay.getTime() === filterDay.getTime();
    } else {
      // Filtrer par plage de dates (mois entier)
      return rideDate >= value.startDate && rideDate <= value.endDate;
    }
  };

  const statusFilter = (row: any, columnId: string, value: string) => {
    if (!value || value === "all") return true;

    const rowStatus = row.getValue(columnId);

    // Si la valeur est "canceled", on filtre tous les types d'annulation
    if (value === "canceled") {
      return (
        rowStatus === "client-canceled" ||
        rowStatus === "driver-canceled" ||
        rowStatus === "admin-canceled"
      );
    }

    // Mapping des statuts UI vers DB pour la comparaison
    const statusMapping: Record<string, string> = {
      pending: "pending",
      accepted: "scheduled",
      inProgress: "in-progress",
      completed: "completed",
      clientCanceled: "client-canceled",
      driverCanceled: "driver-canceled",
      adminCanceled: "admin-canceled",
      noShow: "no-show",
      delayed: "delayed",
    };

    const mappedValue = statusMapping[value] || value;
    return rowStatus === mappedValue;
  };

  // Configuration des colonnes TanStack Table
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("pickup_time", {
        id: "pickup_time",
        header: "Date",
        filterFn: dateFilter,
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: "Statut",
        filterFn: statusFilter,
      }),
    ],
    [],
  );

  // Configuration de la table TanStack
  const table = useReactTable({
    data: reservations,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      dateFilter,
      statusFilter,
    },
  });

  // Récupérer les données filtrées et triées de TanStack Table
  const filteredReservations = table
    .getRowModel()
    .rows.map((row) => row.original);

  // Utilitaires pour l'affichage des filtres actifs
  const getActiveFilters = () => {
    const dateFilter = columnFilters.find((f) => f.id === "pickup_time");
    const statusFilter = columnFilters.find((f) => f.id === "status");
    return { dateFilter, statusFilter };
  };

  const { dateFilter: activeDateFilter, statusFilter: activeStatusFilter } =
    getActiveFilters();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <AccountPageHeader
        title="Mes réservations"
        description="Consultez l'historique et le statut de vos courses"
        backHref="/my-account"
        action={
          <Button
            className={ACCOUNT_CTA}
            onClick={() => router.push("/reservation")}
          >
            Nouvelle réservation
          </Button>
        }
      />

      <div className="sticky top-[55px] z-40 -mx-1 rounded-xl border border-blue-500/15 bg-neutral-950/90 px-2 py-2 shadow-lg shadow-black/20 backdrop-blur-xl sm:mx-0">
        <ReservationFilters
          onFilterChange={({ status, startDate, endDate }) => {
            const newFilters = [
              ...columnFilters.filter(
                (f) => f.id !== "status" && f.id !== "pickup_time",
              ),
            ];

            if (status && status !== "all") {
              newFilters.push({ id: "status", value: status });
            }

            if (startDate && endDate) {
              newFilters.push({
                id: "pickup_time",
                value: { startDate, endDate },
              });
            }

            setColumnFilters(newFilters);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center my-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : filteredReservations.length === 0 ? (
        <div className="rounded-2xl border border-blue-500/15 bg-neutral-900/80 px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Aucune réservation trouvée
          </h3>
          <p className="text-neutral-400 mb-6 max-w-md mx-auto">
            {activeDateFilter || activeStatusFilter
              ? "Aucune réservation ne correspond aux filtres sélectionnés"
              : "Vous n'avez pas encore de réservation"}
          </p>
          {activeDateFilter || activeStatusFilter ? (
            <Button
              variant="outline"
              className="border-blue-500/30 text-neutral-200 hover:bg-blue-500/10"
              onClick={() => setColumnFilters([])}
            >
              Effacer les filtres
            </Button>
          ) : (
            <Button
              className={ACCOUNT_CTA}
              onClick={() => router.push("/reservation")}
            >
              Faire une réservation
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {filteredReservations.map((ride: Reservation) => (
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
      )}

      {(activeDateFilter || activeStatusFilter) &&
        filteredReservations.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-blue-500/10 bg-neutral-900/50 px-3 py-2">
            <span className="text-sm text-neutral-300">
              {filteredReservations.length} réservation
              {filteredReservations.length !== 1 ? "s" : ""}
              {activeDateFilter &&
              activeDateFilter.value.startDate &&
              activeDateFilter.value.startDate.getDate() ===
                activeDateFilter.value.endDate?.getDate()
                ? ` pour le ${format(activeDateFilter.value.startDate, "d MMMM yyyy", { locale: fr })}`
                : activeDateFilter && activeDateFilter.value.startDate
                  ? ` du ${format(activeDateFilter.value.startDate, "d MMMM", { locale: fr })} au ${format(activeDateFilter.value.endDate!, "d MMMM yyyy", { locale: fr })}`
                  : ""}
              {activeStatusFilter
                ? ` avec statut "${activeStatusFilter.value}"`
                : ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
              onClick={() => setColumnFilters([])}
            >
              Effacer
            </Button>
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
