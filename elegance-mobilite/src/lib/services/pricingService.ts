"use client";

import { VehicleOptions, VehicleType } from "@/lib/types/vehicle.types";
import { supabase } from '@/utils/supabase/client';

// Types pour le service de tarification
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
    petFriendly: 10,
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
      
      // Utiliser une requête anonyme pour les tarifs (disponibles publiquement)
      // Ajouter .throwOnError() pour éviter de continuer si l'erreur est silencieuse
      const { data: rates, error } = await supabase
        .from('rates')
        .select('vehicle_type, price_per_km, base_price')
        .order('id', { ascending: true });
        
      if (error) {
        // Afficher les détails de l'erreur mais continuer avec les valeurs par défaut
        console.error('Error fetching rates:', error.message || error);
        console.log('Using default rates due to fetch error');
      } else if (rates && rates.length > 0) {
        // Mettre à jour les tarifs
        rates.forEach(rate => {
          // Conversion du enum de la base de données en string uppercase pour le matching avec VehicleType
          const vehicleTypeKey = rate.vehicle_type.toUpperCase();
          
          this.vehicleRates[vehicleTypeKey] = {
            baseFare: rate.base_price,
            perKmRate: rate.price_per_km,
            minPrice: rate.base_price // Si pas de minPrice défini, utiliser base_price
          };
        });
        
        console.log('Pricing data loaded from database:', this.vehicleRates);
      } else {
        console.log('No rates found in database, using default rates');
      }
      
      // Récupérer les prix des options de manière anonyme aussi
      const { data: options, error: optionsError } = await supabase
        .from('options')
        .select('name, price')
        .order('id', { ascending: true });
        
      if (optionsError) {
        console.warn('Failed to load option prices:', optionsError.message || optionsError);
        console.log('Using default option prices');
      } else if (options && options.length > 0) {
        options.forEach(option => {
          try {
            // Normaliser le nom de l'option pour correspondre à notre modèle
            const normalizedName = option.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            this.optionRates[normalizedName] = option.price;
            
            // Ajouter des alias pour la rétrocompatibilité
            if (normalizedName === 'petfriendly' || normalizedName === 'animauxdomestiques') {
              this.optionRates['petFriendly'] = option.price;
              this.optionRates['pets'] = option.price;
            } else if (normalizedName === 'childseat' || normalizedName === 'siegeenfant') {
              this.optionRates['childSeat'] = option.price;
            }
          } catch (e) {
            console.warn('Error processing option:', option.name, e);
          }
        });
        
        console.log('Option prices loaded from database:', this.optionRates);
      } else {
        console.log('No options found in database, using default options');
      }

      this.initialized = true;
      console.log('PricingService initialized successfully');
    } catch (error) {
      // Gérer l'erreur de manière plus robuste
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in PricingService initialization, using fallback data:', errorMessage);
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
    try {
      // Assurer que le service est initialisé
      if (!this.initialized) {
        await this.initialize();
      }
      
      console.log(`Calcul prix pour: distance=${distance}, vehicle=${vehicleType}, options=${options.join(',')}`);
      
      // Vérifier que le type de véhicule existe dans notre tableau de tarifs
      const vehicleData = this.vehicleRates[vehicleType] || this.vehicleRates.STANDARD;
      console.log("Données du véhicule trouvées:", vehicleData);

      // Calcul du prix de base avec vérification des valeurs
      const parsedDistance = Number(distance) || 0;
      let basePrice = vehicleData.baseFare + (parsedDistance * vehicleData.perKmRate);
      
      // Appliquer le prix minimum si nécessaire
      basePrice = Math.max(basePrice, vehicleData.minPrice);
      basePrice = Math.round(basePrice * 100) / 100; // Arrondir à 2 décimales

      // Calculer le prix des options avec vérification de validité
      const optionsPrice = Array.isArray(options) ? options.reduce((total, option) => {
        const optionPrice = this.optionRates[option] || 0;
        console.log(`Option ${option}: ${optionPrice}€`);
        return total + optionPrice;
      }, 0) : 0;

      // Prix total
      const totalPrice = basePrice + optionsPrice;

      console.log("Prix calculés:", { basePrice, optionsPrice, totalPrice });

      return {
        basePrice,
        optionsPrice,
        totalPrice
      };
    } catch (error) {
      console.error("Erreur lors du calcul du prix:", error);
      // Valeurs par défaut en cas d'erreur
      return {
        basePrice: 50,
        optionsPrice: 0,
        totalPrice: 50
      };
    }
  }

  // Récupère le tarif de base pour un type de véhicule
  getBaseFare(vehicleType: VehicleType | string): number {
    if (!this.initialized) {
      console.warn('PricingService not initialized, using default rates');
    }
    return (this.vehicleRates[vehicleType] || this.vehicleRates.STANDARD).baseFare;
  }

  // Récupère le tarif au kilomètre pour un type de véhicule
  getPerKmRate(vehicleType: VehicleType | string): number {
    if (!this.initialized) {
      console.warn('PricingService not initialized, using default rates');
    }
    return (this.vehicleRates[vehicleType] || this.vehicleRates.STANDARD).perKmRate;
  }

  // Récupère le prix d'une option
  getOptionPrice(optionId: string): number {
    if (!this.initialized) {
      console.warn('PricingService not initialized, using default option prices');
    }
    return this.optionRates[optionId] || 0;
  }
}

// Créer et exporter une instance singleton du service
export const pricingService = new PricingService();
export default pricingService;