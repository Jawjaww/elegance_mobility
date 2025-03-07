"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, MapPin, Car, PackageCheck } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';

export default function ReservationSuccessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const reservationStore = useReservationStore();

  // Vérifier si les données de réservation existent
  const hasReservationData = !!reservationStore.departure && !!reservationStore.destination;

  useEffect(() => {
    // Timeout de sécurité pour ne pas laisser le chargement tourner indéfiniment
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        if (!hasReservationData) {
          setError("Aucune réservation trouvée. Veuillez réessayer.");
        }
      }
    }, 5000); // 5 secondes maximum

    // Si l'authentification est terminée, continuer le processus
    if (!authLoading) {
      const verifyReservation = async () => {
        try {
          // Vérifier si l'utilisateur est authentifié et si les données de réservation sont disponibles
          if (!isAuthenticated) {
            // Si l'utilisateur n'est pas authentifié, rediriger vers la page de confirmation
            router.push('/reservation/confirmation');
            return;
          }
          
          if (!hasReservationData) {
            setIsLoading(false);
            setError("Aucune réservation trouvée. Veuillez réessayer.");
            return;
          }

          // Si tout est OK, afficher la page de succès
          setIsLoading(false);
        } catch (err) {
          console.error("Erreur lors de la vérification de la réservation:", err);
          setIsLoading(false);
          setError("Une erreur est survenue lors de la vérification de votre réservation.");
        }
      };
      
      verifyReservation();
    }

    return () => clearTimeout(timeoutId);
  }, [hasReservationData, isAuthenticated, authLoading, router]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Recharger la page pour reprendre le processus avec l'utilisateur connecté
    window.location.reload();
  };

  // Fonction pour gérer le retour après une réservation réussie
  const handleNavigateAfterSuccess = () => {
    // Réinitialiser le store de réservation pour éviter de garder des données obsolètes
    reservationStore.reset(); 
    
    // Rediriger l'utilisateur connecté vers ses réservations
    if (isAuthenticated) {
      router.push('/my-account/reservations');
    } else {
      // Sinon, retour à l'accueil
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-gray-300">Vérification de votre réservation...</p>
        <p className="mt-2 text-sm text-gray-400">Cela ne prendra qu'un instant</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-900/30 p-6 rounded-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Erreur</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button onClick={() => router.push('/reservation')}>Nouvelle réservation</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-neutral-900/70 p-8 rounded-2xl max-w-2xl w-full">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-green-600/20 p-4 rounded-full mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Réservation confirmée !
            </h1>
            <p className="text-gray-400 max-w-md">
              Votre réservation a été enregistrée avec succès. Vous recevrez un email de confirmation dans quelques instants.
            </p>
          </div>

          {/* Détails de la réservation */}
          <div className="bg-neutral-800/60 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">Détails de votre trajet</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Départ</div>
                  <div className="font-medium text-white">{reservationStore.departure?.display_name}</div>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Destination</div>
                  <div className="font-medium text-white">{reservationStore.destination?.display_name}</div>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Date & heure</div>
                  <div className="font-medium text-white">
                    {reservationStore.pickupDateTime.toLocaleString('fr-FR', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 flex-shrink-0">
                  <Car className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Véhicule</div>
                  <div className="font-medium text-white capitalize">
                    {reservationStore.selectedVehicle?.toLowerCase() || "Standard"}
                  </div>
                </div>
              </div>
              
              {reservationStore.selectedOptions && reservationStore.selectedOptions.length > 0 && (
                <div className="flex gap-4 items-start">
                  <div className="w-10 flex-shrink-0">
                    <PackageCheck className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Options</div>
                    <div className="font-medium text-white">
                      {reservationStore.selectedOptions.join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleNavigateAfterSuccess} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAuthenticated 
                ? "Voir mes réservations" 
                : "Retour à l'accueil"}
            </Button>
            
            {/* Bouton secondaire pour une nouvelle réservation */}
            <Button 
              onClick={() => {
                reservationStore.reset();
                router.push('/reservation');
              }}
              variant="outline"
              className="flex-1 md:flex-none text-neutral-300 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:text-neutral-300"
              >
              Nouvelle réservation
            </Button>
          </div>
        </div>
      </div>
      
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess}
        defaultTab="login"
      />
    </>
  );
}
