"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CalendarCheck, Car, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { formatDate } from "@/lib/utils/dateUtils";
import { useAuth } from "@/lib/auth/useAuth";
import Link from "next/link";
import { bookingService } from "@/lib/services/bookingService";
import { usePrice } from "@/hooks/usePrice";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import dynamic from 'next/dynamic';

// Import dynamique de la carte pour éviter les erreurs de SSR
const DynamicLeafletMap = dynamic(
  () => import('@/components/map/DynamicLeafletMap'),
  { ssr: false }
);

export default function SuccessPage() {
  const router = useRouter();
  const store = useReservationStore();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { price } = usePrice();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [saveAttempts, setSaveAttempts] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Générer un numéro de réservation
  const bookingNumber = bookingId ? 
    `EM-${bookingId.substring(0, 6).toUpperCase()}` : 
    `EM-${Math.floor(100000 + Math.random() * 900000)}`;

  // Vérification de l'authentification et redirection si nécessaire
  useEffect(() => {
    // Attendre que l'état d'authentification soit chargé
    if (isLoading) return;
    
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de confirmation
    if (!isAuthenticated || !user) {
      console.warn("Accès non autorisé à la page de succès - redirection vers la confirmation");
      router.replace("/reservation/confirmation");
      return;
    }
    
    // Si les données de réservation sont manquantes, rediriger vers la page de réservation
    if (!store.departure || !store.destination) {
      console.warn("Données de réservation manquantes - redirection");
      router.replace("/reservation");
      return;
    }
    
    // Continuation du processus normal...
  }, [isLoading, isAuthenticated, user, store, router]);

  // Log détaillé pour les erreurs Supabase
  const logSupabaseError = (error: any) => {
    console.error("Détails de l'erreur Supabase:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code
    });
  };

  // Vérifiez que pickupDateTime est un objet Date valide
  const formattedPickupDateTime = store.pickupDateTime instanceof Date
    ? formatDate(store.pickupDateTime)
    : typeof store.pickupDateTime === 'string'
      ? store.pickupDateTime
      : 'Date non disponible';

  // S'assurer que les coordonnées pour la carte sont complètes
  const origin = store.departure ? {
    lat: store.departure.lat,
    lon: store.departure.lon || 0 // Fournir une valeur par défaut
  } : null;

  const destinationCoords = store.destination ? {
    lat: store.destination.lat,
    lon: store.destination.lon || 0 // Fournir une valeur par défaut
  } : null;

  // Fonction pour vérifier si un objet de coordonnées est valide
  const isValidLocation = (loc: any) => {
    return loc && typeof loc.lat === 'number' && typeof loc.lon === 'number';
  };

  // Sauvegarde de la réservation dans Supabase avec retries
  useEffect(() => {
    const MAX_ATTEMPTS = 3;
    
    const saveBooking = async () => {
      if (user && store.departure && store.destination && !hasSaved && saveAttempts < MAX_ATTEMPTS) {
        setIsSaving(true);
        setSaveError(null);
        
        try {
          // Vérifier que les coordonnées sont valides avant d'envoyer
          if (!isValidLocation(store.departure) || !isValidLocation(store.destination)) {
            console.error("Coordonnées invalides:", { 
              departure: store.departure, 
              destination: store.destination 
            });
            throw new Error("Coordonnées invalides. Veuillez réessayer.");
          }

          // Log pour débogage
          console.log("Tentative de sauvegarde avec l'utilisateur:", {
            userId: user.id,
            authState: !!user
          });
          
          const bookingData = {
            user_id: user.id,
            pickup_address: store.departure.display_name,
            dropoff_address: store.destination.display_name,
            pickup_time: store.pickupDateTime instanceof Date 
              ? store.pickupDateTime.toISOString() 
              : new Date().toISOString(), // Utiliser la date actuelle comme fallback
            estimated_price: price?.totalPrice || 0,
            pickup_lat: store.departure.lat,
            pickup_lon: store.departure.lon,
            dropoff_lat: store.destination.lat, 
            dropoff_lon: store.destination.lon,
            distance: store.distance || 0,
            duration: store.duration || 0,
            vehicle_type: store.selectedVehicle,
            options: store.selectedOptions
          };
          
          const { success, id, error } = await bookingService.createBooking(bookingData);
          
          if (success && id) {
            setBookingId(id);
            setHasSaved(true);
            toast({
              title: "Réservation enregistrée",
              description: "Votre réservation a été enregistrée avec succès.",
            });
          } else {
            // Log détaillé de l'erreur
            logSupabaseError(error);
            console.error("Erreur lors de l'enregistrement de la réservation:", error);
            
            // Vérifier si l'erreur est liée à la politique RLS
            if (error && error.includes("violates row-level security policy")) {
              setSaveError("Problème d'autorisation: vérifiez que vous êtes correctement connecté");
            } else {
              setSaveError(error || "Impossible d'enregistrer votre réservation");
            }
            
            setSaveAttempts(prev => prev + 1);
            
            if (saveAttempts + 1 >= MAX_ATTEMPTS) {
              toast({
                title: "Erreur",
                description: "Nous n'avons pas pu enregistrer votre réservation après plusieurs tentatives.",
                variant: "destructive",
              });
            }
          }
        } catch (error: any) {
          // Log détaillé de l'erreur
          logSupabaseError(error);
          console.error("Exception lors de l'enregistrement de la réservation:", error);
          setSaveError(error?.message || "Une erreur inattendue s'est produite");
          setSaveAttempts(prev => prev + 1);
        } finally {
          setIsSaving(false);
        }
      }
    };
    
    saveBooking();
  }, [user, store, price, hasSaved, saveAttempts]);

  // Fonction pour réessayer la sauvegarde
  const handleRetry = () => {
    setSaveAttempts(0); // Réinitialiser le compteur pour permettre de nouveaux essais
  };

  const handleReturnHome = () => {
    router.push("/");
  };

  if (!store.departure || !store.destination) {
    return null; // Éviter le rendu pendant la redirection
  }

  // Afficher la carte seulement si les deux coordonnées sont valides
  const showMap = isValidLocation(origin) && isValidLocation(destinationCoords);

  // Si le chargement est en cours ou l'utilisateur n'est pas authentifié, afficher un chargement
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg">Vérification de votre réservation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="mb-6">
            {saveError && saveAttempts >= 3 ? (
              <AlertCircle className="h-20 w-20 text-yellow-500" />
            ) : (
              <CheckCircle2 className="h-20 w-20 text-green-500" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {saveError && saveAttempts >= 3 ? "Réservation en attente de confirmation" : "Réservation confirmée !"}
          </h1>
          <p className="text-gray-400 text-center max-w-xl">
            {saveError && saveAttempts >= 3
              ? "Votre réservation a été enregistrée localement mais n'a pas pu être synchronisée avec nos serveurs."
              : "Merci pour votre réservation. Votre chauffeur vous contactera peu avant le départ pour confirmer les détails."
            }
          </p>
        </div>

        {saveError && saveAttempts >= 3 && (
          <Alert variant="warning" className="mb-6 bg-yellow-900/30 border-yellow-800 text-yellow-100">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Problème de connexion</AlertTitle>
            <AlertDescription className="mt-2">
              <p>{saveError}</p>
              <Button 
                onClick={handleRetry}
                variant="outline" 
                className="mt-2 bg-yellow-800/30 border-yellow-700 hover:bg-yellow-800/50"
              >
                Réessayer la sauvegarde
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-neutral-900 border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
            <div>
              <p className="text-sm text-neutral-400">Numéro de réservation</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">{bookingNumber}</p>
                {isSaving && <Loader2 className="animate-spin h-4 w-4 text-blue-500" />}
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Client</p>
              <p className="font-medium">{user?.name || "Client"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-400" />
                <span className="font-medium">Date et heure</span>
              </div>
              <p className="text-gray-300 pl-7">
                {formattedPickupDateTime} {/* Utilisation de la variable sûre */}
              </p>
              
              <div className="flex items-center gap-2 mt-4">
                <Car className="h-5 w-5 text-blue-400" />
                <span className="font-medium">Véhicule</span>
              </div>
              <p className="text-gray-300 pl-7">
                {store.selectedVehicle === 'STANDARD' ? 'Berline Standard' : 
                store.selectedVehicle === 'PREMIUM' ? 'Berline Premium' :
                store.selectedVehicle === 'VAN' ? 'Van de Luxe' : store.selectedVehicle}
              </p>
            </div>

            <div className="space-y-4">
              <p className="font-medium">Trajet</p>
              <div className="pl-2 border-l-2 border-blue-500 space-y-4">
                <div>
                  <p className="text-sm text-blue-400">Départ</p>
                  <p className="text-gray-300">{store.departure?.display_name}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-400">Destination</p>
                  <p className="text-gray-300">{store.destination?.display_name}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Ajout d'une condition pour afficher la carte uniquement si les coordonnées sont valides */}
        {showMap ? (
          <Card className="bg-neutral-900 border-neutral-700 p-0 overflow-hidden mb-6">
            <div className="h-[300px]">
              <DynamicLeafletMap 
                startPoint={origin} 
                endPoint={destinationCoords} 
                enableRouting={true}
              />
            </div>
          </Card>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleReturnHome}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Retour à l'accueil
          </Button>
          <Link href="/my-account/bookings">
            <Button variant="outline" className="border-neutral-700 bg-neutral-800 text-white hover:text-white hover:bg-neutral-800/80">
              Voir mes réservations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
