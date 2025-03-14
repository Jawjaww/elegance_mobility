"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { supabase } from '@/utils/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ReservationPage from '../page';
import { Card } from '@/components/ui/card';
import EditReservationMap from '@/components/map/EditReservationMap';

// Type pour les données de réservation
interface ReservationData {
  id: string;
  pickup_address: string;
  pickup_lat?: number;
  pickup_lon?: number; // Standardisé sur lon
  dropoff_address: string;
  dropoff_lat?: number;
  dropoff_lon?: number; // Standardisé sur lon
  pickup_time: string;
  vehicle_type: string;
  options: string[];
  distance: number;
  duration: number;
}

export default function EditReservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationStore = useReservationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);

  // Effet pour éviter les chargements multiples
  const loadedRef = useRef(false);

  useEffect(() => {
    // Nettoyer le store et réinitialiser l'état au montage
    return () => {
      if (!loadedRef.current) {
        reservationStore.reset();
        loadedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (loadedRef.current || dataLoaded) return;
    
    async function fetchReservationData() {
      try {
        const reservationId = searchParams?.get('id') || localStorage.getItem('editReservationId');
        
        if (!reservationId) {
          setError("ID de réservation non trouvé");
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('id', reservationId)
          .single();

        if (error || !data) {
          throw error || new Error('Réservation non trouvée');
        }

        localStorage.setItem('currentEditingReservationId', reservationId);
        console.log("ID de réservation stocké:", reservationId);
        
        // Réinitialiser le store avant de le remplir
        reservationStore.reset();
        
        const reservation = data as ReservationData;
        
        // Journal pour diagnostiquer les problèmes
        console.log("Données de réservation:", {
          pickup_lat: reservation.pickup_lat,
          pickup_lon: reservation.pickup_lon,
          dropoff_lat: reservation.dropoff_lat,
          dropoff_lon: reservation.dropoff_lon
        });
        
        // Définir les données de manière synchrone pour éviter les problèmes de timing
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
        reservationStore.setDistance(reservation.distance);
        reservationStore.setDuration(reservation.duration);
        reservationStore.setSelectedVehicle(reservation.vehicle_type);
        
        // Gérer les options
        if (reservation.options && Array.isArray(reservation.options)) {
          // Réinitialiser options existantes
          const currentOptions = [...reservationStore.selectedOptions];
          currentOptions.forEach(option => reservationStore.toggleOption(option));
          
          // Ajouter nouvelles options
          reservation.options.forEach(option => {
            if (!reservationStore.selectedOptions.includes(option)) {
              reservationStore.toggleOption(option);
            }
          });
        }
        
        // Marquer comme chargé pour éviter des chargements multiples
        loadedRef.current = true;
        setDataLoaded(true);
        setIsLoading(false);
        
        // Délai court pour s'assurer que le store est mis à jour
        setTimeout(() => {
          setShowReservationForm(true);
          console.log("Données de réservation chargées avec succès");
        }, 100);
      } catch (err) {
        console.error("Erreur lors de la récupération de la réservation:", err);
        setError("Impossible de charger les détails de la réservation");
        setIsLoading(false);
      }
    }

    fetchReservationData();
  }, [reservationStore, searchParams]);

  // Afficher l'écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-400">Chargement de votre réservation...</p>
      </div>
    );
  }

  // Afficher l'erreur
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

  // Utiliser l'approche conditionnelle avec délai pour régler le problème de timing
  if (!showReservationForm) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Préparation de votre réservation</h2>
          <p className="text-neutral-400 mb-6">Chargement des données...</p>
          <EditReservationMap />
        </Card>
      </div>
    );
  }

  // Afficher le formulaire d'édition
  return <ReservationPage isEditing={true} />;
}
