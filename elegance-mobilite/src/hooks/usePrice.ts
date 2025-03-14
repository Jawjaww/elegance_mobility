"use client";

import { useState, useEffect, useCallback } from 'react';
import { pricingService } from '@/lib/services/pricingService';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { VehicleType } from '@/lib/types/vehicle.types';
import { supabase } from '@/utils/supabase/client';

// Définition du type pour les tarifs depuis la base de données
interface RateData {
  id: number;
  vehicle_type: string;
  price_per_km: number;
  base_price: number;
  created_at: string;
  updated_at: string;
}

export function usePrice() {
  const store = useReservationStore();
  const [basePrice, setBasePrice] = useState(0);
  const [optionsPrice, setOptionsPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fonction pour calculer le prix, exposée pour les appels manuels
  const calculatePrice = useCallback(async (
    distance: number, 
    vehicleType: VehicleType, 
    options: string[]
  ) => {
    setIsLoading(true);
    try {
      if (!isInitialized) {
        await pricingService.initialize();
        setIsInitialized(true);
      }

      const priceDetails = await pricingService.calculatePrice(
        distance,
        vehicleType,
        options
      );
      
      setBasePrice(priceDetails.basePrice);
      setOptionsPrice(priceDetails.optionsPrice);
      setTotalPrice(priceDetails.totalPrice);

      return priceDetails.totalPrice;
    } catch (error) {
      console.error("Erreur lors du calcul du prix:", error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Calcul initial automatique basé sur le store
  useEffect(() => {
    const initPrice = async () => {
      if (
        store.distance && 
        store.selectedVehicle && 
        Array.isArray(store.selectedOptions)
      ) {
        await calculatePrice(
          store.distance,
          store.selectedVehicle as VehicleType,
          store.selectedOptions
        );
      } else {
        setIsLoading(false); // Arrêter le chargement si les données ne sont pas disponibles
      }
    };

    initPrice();
  }, [store.distance, store.selectedVehicle, store.selectedOptions, calculatePrice]);

  return {
    basePrice,
    optionsPrice,
    totalPrice,
    isLoading,
    calculatePrice // Exposer la fonction pour les recalculs manuels
  };
}

// Hook pour récupérer tous les tarifs
export function useAllRates() {
  const [rates, setRates] = useState<Array<{
    vehicleType: string;
    pricePerKm: number;
    basePrice: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRates = async () => {
      try {
        await pricingService.initialize();
        
        // Récupérer les tarifs depuis la base de données au lieu d'utiliser getAllRates
        const { data, error } = await supabase
          .from('rates')
          .select('*');
        
        if (error) throw error;
        
        // Transformer les données au format attendu
        const formattedRates = data.map((rate: RateData) => ({
          vehicleType: rate.vehicle_type,
          pricePerKm: rate.price_per_km,
          basePrice: rate.base_price
        }));
        
        setRates(formattedRates);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tarifs');
        setLoading(false);
      }
    };

    loadRates();

    // S'abonner aux changements de tarifs
    const channel = supabase
      .channel('rates-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rates'
        },
        loadRates // Recharger les tarifs quand ils changent
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { rates, loading, error };
}