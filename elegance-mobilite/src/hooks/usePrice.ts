import { useState, useEffect } from 'react';
import { PricingService } from '@/lib/services/pricingService';
import { supabase } from '@/lib/supabaseClient';

interface UsePriceParams {
  vehicleType: string;
  distanceKm: number | null;
  selectedOptions?: string[];
}

interface PriceDetails {
  base: number;
  distance: number;
  options: number;
  total: number;
  loading: boolean;
  error: string | null;
  formattedTotal: string;
}

export function usePrice({ vehicleType, distanceKm, selectedOptions = [] }: UsePriceParams): PriceDetails {
  const [priceDetails, setPriceDetails] = useState<PriceDetails>({
    base: 0,
    distance: 0,
    options: 0,
    total: 0,
    loading: true,
    error: null,
    formattedTotal: '0,00 €'
  });

  useEffect(() => {
    const calculatePrice = async () => {
      try {
        // S'assurer que le service est initialisé
        await PricingService.initialize();

        // Vérifier si distanceKm est null
        if (distanceKm === null) {
          throw new Error('La distance ne peut pas être null');
        }

        // Calculer le prix
        const price = PricingService.calculatePrice({
          vehicleType,
          distanceKm,
          selectedOptions
        });

        setPriceDetails({
          ...price,
          loading: false,
          error: null,
          formattedTotal: PricingService.formatPrice(price.total)
        });
      } catch (err) {
        setPriceDetails(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Erreur lors du calcul du prix'
        }));
      }
    };

    calculatePrice();

    // S'abonner aux changements de tarifs
    const channel = supabase
      .channel('prices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rates'
        },
        calculatePrice // Recalculer le prix quand les tarifs changent
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicleType, distanceKm, selectedOptions]);

  return priceDetails;
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