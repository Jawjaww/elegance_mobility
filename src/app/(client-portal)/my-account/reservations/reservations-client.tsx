"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import type { AppUser as User } from "@/lib/types/common.types";
import { reservationService } from "@/lib/services/reservationService";
import { supabase } from "@/lib/database/client";
import {
  clientCancelRide,
  isClientCancelFailure,
} from "@/services/clientRideService";

import type { Database } from "@/lib/types/database.types";
type Reservation = Database["public"]["Tables"]["rides"]["Row"];

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

type DateFilterValue = { startDate?: Date; endDate?: Date };

function parseReservationLoadError(err: unknown): string {
  if (err && typeof err === "object") {
    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
    if ("code" in err && typeof err.code === "string") {
      return `Erreur Supabase [${err.code}]`;
    }
    return JSON.stringify(err);
  }
  if (typeof err === "string") return err;
  return "Erreur lors de la récupération des réservations";
}

function formatDateFilterSummary(filter: { value: unknown } | undefined): string {
  const value = filter?.value as DateFilterValue | undefined;
  const startDate = value?.startDate;
  const endDate = value?.endDate;
  if (!startDate) return "";

  const sameDay = endDate?.getDate() === startDate.getDate();
  if (sameDay) {
    return ` pour le ${format(startDate, "d MMMM yyyy", { locale: fr })}`;
  }
  if (endDate) {
    return ` du ${format(startDate, "d MMMM", { locale: fr })} au ${format(endDate, "d MMMM yyyy", { locale: fr })}`;
  }
  return "";
}

function formatStatusFilterSummary(
  filter: { value: unknown } | undefined,
): string {
  if (typeof filter?.value !== "string" || !filter.value) return "";
  return ` avec statut "${filter.value}"`;
}

function dateFilter(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  value: DateFilterValue,
) {
  if (!value.startDate || !value.endDate) return true;

  const rideDate = new Date(row.getValue(columnId) as string);
  const isSpecificDayFilter =
    value.startDate.getDate() === value.endDate.getDate() ||
    value.endDate.getTime() - value.startDate.getTime() < 24 * 60 * 60 * 1000;

  if (isSpecificDayFilter) {
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
  }

  return rideDate >= value.startDate && rideDate <= value.endDate;
}

function statusFilter(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  value: string,
) {
  if (!value || value === "all") return true;

  const rowStatus = row.getValue(columnId) as string;
  if (value === "canceled") {
    return (
      rowStatus === "client-canceled" ||
      rowStatus === "driver-canceled" ||
      rowStatus === "admin-canceled"
    );
  }

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

  return rowStatus === (statusMapping[value] ?? value);
}

function ReservationsListBody({
  isLoading,
  error,
  filteredReservations,
  hasActiveFilters,
  onClearFilters,
  onEdit,
  onCancel,
  onDetails,
  onBook,
  onRefresh,
}: Readonly<{
  isLoading: boolean;
  error: string | null;
  filteredReservations: Reservation[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onDetails: (id: string) => void;
  onBook: () => void;
  onRefresh?: () => void;
}>) {
  if (isLoading) {
    return (
      <div className="flex justify-center my-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (filteredReservations.length === 0) {
    const emptyMessage = hasActiveFilters
      ? "Aucune réservation ne correspond aux filtres sélectionnés"
      : "Vous n'avez pas encore de réservation";

    return (
      <div className="rounded-2xl border border-blue-500/15 bg-neutral-900/80 px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          Aucune réservation trouvée
        </h3>
        <p className="text-neutral-400 mb-6 max-w-md mx-auto">{emptyMessage}</p>
        {hasActiveFilters ? (
          <Button
            variant="outline"
            className="border-blue-500/30 text-neutral-200 hover:bg-blue-500/10"
            onClick={onClearFilters}
          >
            Effacer les filtres
          </Button>
        ) : (
          <Button className={ACCOUNT_CTA} onClick={onBook}>
            Faire une réservation
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {filteredReservations.map((ride) => (
        <ReservationCard
          key={ride.id}
          ride={ride}
          onEdit={
            ride.status === "pending" || ride.status === "delayed"
              ? () => onEdit(ride.id)
              : undefined
          }
          onCancel={
            ride.status === "pending" || ride.status === "delayed"
              ? () => onCancel(ride.id)
              : undefined
          }
          onDetails={() => onDetails(ride.id)}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

export default function ReservationsClient({
  user,
}: Readonly<ReservationsClientProps>) {
  const router = useRouter();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "pickup_time", desc: true },
  ]);

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        setError("Utilisateur non connecté");
        return;
      }

      const result = await reservationService.getUserReservations(user.id);
      if (!result.success) {
        setError(parseReservationLoadError(result.error));
        return;
      }

      setReservations(result.data ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Impossible de charger les réservations";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void loadReservations();
  }, [user?.id, loadReservations]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`client-reservations-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Reservation;
          setReservations((prev) =>
            prev.map((ride) => (ride.id === updated.id ? updated : ride)),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

      void loadReservations();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Impossible d'annuler la réservation";
      toast({
        title: "Erreur",
        description: message,
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

  const columns = useMemo(
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

  const table = useReactTable({
    data: reservations,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { dateFilter, statusFilter },
  });

  const filteredReservations = table
    .getRowModel()
    .rows.map((row) => row.original);

  const activeDateFilter = columnFilters.find((f) => f.id === "pickup_time");
  const activeStatusFilter = columnFilters.find((f) => f.id === "status");
  const hasActiveFilters = Boolean(activeDateFilter || activeStatusFilter);

  const filterSummaryParts = [
    `${filteredReservations.length} réservation${filteredReservations.length === 1 ? "" : "s"}`,
    formatDateFilterSummary(activeDateFilter),
    formatStatusFilterSummary(activeStatusFilter),
  ].join("");

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
            const newFilters = columnFilters.filter(
              (f) => f.id !== "status" && f.id !== "pickup_time",
            );

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

      <ReservationsListBody
        isLoading={isLoading}
        error={error}
        filteredReservations={filteredReservations}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => setColumnFilters([])}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onDetails={handleDetails}
        onBook={() => router.push("/reservation")}
        onRefresh={() => void loadReservations()}
      />

      {hasActiveFilters && filteredReservations.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-blue-500/10 bg-neutral-900/50 px-3 py-2">
          <span className="text-sm text-neutral-300">{filterSummaryParts}</span>
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
        onRefresh={() => void loadReservations()}
      />
    </div>
  );
}
