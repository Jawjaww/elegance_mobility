'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/types/database.types';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase, debugRlsProblem } from '@/lib/database/client';
import { reservationService } from '@/lib/services/reservationService';
import React from 'react';
import LocationStep from '@/components/reservation/LocationStep';
import VehicleStep from '@/components/reservation/VehicleStep';

type RideUpdate = Database['public']['Tables']['rides']['Update'];

type Reservation = Database['public']['Tables']['rides']['Row'];

type RouteParams = {
  id: string;
}

export default function EditReservationPage() {
  const router = useRouter();
  const params = useParams<RouteParams>();
  
  if (!params?.id) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-red-600">Erreur</h2>
            <p>Identifiant de réservation manquant</p>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </Card>
      </div>
    );
  }


  const reservationId = params?.id as string;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReservation() {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('id', reservationId)
          .single();

        if (error) throw error;

        setReservation(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reservation:', err);
        setError('Erreur lors de la récupération de la réservation');
        setLoading(false);
      }
    }

    fetchReservation();
  }, [reservationId]);

  // Nouveau flow à étapes pour édition, réutilisant LocationStep et VehicleStep
  const [step, setStep] = useState(1);
  const [storeInitialized, setStoreInitialized] = useState(false);
  const reservationStore = require('@/lib/stores/reservationStore').useReservationStore();

  useEffect(() => {
    if (reservation && !storeInitialized) {
      reservationStore.setDeparture({
        lat: reservation.pickup_lat || 0,
        lon: reservation.pickup_lon || 0,
        display_name: reservation.pickup_address,
        address: { formatted: reservation.pickup_address }
      });
      reservationStore.setDestination({
        lat: reservation.dropoff_lat || 0,
        lon: reservation.dropoff_lon || 0,
        display_name: reservation.dropoff_address,
        address: { formatted: reservation.dropoff_address }
      });
      reservationStore.setPickupDateTime(new Date(reservation.pickup_time));
      reservationStore.setSelectedVehicle(reservation.vehicle_type);
      reservationStore.setDistance(reservation.distance || 0);
      reservationStore.setDuration(reservation.duration || 0);
      reservationStore.setSelectedOptions(reservation.options || []);
      setStoreInitialized(true);
    }
  }, [reservation, storeInitialized, reservationStore]);

  const handleNextStep = () => setStep((s) => s + 1);
  const handlePrevStep = () => setStep((s) => s - 1);

  const handleEditConfirm = async () => {
    try {
      // Diagnostic RLS avant la mise à jour
      console.log("[DEBUG] Démarrage de la mise à jour de la réservation");
      
      const rlsCheck = await debugRlsProblem();
      console.log("[DEBUG] État de l'authentification:", rlsCheck);
      
      if (!rlsCheck.success) {
        console.error("[DEBUG] Problème d'authentification:", rlsCheck.error);
        setError("Erreur d'authentification. Veuillez vous reconnecter.");
        return;
      }

      const updateData: RideUpdate = {
        pickup_address: reservationStore.departure?.display_name ?? undefined,
        pickup_lat: typeof reservationStore.departure?.lat === 'number' ? reservationStore.departure.lat : undefined,
        pickup_lon: typeof reservationStore.departure?.lon === 'number' ? reservationStore.departure.lon : undefined,
        dropoff_address: reservationStore.destination?.display_name ?? undefined,
        dropoff_lat: typeof reservationStore.destination?.lat === 'number' ? reservationStore.destination.lat : undefined,
        dropoff_lon: typeof reservationStore.destination?.lon === 'number' ? reservationStore.destination.lon : undefined,
        pickup_time: reservationStore.pickupDateTime?.toISOString() ?? undefined,
        vehicle_type: reservationStore.selectedVehicle ?? undefined,
        options: Array.isArray(reservationStore.selectedOptions) ? reservationStore.selectedOptions : undefined,
        distance: typeof reservationStore.distance === 'number' ? reservationStore.distance : undefined,
        duration: typeof reservationStore.duration === 'number' ? reservationStore.duration : undefined,
        updated_at: new Date().toISOString()
      };

      console.log("[DEBUG] Données à mettre à jour:", updateData);
      
      // Test préliminaire de lecture
      const { data: testRead, error: testError } = await supabase
        .from('rides')
        .select('id')
        .eq('id', reservationId)
        .single();
      
      console.log("[DEBUG] Test de lecture:", { testRead, testError });

      if (testError) {
        console.error("[DEBUG] Erreur lors du test de lecture:", testError);
        setError(`Erreur d'accès à la réservation: ${testError.message}`);
        return;
      }

      const { success, error } = await reservationService.updateReservation(reservationId, updateData);

      if (!success) {
        const postgrestError = error as PostgrestError;
        console.error("[DEBUG] Échec de la mise à jour:", postgrestError);
        setError(`Erreur lors de la modification de la réservation: ${postgrestError?.message || 'Erreur inconnue'}`);
        return;
      }

      // Rediriger vers la page de confirmation d'édition
      router.push(`/my-account/reservations/${reservationId}/edit/edit-confirmation`);
    } catch (err) {
      console.error("[DEBUG] Exception dans handleEditConfirm:", err);
      setError('Erreur inattendue lors de la modification de la réservation');
    }
  };

  return (
    <section className="relative grid min-h-screen bg-neutral-950 overflow-hidden">
      <div className="absolute inset-0 perspective-[1000px]">
        <div className="relative h-full w-full [transform-style:preserve-3d]">
          <div className="absolute inset-0 bg-[url('/images/car-bg.jpg')] bg-cover bg-center [transform:translateZ(-100px)] scale-110" />
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-3xl [transform:translateZ(-50px)]" />
        </div>
      </div>
      <div className="relative z-10 place-self-center w-full max-w-2xl mx-auto px-4 py-8">
        <div className="bg-neutral-900/50 backdrop-blur-lg rounded-lg border border-neutral-800 p-8">
          {loading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-red-600">Erreur</h2>
              <p>{error}</p>
              <Button onClick={() => router.back()}>Retour</Button>
            </div>
          ) : reservation ? (
            <>
              {step === 1 ? (
                <LocationStep
                  onNextStep={handleNextStep}
                  isEditing={true}
                  onLocationDetected={() => {}}
                  onOriginChange={() => {}}
                  onDestinationChange={() => {}}
                  onOriginSelect={() => {}}
                  onDestinationSelect={() => {}}
                  onRouteCalculated={() => {}}
                  onDateTimeChange={reservationStore.setPickupDateTime}
                  pickupDateTime={reservationStore.pickupDateTime}
                  originAddress={reservationStore.departure?.display_name || ""}
                  destinationAddress={reservationStore.destination?.display_name || ""}
                />
              ) : (
                <VehicleStep
                  vehicleType={reservationStore.selectedVehicle}
                  options={reservationStore.selectedOptions}
                  distance={reservationStore.distance}
                  duration={reservationStore.duration}
                  onVehicleTypeChange={reservationStore.setSelectedVehicle}
                  onOptionsChange={reservationStore.setSelectedOptions}
                  onPrevious={handlePrevStep}
                  onConfirm={handleEditConfirm}
                  isEditing={true}
                />
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <p>Réservation non trouvée</p>
              <Button onClick={() => router.back()}>Retour</Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}