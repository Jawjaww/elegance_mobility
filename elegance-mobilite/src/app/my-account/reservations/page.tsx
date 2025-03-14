"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/lib/auth/useAuth";
import ReservationCard from "@/components/reservation/ReservationCard";
import { DetailModal } from "@/components/reservation/DetailModal"; // Importation du composant DetailModal
import { supabase } from "@/utils/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ReservationFilters } from "@/components/reservation/ReservationFilters";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ALL_DB_STATUSES, mapStatusToDb } from "@/lib/services/statusService";

// Définition de l'interface pour les réservations
interface Reservation {
  id: string;
  pickup_time: string;
  pickup_address: string;
  dropoff_address: string;
  vehicle_type?: string;
  status: string;
  estimated_price?: number | null;
  distance?: number | null;
  duration?: number | null;
  created_at: string;
  user_id: string;
}

export default function ReservationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  
  // États pour le modal de détails
  const [selectedRide, setSelectedRide] = useState<Reservation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    loadReservations();
  }, [user]);

  const loadReservations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Vérifier que l'utilisateur existe
      if (!user?.id) {
        setError("Utilisateur non connecté");
        return;
      }
      
      // Convertir les statuts UI en statuts DB avec gestion d'erreur
      let dbStatusFilters: string[];
      
      if (selectedStatuses.length > 0) {
        // Mapper chaque statut sélectionné vers son équivalent DB
        dbStatusFilters = selectedStatuses.map(mapStatusToDb);
      } else {
        // Liste mise à jour sans 'canceled'
        dbStatusFilters = ["pending", "scheduled", "completed", "in-progress", 
                          "client-canceled", "driver-canceled", "admin-canceled", 
                          "no-show", "delayed"];
      }
      
      // S'assurer que dbStatusFilters n'est pas vide
      if (!dbStatusFilters.length) {
        dbStatusFilters = ["pending"]; // Au moins un statut par défaut
      }
      
      console.log("Filtres de statut utilisés:", dbStatusFilters);
      
      // Créer la requête de base
      const query = supabase
        .from('rides')
        .select('*')
        .eq('user_id', user.id);
      
      // Ajouter le filtre de statut seulement s'il y a des valeurs à filtrer
      if (dbStatusFilters.length > 0) {
        query.in('status', dbStatusFilters);
      }
      
      // Exécuter la requête
      const { data, error } = await query.order('pickup_time', { ascending: false });
        
      if (error) {
        // Vérification détaillée des propriétés de l'erreur avant affichage
        const errorDetails = {
          code: error.code || 'no_code',
          message: error.message || 'Aucun message d\'erreur',
          details: error.details || 'Pas de détails disponibles'
        };
        
        console.error("Erreur Supabase:", errorDetails);
        throw new Error(`Erreur de base de données: ${errorDetails.message}`);
      }
      
      console.log(`${data ? data.length : 0} réservations chargées`);
      setReservations(data || []);
    } catch (err: any) {
      // Gestion améliorée avec vérification du type d'erreur
      let errorMessage = "Impossible de charger vos réservations";
      
      // Vérifier si l'erreur est une instance d'Error standard
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error("Erreur lors du chargement des réservations:", errorMessage);
      } 
      // Si c'est un objet avec une propriété message
      else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message || errorMessage;
        console.error("Erreur objet lors du chargement:", errorMessage);
      }
      // Si c'est un autre type d'erreur
      else {
        console.error("Erreur non standard:", typeof err, err);
      }
      
      // Définir le message d'erreur pour l'utilisateur
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadReservations();
    }
  }, [selectedStatuses, user?.id]);

  const handleEdit = (id: string) => {
    // Récupérer la réservation à modifier
    const ride = reservations.find(r => r.id === id);
    if (!ride) return;
    
    try {
      // Rediriger vers la page de réservation avec l'id en paramètre
      router.push(`/reservation/edit?id=${id}`);
    } catch (err) {
      console.error("Erreur de navigation:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la page de modification",
        variant: "destructive",
      });
    }
  };

  // Nouveau gestionnaire pour afficher les détails dans un modal au lieu de rediriger
  const handleDetails = (id: string) => {
    const ride = reservations.find(r => r.id === id);
    if (!ride) return;
    
    setSelectedRide(ride);
    setIsDetailModalOpen(true);
  };

  const handleCancel = async (id: string) => {
    try {
      // Récupérer d'abord les détails de la réservation pour vérifier son statut
      const { data: ride, error: fetchError } = await supabase
        .from('rides')
        .select('status, pickup_time')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      if (!ride) throw new Error("Réservation introuvable");
      
      // Vérifier si la réservation peut être annulée
      const pickupTime = new Date(ride.pickup_time);
      const now = new Date();
      
      // Vérifier si la course est dans le passé
      if (pickupTime < now) {
        toast({
          title: "Impossible d'annuler",
          description: "Cette réservation est déjà passée et ne peut pas être annulée",
          variant: "destructive",
        });
        return;
      }
      
      // Vérifier si le statut permet l'annulation
      if (ride.status !== 'pending' && ride.status !== 'scheduled') {
        toast({
          title: "Impossible d'annuler",
          description: `Cette réservation ne peut pas être annulée car son statut est "${ride.status}"`,
          variant: "destructive",
        });
        return;
      }
      
      // Utiliser la valeur correcte pour canceled dans la base de données (avec un seul 'l')
      const { error } = await supabase
        .from('rides')
        .update({ status: 'client-canceled' })  // Utiliser 'client-canceled' (un seul 'l')
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Réservation annulée",
        description: "Votre réservation a été annulée avec succès",
      });
      
      // Recharger les réservations
      loadReservations();
    } catch (err: any) {
      console.error("Erreur lors de l'annulation:", err);
      toast({
        title: "Erreur",
        description: err?.message || "Impossible d'annuler cette réservation",
        variant: "destructive",
      });
    }
  };

  // Organiser les réservations par date
  const groupedReservations = reservations.reduce<Record<string, Reservation[]>>((groups, ride) => {
    // Créer une date sans heure pour le regroupement
    const dateKey = format(new Date(ride.pickup_time), 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(ride);
    return groups;
  }, {});

  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-6">
      <h1 className="text-2xl font-bold text-white mb-6">Mes réservations</h1>
      
      <ReservationFilters 
        onStatusChange={setSelectedStatuses}
        selectedStatuses={selectedStatuses}
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
                {rides.map((ride: Reservation) => (
                  <ReservationCard
                    key={ride.id}
                    ride={ride}
                    onEdit={ride.status === "pending" ? handleEdit : undefined}
                    onCancel={ride.status === "pending" ? handleCancel : undefined}
                    onDetails={() => handleDetails(ride.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour afficher les détails de la réservation */}
      <DetailModal 
        ride={selectedRide}
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
