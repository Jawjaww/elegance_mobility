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
  createColumnHelper
} from '@tanstack/react-table';
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
  const [sorting, setSorting] = useState<{id: string, desc: boolean}[]>([
    { id: 'pickup_time', desc: true }
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

      const sessionResult = await supabase.auth.getSession();
      if (sessionResult.error) {
        setError("Erreur lors de la récupération de la session");
        return;
      }

      // Charger TOUTES les réservations - TanStack Table gérera le filtrage
      const { success, data, error } = await reservationService.getUserReservations(user.id);

      if (!success) {
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

      // Pas de filtrage ici - TanStack Table s'en charge
      setReservations(data || []);
    } catch (err: any) {
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

  // Fonctions de filtrage personnalisées pour TanStack Table
  const dateFilter = (row: any, columnId: string, value: { startDate?: Date; endDate?: Date }) => {
    if (!value.startDate || !value.endDate) return true;
    
    const rideDate = new Date(row.getValue(columnId));
    
    // Vérifier si c'est un filtre pour un jour spécifique ou un mois entier
    const isSpecificDayFilter = 
      value.startDate.getDate() === value.endDate.getDate() ||
      (value.endDate.getTime() - value.startDate.getTime()) < 24 * 60 * 60 * 1000;
    
    if (isSpecificDayFilter) {
      // Filtrer par jour précis (ignorer l'heure)
      const rideDay = new Date(
        rideDate.getFullYear(),
        rideDate.getMonth(), 
        rideDate.getDate()
      );
      
      const filterDay = new Date(
        value.startDate.getFullYear(),
        value.startDate.getMonth(),
        value.startDate.getDate()
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
      return rowStatus === "client-canceled" || 
             rowStatus === "driver-canceled" || 
             rowStatus === "admin-canceled";
    }
    
    // Mapping des statuts UI vers DB pour la comparaison
    const statusMapping: Record<string, string> = {
      'pending': 'pending',
      'accepted': 'scheduled',
      'inProgress': 'in-progress',
      'completed': 'completed',
      'clientCanceled': 'client-canceled',
      'driverCanceled': 'driver-canceled',
      'adminCanceled': 'admin-canceled',
      'noShow': 'no-show',
      'delayed': 'delayed'
    };
    
    const mappedValue = statusMapping[value] || value;
    return rowStatus === mappedValue;
  };

  // Configuration des colonnes TanStack Table
  const columns = React.useMemo(
    () => [
      columnHelper.accessor('pickup_time', {
        id: 'pickup_time',
        header: 'Date',
        filterFn: dateFilter,
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Statut',
        filterFn: statusFilter,
      }),
    ],
    []
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
  const filteredReservations = table.getRowModel().rows.map(row => row.original);

  // Utilitaires pour l'affichage des filtres actifs
  const getActiveFilters = () => {
    const dateFilter = columnFilters.find(f => f.id === 'pickup_time');
    const statusFilter = columnFilters.find(f => f.id === 'status');
    return { dateFilter, statusFilter };
  };

  const { dateFilter: activeDateFilter, statusFilter: activeStatusFilter } = getActiveFilters();

  return (
    <div className="container max-w-4xl py-2 pt-0.5 px-4 sm:px-2">
      <div className="flex flex-col w-full gap-4 mb-2 sticky top-[55px] z-40 pt-2 pb-2 bg-neutral-950/20 shadow-md">
        <ReservationFilters
          onFilterChange={({ status, startDate, endDate }) => {
            // Mettre à jour les filtres avec TanStack Table
            const newFilters = [...columnFilters.filter(f => f.id !== 'status' && f.id !== 'pickup_time')];
            
            if (status && status !== "all") {
              newFilters.push({ id: 'status', value: status });
            }
            
            if (startDate && endDate) {
              newFilters.push({ id: 'pickup_time', value: { startDate, endDate } });
            }
            
            setColumnFilters(newFilters);
          }}
        />   
      </div>

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
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">
            Aucune réservation trouvée
          </h3>
          <p className="text-neutral-400 mb-6">
            {(activeDateFilter || activeStatusFilter)
              ? "Aucune réservation ne correspond aux filtres sélectionnés"
              : "Vous n'avez pas encore de réservation"}
          </p>
          <Button onClick={() => router.push("/reservation")}>Faire une réservation</Button>
        </div>
      ) : (
        <div className="space-y-4 pt-4 pb-8 relative">
          {/* Effet de transparence sur le bas */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none"></div>
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
          
          {/* Si pas de résultats après filtrage mais des réservations existent */}
          {filteredReservations.length === 0 && reservations.length > 0 && (
            <div className="bg-neutral-800/40 p-4 rounded-lg text-center">
              <p className="text-neutral-300 mb-2">
                Aucune réservation ne correspond aux filtres sélectionnés.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setColumnFilters([]);
                }}
              >
                Afficher toutes les réservations
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Afficher un indicateur de filtrage actif pour une meilleure UX */}
        {(activeDateFilter || activeStatusFilter) && (
          <div className="flex items-center justify-between p-3 pb-12 rounded-md">
            <div className="flex items-center text-sm">
              <span className="text-neutral-300">
                {filteredReservations.length} réservation{filteredReservations.length !== 1 ? 's' : ''} 
                {activeDateFilter && activeDateFilter.value.startDate && activeDateFilter.value.startDate.getDate() === activeDateFilter.value.endDate?.getDate() 
                  ? ` pour le ${format(activeDateFilter.value.startDate, "d MMMM yyyy", { locale: fr })}`
                  : activeDateFilter && activeDateFilter.value.startDate 
                    ? ` du ${format(activeDateFilter.value.startDate, "d MMMM", { locale: fr })} au ${format(activeDateFilter.value.endDate!, "d MMMM yyyy", { locale: fr })}`
                    : ''}
                {activeStatusFilter ? ` avec statut "${activeStatusFilter.value}"` : ''}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setColumnFilters([]);
              }}
            >
              Effacer les filtres
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
