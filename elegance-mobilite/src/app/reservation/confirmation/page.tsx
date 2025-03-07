"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { usePrice } from '@/hooks/usePrice';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';
import { supabase } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
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
  const reservation = useReservationStore();
  const { totalPrice, isLoading: priceLoading } = usePrice();
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      
      // Modification de l'approche pour vérifier/créer l'utilisateur
      let userExists = false;
      
      try {
        // 1. Vérifier si l'utilisateur existe dans la table users
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
          
        userExists = !!existingUser;
      } catch (err) {
        // Si une erreur se produit lors de la vérification, on continue quand même
        console.log("Erreur lors de la vérification de l'utilisateur, on continue:", err);
      }
      
      // 2. Si l'utilisateur n'existe pas, essayer de le créer, mais ignorer l'erreur de clé dupliquée
      if (!userExists) {
        try {
          console.log("Tentative de création d'utilisateur dans la table users...");
          
          await supabase
            .from('users')
            .insert({
              id: user.id,
              role: 'client',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          console.log("Utilisateur créé avec succès dans la table users");
        } catch (createUserError: any) {
          // Si l'erreur est une violation de contrainte de clé, ignorer l'erreur - l'utilisateur existe déjà
          if (createUserError.code === '23505') {
            console.log("L'utilisateur existe déjà, continuons avec la réservation");
          } else {
            // Pour les autres types d'erreurs, les logger mais continuer
            console.warn("Erreur non bloquante lors de la création de l'utilisateur:", createUserError);
          }
        }
      }
      
      // 3. Maintenant, insérer la réservation, que la création d'utilisateur ait réussi ou non
      const { data, error } = await supabase
        .from('rides')
        .insert({
          user_id: user.id,
          pickup_address: reservation.departure.display_name,
          pickup_lat: reservation.departure.lat,
          pickup_lon: reservation.departure.lon,
          dropoff_address: reservation.destination.display_name,
          dropoff_lat: reservation.destination.lat,
          dropoff_lon: reservation.destination.lon,
          pickup_time: reservation.pickupDateTime,
          distance: reservation.distance,
          duration: reservation.duration,
          vehicle_type: reservation.selectedVehicle,
          options: reservation.selectedOptions,
          estimated_price: totalPrice,
          status: 'pending'
        });

      if (error) {
        // Si l'erreur d'insertion de réservation est liée à une contrainte de clé étrangère d'utilisateur
        if (error.code === '23503' && error.message?.includes('rides_user_id_fkey')) {
          throw new Error("L'utilisateur n'existe pas dans la base de données. Veuillez vous déconnecter et vous reconnecter.");
        }
        throw error;
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