"use client";

import { type VehicleType } from "@/lib/vehicle";
import { supabase } from "@/lib/database/client";

export interface Rate {
  vehicleType: string;
  basePrice: number;
  pricePerKm: number;
  minPrice: number;
}

interface PriceEstimate {
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
}

/**
 * Service pour l'estimation des prix avant enregistrement
 * Note: Le calcul final est géré par l'Edge Function Supabase
 */
// Tarifs par défaut si la base n'a pas de données
const DEFAULT_RATES: Record<
  string,
  { base_price: number; price_per_km: number; min_price: number }
> = {
  STANDARD: { base_price: 15, price_per_km: 2.5, min_price: 20 },
  EXECUTIVE: { base_price: 30, price_per_km: 4, min_price: 50 },
  LUXURY: { base_price: 60, price_per_km: 7, min_price: 100 },
  VAN: { base_price: 25, price_per_km: 3.5, min_price: 40 },
  ECO: { base_price: 10, price_per_km: 1.8, min_price: 15 },
};

class PricingService {
  async calculatePrice(
    distance: number,
    vehicleType: VehicleType,
    options: string[] = [],
    pickupTime?: Date,
  ): Promise<PriceEstimate> {
    try {
      // 1. Récupérer les tarifs de base (avec fallback)
      let rate: { base_price: number; price_per_km: number; min_price: number };

      const { data: rateData, error: rateError } = await supabase
        .from("rates")
        .select("base_price, price_per_km, min_price")
        .eq("vehicle_type", vehicleType)
        .maybeSingle();

      if (rateError || !rateData) {
        // Utiliser les tarifs par défaut
        rate = DEFAULT_RATES[vehicleType] || DEFAULT_RATES.STANDARD;
        if (!rateData) {
          console.warn(
            `[Pricing] Aucun tarif trouvé pour ${vehicleType}, utilisation des tarifs par défaut`,
          );
        }
      } else {
        rate = rateData;
      }

      // 2. Calculer le prix de base avec la distance
      const basePrice = rate.base_price;
      const distancePrice = distance * rate.price_per_km;
      let totalPrice = basePrice + distancePrice;

      // 3. Ajouter le prix des options
      let optionsTotal = 0;
      if (options.length > 0) {
        const { data: optionsData, error: optionsError } = await supabase
          .from("options")
          .select("price")
          .in("name", options);

        if (!optionsError && optionsData) {
          optionsTotal = optionsData.reduce((sum, opt) => sum + opt.price, 0);
          totalPrice += optionsTotal;
        }
      }

      // 4. Vérifier les promotions saisonnières
      if (pickupTime) {
        const { data: seasonalPromo } = await supabase
          .from("seasonal_promotions")
          .select("discount_percentage")
          .eq("active", true)
          .lte("start_date", pickupTime.toISOString())
          .gte("end_date", pickupTime.toISOString())
          .is("vehicle_types", vehicleType)
          .limit(1);

        if (seasonalPromo?.[0]) {
          const discount =
            totalPrice * (seasonalPromo[0].discount_percentage / 100);
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
        totalPrice: Number(totalPrice.toFixed(2)),
      };
    } catch (error) {
      // Utiliser un niveau moins critique pour éviter l'overlay Next.js
      console.warn("Erreur lors de l'estimation du prix:", error);
      // Fournir un message d'erreur plus descriptif en remontant
      const message =
        error instanceof Error
          ? error.message
          : JSON.stringify(error) || "Unknown error";
      throw new Error(`Pricing error: ${message}`);
    }
  }
}

export const pricingService = new PricingService();
export default pricingService;
