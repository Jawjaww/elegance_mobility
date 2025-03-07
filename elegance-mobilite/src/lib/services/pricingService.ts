"use client";

import { VehicleType } from "@/lib/stores/reservationStore";
import { supabase } from '@/utils/supabase/client';

// Types pour le service de tarification
export type PriceOption = "childSeat" | "pets" | "accueil" | "boissons";

export interface PriceData {
  baseFare: number;
  perKmRate: number;
  minPrice: number;
}

export interface OptionPrice {
  id: string;
  price: number;
}

class PricingService {
  private initialized: boolean = false;
  
  // Tarifs par défaut (utilisés en cas d'échec de récupération depuis Supabase)
  public vehicleRates: Record<string, PriceData> = {
    STANDARD: { baseFare: 30, perKmRate: 2, minPrice: 35 },
    VAN: { baseFare: 45, perKmRate: 2.5, minPrice: 50 },
    PREMIUM: { baseFare: 40, perKmRate: 2.3, minPrice: 45 },
  };

  private optionRates: Record<string, number> = {
    childSeat: 15,
    pets: 10,
    accueil: 20,
    boissons: 10,
  };

  constructor() {
    console.log('PricingService created');
  }

  // Récupère les tarifs depuis Supabase
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('PricingService already initialized');
      return;
    }

    try {
      console.log('PricingService initializing...');
      
      // Récupérer les tarifs depuis Supabase
      const { data: rates, error } = await supabase
        .from('rates')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      if (rates && rates.length > 0) {
        // Mettre à jour les tarifs
        rates.forEach(rate => {
          this.vehicleRates[rate.vehicle_type] = {
            baseFare: rate.base_price,
            perKmRate: rate.price_per_km,
            minPrice: rate.base_price // Si pas de minPrice défini, utiliser base_price
          };
        });
        
        console.log('Pricing data loaded from database:', this.vehicleRates);
      }
      
      // Récupérer les prix des options
      const { data: options, error: optionsError } = await supabase
        .from('options')
        .select('*');
        
      if (optionsError) {
        console.warn('Failed to load option prices:', optionsError);
      } else if (options && options.length > 0) {
        options.forEach(option => {
          this.optionRates[option.name.toLowerCase()] = option.price;
        });
        
        console.log('Option prices loaded from database:', this.optionRates);
      }

      this.initialized = true;
      console.log('PricingService initialized successfully');
    } catch (error) {
      console.error('Error in PricingService initialization, using fallback data:', error);
      // Ne pas relancer l'erreur, mais utiliser les données par défaut
      this.initialized = true;
    }
  }

  // Vérifie que le service est initialisé
  private ensureInitialized(): void {
    if (!this.initialized) {
      console.warn('PricingService not initialized, using default rates');
      this.initialized = true; // Force initialization
    }
  }

  // Calcule le prix total pour une réservation
  async calculatePrice(
    distance: number,
    vehicleType: VehicleType | string,
    options: string[]
  ): Promise<{ basePrice: number; optionsPrice: number; totalPrice: number }> {
    this.ensureInitialized();
    
    console.log(`Calcul prix pour: distance=${distance}, vehicle=${vehicleType}, options=${options.join(',')}`)
    
    // Vérifier que le type de véhicule existe dans notre tableau de tarifs
    const vehicleData = this.vehicleRates[vehicleType] || this.vehicleRates.STANDARD;
    console.log("Données du véhicule trouvées:", vehicleData);

    // Calcul du prix de base
    let basePrice = vehicleData.baseFare + (distance * vehicleData.perKmRate);
    
    // Appliquer le prix minimum si nécessaire
    basePrice = Math.max(basePrice, vehicleData.minPrice);
    basePrice = Math.round(basePrice * 100) / 100; // Arrondir à 2 décimales

    // Calculer le prix des options
    const optionsPrice = options.reduce((total, option) => {
      const optionPrice = this.optionRates[option] || 0;
      console.log(`Option ${option}: ${optionPrice}€`);
      return total + optionPrice;
    }, 0);

    // Prix total
    const totalPrice = basePrice + optionsPrice;

    console.log("Prix calculés:", { basePrice, optionsPrice, totalPrice });

    return {
      basePrice,
      optionsPrice,
      totalPrice
    };
  }

  // Récupère le tarif de base pour un type de véhicule
  getBaseFare(vehicleType: VehicleType | string): number {
    this.ensureInitialized();
    return (this.vehicleRates[vehicleType] || this.vehicleRates.STANDARD).baseFare;
  }

  // Récupère le tarif au kilomètre pour un type de véhicule
  getPerKmRate(vehicleType: VehicleType | string): number {
    this.ensureInitialized();
    return (this.vehicleRates[vehicleType] || this.vehicleRates.STANDARD).perKmRate;
  }

  // Récupère le prix d'une option
  getOptionPrice(optionId: string): number {
    this.ensureInitialized();
    return this.optionRates[optionId] || 0;
  }
}

// Créer et exporter une instance singleton du service
export const pricingService = new PricingService();
export default pricingService;