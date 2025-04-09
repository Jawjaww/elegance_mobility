import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

interface PriceRate {
  id: string;
  base_rate: number;
  price_per_km: number;
  vehicle_type: string;
  min_price?: number;
  max_price?: number;
}

export function usePrice(distance?: number, vehicleType: string = 'standard') {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      if (!distance) {
        setPrice(null);
        setLoading(false);
        return;
      }

      try {
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('price_rates')
          .select('*')
          .eq('vehicle_type', vehicleType)
          .single();

        if (error) throw error;

        const rate = data as PriceRate;
        const calculatedPrice = rate.base_rate + (distance * rate.price_per_km);

        // Appliquer les limites de prix si définies
        const finalPrice = Math.max(
          rate.min_price ?? calculatedPrice,
          Math.min(rate.max_price ?? calculatedPrice, calculatedPrice)
        );

        setPrice(finalPrice);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du calcul du prix:', err);
        setError('Impossible de calculer le prix');
        setPrice(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, [distance, vehicleType]);

  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('price-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_rates',
          filter: `vehicle_type=eq.${vehicleType}`
        },
        () => {
          // Recharger le prix quand les tarifs changent
          setLoading(true);
          if (distance) {
            calculatePrice(distance, vehicleType);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [distance, vehicleType]);

  const calculatePrice = async (distance: number, vehicleType: string) => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const { data, error } = await supabase
        .from('price_rates')
        .select('*')
        .eq('vehicle_type', vehicleType)
        .single();

      if (error) throw error;

      const rate = data as PriceRate;
      const calculatedPrice = rate.base_rate + (distance * rate.price_per_km);

      // Appliquer les limites de prix si définies
      const finalPrice = Math.max(
        rate.min_price ?? calculatedPrice,
        Math.min(rate.max_price ?? calculatedPrice, calculatedPrice)
      );

      setPrice(finalPrice);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du calcul du prix:', err);
      setError('Impossible de calculer le prix');
      setPrice(null);
    } finally {
      setLoading(false);
    }
  };

  return { price, loading, error };
}

export default usePrice;