"use client";

import { VehicleType } from "@/lib/types/vehicle.types";
import { supabase } from '@/lib/database/client';

interface PriceEstimate {
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
}

/**
 * Service pour l'estimation des prix avant enregistrement
 * Note: Le calcul final est géré par l'Edge Function Supabase
 */
class PricingService {
  async calculatePrice(
    distance: number,
    vehicleType: VehicleType | string,
    options: string[] = [],
    pickupTime?: Date
  ): Promise<PriceEstimate> {
    try {
      // 1. Récupérer les tarifs de base
      const { data: rate, error: rateError } = await supabase
        .from('rates')
        .select('base_price, price_per_km, min_price')
        .eq('vehicle_type', vehicleType)
        .single();

      if (rateError) throw rateError;

      // 2. Calculer le prix de base avec la distance
      const basePrice = rate.base_price;
      const distancePrice = distance * rate.price_per_km;
      let totalPrice = basePrice + distancePrice;

      // 3. Ajouter le prix des options
      let optionsTotal = 0;
      if (options.length > 0) {
        const { data: optionsData, error: optionsError } = await supabase
          .from('options')
          .select('price')
          .in('name', options);

        if (!optionsError && optionsData) {
          optionsTotal = optionsData.reduce((sum, opt) => sum + opt.price, 0);
          totalPrice += optionsTotal;
        }
      }

      // 4. Vérifier les promotions saisonnières
      if (pickupTime) {
        const { data: seasonalPromo } = await supabase
          .from('seasonal_promotions')
          .select('discount_percentage')
          .eq('active', true)
          .lte('start_date', pickupTime.toISOString())
          .gte('end_date', pickupTime.toISOString())
          .is('vehicle_types', vehicleType)
          .limit(1);

        if (seasonalPromo?.[0]) {
          const discount = totalPrice * (seasonalPromo[0].discount_percentage / 100);
          totalPrice -= discount;
        }
      }

      // 5. Appliquer le prix minimum
      if (totalPrice < rate.min_price) {
        totalPrice = rate.min_price;
      }

      return {
        basePrice: basePrice + distancePrice,
        optionsPrice: optionsTotal,
        totalPrice: Number(totalPrice.toFixed(2))
      };
    } catch (error) {
      console.error("Erreur lors de l'estimation du prix:", error);
      throw new Error(`Pricing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const pricingService = new PricingService();
export default pricingService;