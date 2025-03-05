"use client";

import { useState, useEffect } from 'react';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { pricingService } from '@/lib/services/pricingService';

interface PriceBreakdown {
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
}

export function usePrice() {
  const { distance, selectedVehicle, selectedOptions } = useReservationStore();
  const [price, setPrice] = useState<PriceBreakdown>({
    basePrice: 0,
    optionsPrice: 0,
    totalPrice: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculatePrice = async () => {
      if (!distance || !selectedVehicle) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Vérification que pricingService existe
        if (!pricingService) {
          throw new Error("Le service de tarification n'est pas disponible");
        }

        // Initialisation du service si la méthode initialize existe
        if (typeof pricingService.initialize === 'function') {
          await pricingService.initialize();
        }

        const priceData = await pricingService.calculatePrice(
          distance,
          selectedVehicle,
          selectedOptions
        );

        setPrice(priceData);
      } catch (err) {
        console.error("Erreur lors du calcul du prix:", err);
        setError("Impossible de calculer le prix. Veuillez réessayer plus tard.");
        
        // Valeurs par défaut en cas d'erreur
        setPrice({
          basePrice: 0,
          optionsPrice: 0,
          totalPrice: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculatePrice();
  }, [distance, selectedVehicle, selectedOptions]);

  return {
    price,
    isLoading,
    error,
    formatPrice: (amount: number) => `${amount.toFixed(2)} €`,
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
        await PricingService.initialize();
        setRates(PricingService.getAllRates());
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