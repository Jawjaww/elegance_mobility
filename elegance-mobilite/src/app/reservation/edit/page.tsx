"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { supabase } from '@/utils/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ReservationPage from '../page';

// Type pour les données de réservation
interface ReservationData {
  id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lon: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lon: number;
  pickup_time: string;
  vehicle_type: string;
  options: string[];
  distance: number;
  duration: number;
}

export default function EditReservationPage() {
  const router = useRouter();
  const reservationStore = useReservationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReservationData() {
      try {
        // Récupérer l'ID de la réservation à modifier depuis le localStorage
        const reservationId = localStorage.getItem('editReservationId');
        
        if (!reservationId) {
          setError("ID de réservation non trouvé");
          setIsLoading(false);
          return;
        }

        // Récupérer les détails de la réservation depuis Supabase
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('id', reservationId)
          .single();

        if (error || !data) {
          throw error || new Error('Réservation non trouvée');
        }

        // Initialiser le store avec les données de la réservation
        const reservation = data as ReservationData;
        
        // Mise à jour du store
        reservationStore.setDeparture({
          lat: reservation.pickup_lat,
          lon: reservation.pickup_lon,
          display_name: reservation.pickup_address,
          address: {}
        });
        
        reservationStore.setDestination({
          lat: reservation.dropoff_lat,
          lon: reservation.dropoff_lon,
          display_name: reservation.dropoff_address,
          address: {}
        });
        
        reservationStore.setPickupDateTime(new Date(reservation.pickup_time));
        reservationStore.setDistance(reservation.distance);
        reservationStore.setDuration(reservation.duration);
        reservationStore.setSelectedVehicle(reservation.vehicle_type);
        
        // Réinitialiser les options
        const currentOptions = [...reservationStore.selectedOptions];
        currentOptions.forEach(option => {
          reservationStore.toggleOption(option);
        });
        
        // Ajouter les nouvelles options
        if (reservation.options && Array.isArray(reservation.options)) {
          reservation.options.forEach(option => {
            reservationStore.toggleOption(option);
          });
        }
        
        // Stocker l'ID pour la mise à jour
        localStorage.setItem('currentEditingReservationId', reservationId);

        setIsLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération de la réservation:", err);
        setError("Impossible de charger les détails de la réservation");
        setIsLoading(false);
      }
    }

    fetchReservationData();
    
    return () => {
      // Nettoyage
      localStorage.removeItem('currentEditingReservationId');
    };
  }, [reservationStore]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-400">Chargement de votre réservation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-900/30 p-6 rounded-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Erreur</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/my-account/reservations')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retour à mes réservations
          </button>
        </div>
      </div>
    );
  }

  // Afficher l'interface de réservation standard, mais avec un état isEditing
  return <ReservationPage isEditing={true} />;
}
