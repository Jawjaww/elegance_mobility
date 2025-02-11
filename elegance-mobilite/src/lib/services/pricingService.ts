import { supabase } from '../supabaseClient';

export interface Rate {
  vehicleType: string;
  pricePerKm: number;
  basePrice: number;
}

class PricingServiceClass {
  private rates: Map<string, Rate> = new Map();
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const { data, error } = await supabase
        .from('rates')
        .select('*');

      if (error) throw error;

      // Convertir les données de la base en format Rate
      this.rates.clear();
      data.forEach((rate) => {
        this.rates.set(rate.vehicle_type, {
          vehicleType: rate.vehicle_type,
          pricePerKm: rate.price_per_km,
          basePrice: rate.base_price
        });
      });

      this.initialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du PricingService:', error);
      throw error;
    }
  }

  getAllRates(): Rate[] {
    if (!this.initialized) {
      throw new Error('PricingService non initialisé');
    }
    return Array.from(this.rates.values());
  }

  getRate(vehicleType: string): Rate | undefined {
    if (!this.initialized) {
      throw new Error('PricingService non initialisé');
    }
    return this.rates.get(vehicleType);
  }

  calculatePrice(params: {
    vehicleType: string;
    distanceKm: number;
    selectedOptions?: string[];
  }): {
    base: number;
    distance: number;
    options: number;
    total: number;
  } {
    if (!this.initialized) {
      throw new Error('PricingService non initialisé');
    }

    const rate = this.rates.get(params.vehicleType);
    if (!rate) {
      throw new Error(`Tarif non trouvé pour le type de véhicule: ${params.vehicleType}`);
    }

    const basePrice = rate.basePrice;
    const distancePrice = params.distanceKm * rate.pricePerKm;
    
    // Le calcul des options pourrait être ajouté ici
    const optionsPrice = 0;

    return {
      base: basePrice,
      distance: distancePrice,
      options: optionsPrice,
      total: basePrice + distancePrice + optionsPrice
    };
  }

  // Cette méthode est utilisée en interne par le service pour mettre à jour les tarifs
  // après une modification dans la base de données
  async refreshRates() {
    this.initialized = false;
    await this.initialize();
  }

  // Méthodes utilitaires pour la validation
  validateRate(rate: Rate): boolean {
    return (
      typeof rate.vehicleType === 'string' &&
      typeof rate.pricePerKm === 'number' &&
      typeof rate.basePrice === 'number' &&
      rate.pricePerKm >= 0 &&
      rate.basePrice >= 0
    );
  }

  // Formater un prix pour l'affichage
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }
}

// Export d'une instance singleton
export const PricingService = new PricingServiceClass();

// Écouter les changements en temps réel sur la table des tarifs
supabase
  .channel('pricing-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'rates'
    },
    async () => {
      // Rafraîchir les tarifs quand il y a des changements
      await PricingService.refreshRates();
    }
  )
  .subscribe();