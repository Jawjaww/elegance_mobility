"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth/useAuth';
import { useToast } from "@/components/ui/use-toast";
import { usePrice } from '@/hooks/usePrice';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { AuthModal } from '@/components/auth/AuthModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  PackageCheck, 
  ArrowRight, 
  Route,
  Clock3
} from 'lucide-react';

const SimpleSeparator = ({ className }: { className?: string }) => (
  <div className={`h-[1px] w-full bg-neutral-800 my-2 ${className || ''}`} />
);

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservation = useReservationStore();
  const { totalPrice, calculatePrice, isLoading: priceLoading } = usePrice();
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Récupérer l'ID de la réservation pour le mode édition
  useEffect(() => {
    // Vérifier les paramètres d'URL d'abord, puis localStorage
    const urlId = searchParams?.get('id');
    const isEdit = searchParams?.get('edit') === 'true';
    const storedId = localStorage.getItem('currentEditingReservationId');
    
    const editId = urlId || storedId;
    
    if (editId) {
      console.log("Mode édition détecté, ID:", editId);
      setReservationId(editId);
      setIsEditMode(isEdit || !!storedId);
    }
  }, [searchParams]);

  // Formatter les dates
  const formattedDate = reservation.pickupDateTime
    ? new Date(reservation.pickupDateTime).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const formattedTime = reservation.pickupDateTime
    ? new Date(reservation.pickupDateTime).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Forcer le recalcul du prix lorsque les données changent
  useEffect(() => {
    // Extraire les options sélectionnées du format du store
    const selectedOptions = reservation.selectedOptions || [];
    
    // Recalculer le prix à chaque changement de données pertinentes
    if (reservation.distance && reservation.selectedVehicle) {
      console.log("Recalcul de tarification avec:", {
        distance: reservation.distance,
        vehicleType: reservation.selectedVehicle,
        options: selectedOptions
      });
      
      calculatePrice(
        reservation.distance, 
        reservation.selectedVehicle as any,
        selectedOptions
      );
    }
  }, [reservation.distance, reservation.selectedVehicle, reservation.selectedOptions, calculatePrice]);

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      // Si l'utilisateur n'est pas connecté, afficher le modal d'authentification
      setShowAuthModal(true);
      return;
    }
    
    // Si l'utilisateur est connecté, procéder à l'enregistrement
    await saveReservation();
  };

  const saveReservation = async () => {
    try {
      setIsSubmitting(true);
      
      // Vérifier que tous les éléments nécessaires sont présents
      if (!reservation.departure || !reservation.destination || !user?.id) {
        toast({
          title: "Erreur",
          description: "Informations de réservation incomplètes",
          variant: "destructive"
        });
        return;
      }
      
      // Formater correctement la date pour l'enregistrement
      const pickupDateTime = reservation.pickupDateTime instanceof Date 
        ? reservation.pickupDateTime.toISOString() 
        : new Date(reservation.pickupDateTime).toISOString();
      
      // IMPORTANT: Créer un objet propre avec UNIQUEMENT les champs attendus par la base de données
      // Cette approche élimine la possibilité d'envoyer des champs non existants
      const rideData = {
        pickup_address: reservation.departure.display_name,
        pickup_lat: reservation.departure.lat,
        pickup_lon: reservation.departure.lon, // Standardisé sur lon
        dropoff_address: reservation.destination.display_name,
        dropoff_lat: reservation.destination.lat,
        dropoff_lon: reservation.destination.lon, // Standardisé sur lon
        pickup_time: pickupDateTime,
        distance: reservation.distance,
        duration: reservation.duration,
        vehicle_type: reservation.selectedVehicle,
        options: reservation.selectedOptions,
        estimated_price: totalPrice  // Utiliser le prix recalculé
      };
      
      console.log("Données envoyées à la base de données:", {
        ...rideData,
        // Ne pas montrer le prix estimé dans les logs
        estimated_price: totalPrice
      });
      
      // Si on est en mode édition
      if (isEditMode && reservationId) {
        const { error } = await supabase
          .from('rides')
          .update(rideData)
          .eq('id', reservationId);
            
        if (error) {
          console.error("Erreur Supabase:", error);
          throw error;
        }
        
        toast({
          title: "Réservation modifiée",
          description: "Votre réservation a été mise à jour avec succès",
        });
        
        localStorage.removeItem('currentEditingReservationId');
      } else {
        // Création d'une nouvelle réservation
        const newRideData = {
          ...rideData,
          user_id: user.id,
          status: 'pending'
        };
        
        const { error } = await supabase
          .from('rides')
          .insert(newRideData);

        if (error) {
          throw error;
        }
        
        toast({
          title: "Réservation enregistrée",
          description: "Votre réservation a été créée avec succès",
        });
      }

      // Rediriger vers la page de succès
      router.push('/reservation/success');
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la réservation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error 
          ? error.message 
          : "Impossible d'enregistrer votre réservation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Après connexion réussie, sauvegarder la réservation
    saveReservation();
  };

  const handleCancel = () => {
    router.back();
  };

  if (!reservation.departure || !reservation.destination) {
    router.push('/reservation');
    return null;
  }

  return (
    <div className="container bg-neutral-950 mx-auto max-w-4xl py-12 px-4 md:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-neutral-100 text-3xl font-bold mb-2">Confirmation de réservation</h1>
        <p className="text-neutral-400">Vérifiez les détails avant de confirmer votre trajet</p>
      </div>
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8 shadow-lg">
        <h2 className="text-neutral-100 text-xl font-semibold mb-6 flex items-center">
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
              <p className="text-white">{reservation.departure?.display_name}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
              <ArrowRight className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-1">Destination</p>
              <p className="text-white">{reservation.destination?.display_name}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-1">Date</p>
              <p className="text-white">{formattedDate}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-1">Heure</p>
              <p className="text-white">{formattedTime}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
              <Car className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-1">Type de véhicule</p>
              <p className="text-white capitalize">{reservation.selectedVehicle.toLowerCase()}</p>
            </div>
          </div>
          
          {reservation.selectedOptions.length > 0 && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <PackageCheck className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Options</p>
                <p className="text-white capitalize">
                  {reservation.selectedOptions.map(option => option.toLowerCase()).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8 shadow-lg">
        <h2 className="text-neutral-100 text-xl font-semibold mb-6">Récapitulatif tarifaire</h2>
        
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Route className="h-4 w-4 mr-2 text-neutral-400" />
              <span className="text-neutral-200">Distance estimée</span>
            </div>
            <span className="text-white">{reservation.distance} km</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock3 className="h-4 w-4 mr-2 text-neutral-400" />
              <span className="text-neutral-200">Durée estimée</span>
            </div>
            <span className="text-white">{reservation.duration} min</span>
          </div>
          
          <SimpleSeparator className="my-4" />
          
          <div className="flex justify-between items-center text-xl font-semibold">
            <span className="text-white">Total</span>
            {priceLoading ? (
              <LoadingSpinner size="sm" className="text-blue-500" />
            ) : (
              <span className="text-blue-500">{formatCurrency(totalPrice || 0)}</span>
            )}
          </div>
          
          <p className="text-xs text-neutral-400 mt-2">
            Le montant sera débité à la fin de votre course
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button 
          variant="outline" 
          className="flex-1 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-100 hover:text-white transition-all duration-300 ease-out rounded-md" 
          onClick={handleCancel}
        >
          Retour
        </Button>
        <Button 
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out rounded-md" 
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Traitement en cours...
            </>
          ) : (
            'Confirmer la réservation'
          )}
        </Button>
      </div>
      
      <AuthModal 
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        defaultTab="login"
      />
    </div>
  );
}
