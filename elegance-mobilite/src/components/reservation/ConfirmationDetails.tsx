"use client";

import { useReservationStore } from "@/lib/stores/reservationStore";
import { supabase } from "@/lib/database/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Suspense, useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import MapLibreMap from "@/components/map/MapLibreMap";
import { AuthModal } from "../../app/auth/login/AuthModal";
import type { Database } from "@/lib/types/database.types";
import { 
  MapPin, 
  Calendar,
  Clock,
  Car,
  PackageCheck,
  ArrowRight,
  Route
} from "lucide-react";

// Type de la table rides de Supabase
type Ride = Database['public']['rides']['Row'];

const SimpleSeparator = ({ className }: { className?: string }) => (
  <div className={`h-[1px] w-full bg-neutral-800 my-2 ${className || ''}`} />
);

export function ConfirmationDetails() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const {
    departure,
    destination,
    pickupDateTime,
    selectedVehicle,
    selectedOptions,
    distance,
    duration,
    reset
  } = useReservationStore();

  // État local pour gérer la date formatée
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  // Gestion sécurisée du formatage de la date
  useEffect(() => {
    if (pickupDateTime) {
      try {
        const dateObj = pickupDateTime instanceof Date ? pickupDateTime : new Date(pickupDateTime);
        setFormattedDate(format(dateObj, "EEEE d MMMM yyyy", { locale: fr }));
        setFormattedTime(format(dateObj, "HH:mm", { locale: fr }));
      } catch (error) {
        console.error("Erreur lors du formatage de la date:", error);
        setFormattedDate("Date non valide");
        setFormattedTime("");
      }
    }
  }, [pickupDateTime]);

  // État pour gérer l'affichage du modal d'authentification
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleConfirm = async () => {
    if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
      toast({
        title: "Erreur",
        description: "Informations de réservation incomplètes",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("[DEBUG] Utilisateur non connecté, affichage du modal d'authentification");
        setIsLoading(false);
        setShowAuthModal(true);
        return;
      }

      const dateObj = pickupDateTime instanceof Date ? pickupDateTime : new Date(pickupDateTime);

      // Préparation des données conformes au type Ride
      const newRide: Partial<Ride> = {
        user_id: user.id,
        pickup_address: departure.display_name,
        pickup_lat: departure.lat,
        pickup_lon: departure.lon,
        dropoff_address: destination.display_name,
        dropoff_lat: destination.lat,
        dropoff_lon: destination.lon,
        pickup_time: dateObj.toISOString(),
        vehicle_type: selectedVehicle,
        options: selectedOptions,
        distance: distance || null,
        duration: duration || null,
        status: 'pending'
      };

      console.log("[DEBUG] Tentative de création de réservation:", newRide);

      const { data, error } = await supabase
        .from('rides')
        .insert(newRide)
        .select()
        .single();

      if (error) {
        console.error("[DEBUG] Erreur Supabase:", error);
        throw error;
      }

      console.log("[DEBUG] Réservation créée avec succès:", data);
      
      toast({
        title: "✨ Réservation confirmée",
        description: `Votre trajet de ${departure.display_name.split(',')[0]} à ${destination.display_name.split(',')[0]} a été enregistré pour le ${formattedDate} à ${formattedTime}. Un e-mail de confirmation vous a été envoyé.`,
        variant: "success"
      });
      
      if (data && data.id) {
        sessionStorage.setItem('last_confirmed_reservation', data.id);
      }
      
      setTimeout(() => {
        try {
          window.location.href = "/reservation/success";
        } catch (e) {
          console.error("[DEBUG] Erreur lors de la redirection:", e);
          reset();
        }
      }, 100);
      
    } catch (error: any) {
      console.error("[DEBUG] Erreur détaillée lors de la création de la réservation:", error);
      
      toast({
        title: "Erreur lors de la création de la réservation",
        description: error.message || "Une erreur est survenue lors de la création de la réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = () => {
    router.push("/reservation");
  };

  useEffect(() => {
    if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
      router.push("/reservation");
    }
  }, [departure, destination, pickupDateTime, selectedVehicle, router]);
  
  if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleAuthSuccess = async () => {
    console.log("[DEBUG] Authentification réussie, reprise du processus de réservation");
  };

  return (
    <div className="container mx-auto py-8 mb-20">
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess} 
        defaultTab="login"
      />
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Confirmation de réservation</h1>
        <p className="text-neutral-400">Vérifiez les détails avant de confirmer votre trajet</p>
      </div>

      <div className="grid gap-8 max-w-4xl mx-auto">
        <Card className="p-6 bg-neutral-900 border-neutral-800">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Route className="w-5 h-5 mr-2 text-blue-500" />
            Détails du trajet
          </h2>
          
          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <MapPin className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Départ</p>
                <p className="text-neutral-100">{departure.display_name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <ArrowRight className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Destination</p>
                <p className="text-neutral-100">{destination.display_name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Date</p>
                <p className="text-neutral-100">{formattedDate}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Heure</p>
                <p className="text-neutral-100">{formattedTime}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <Car className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Type de véhicule</p>
                <p className="text-neutral-100">{selectedVehicle === "STANDARD" ? "Berline Premium" : "Van de Luxe"}</p>
              </div>
            </div>
            
            {selectedOptions?.length > 0 && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                  <PackageCheck className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Options</p>
                  <ul className="space-y-1">
                    {selectedOptions.map((option) => (
                      <li key={option} className="text-neutral-100">
                        {option === "accueil" ? "Accueil personnalisé" : "Boissons fraîches"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {(distance || duration) && (
              <>
                <SimpleSeparator className="my-4" />
                <div className="grid gap-2">
                  {distance && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Distance estimée</span>
                      <span className="text-neutral-100">{distance} km</span>
                    </div>
                  )}
                  {duration && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Durée estimée</span>
                      <span className="text-neutral-100">{duration} min</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        <Suspense fallback={<Card className="p-6"><LoadingSpinner /></Card>}>
          <Card className="p-0 overflow-hidden bg-neutral-900 border-neutral-800">
            <MapLibreMap
              departure={departure}
              destination={destination}
              onRouteCalculated={(distance, duration) => {}}
            />
          </Card>
        </Suspense>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={handleModify}
            className="flex-1 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-100"
            disabled={isLoading}
          >
            Modifier
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 btn-gradient hover:opacity-90 text-neutral-100"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Création en cours...
              </>
            ) : (
              "Confirmer la réservation"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
