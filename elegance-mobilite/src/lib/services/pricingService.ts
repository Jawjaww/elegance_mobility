import { supabase } from '../supabaseClient';

export interface Rate {
  vehicleType: string;
  pricePerKm: number;
  basePrice: number;
}

export interface OptionRate {
  optionType: string;
  price: number;
}

class PricingServiceClass {
  private rates: Map<string, Rate> = new Map();
  private optionRates: Map<string, OptionRate> = new Map();
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const { data: rateData, error: rateError } = await supabase
        .from('rates')
        .select('*');

      if (rateError) throw rateError;

      const { data: optionData, error: optionError } = await supabase
        .from('option_rates')
        .select('*');

      if (optionError) throw optionError;

      // Convert database data to Rate format
      this.rates.clear();
      rateData.forEach((rate) => {
        this.rates.set(rate.vehicle_type, {
          vehicleType: rate.vehicle_type,
          pricePerKm: rate.price_per_km,
          basePrice: rate.base_price
        });
      });

      // Convert database data to OptionRate format
      this.optionRates.clear();
      optionData.forEach((option) => {
        this.optionRates.set(option.option_type, {
          optionType: option.option_type,
          price: option.price
        });
      });

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing PricingService:', error);
      throw error;
    }
  }

  getAllRates(): Rate[] {
    if (!this.initialized) {
      throw new Error('PricingService not initialized');
    }
    return Array.from(this.rates.values());
  }

  getAllOptionRates(): OptionRate[] {
    if (!this.initialized) {
      throw new Error('PricingService not initialized');
    }
    return Array.from(this.optionRates.values());
  }

  getRate(vehicleType: string): Rate | undefined {
    if (!this.initialized) {
      throw new Error('PricingService not initialized');
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
      throw new Error('PricingService not initialized');
    }

    const rate = this.rates.get(params.vehicleType);
    if (!rate) {
      throw new Error(`Rate not found for vehicle type: ${params.vehicleType}`);
    }

    const basePrice = rate.basePrice;
    const distancePrice = params.distanceKm * rate.pricePerKm;

    // Calculate the price of options
    const optionsPrice = (params.selectedOptions || []).reduce((total, option) => {
      const optionRate = this.optionRates.get(option);
      return total + (optionRate ? optionRate.price : 0);
    }, 0);

    return {
      base: basePrice,
      distance: distancePrice,
      options: optionsPrice,
      total: basePrice + distancePrice + optionsPrice
    };
  }

  // This method is used internally by the service to update rates
  // after a change in the database
  async refreshRates() {
    this.initialized = false;
    await this.initialize();
  }

  // Utility methods for validation
  validateRate(rate: Rate): boolean {
    return (
      typeof rate.vehicleType === 'string' &&
      typeof rate.pricePerKm === 'number' &&
      typeof rate.basePrice === 'number' &&
      rate.pricePerKm >= 0 &&
      rate.basePrice >= 0
    );
  }

  // Format a price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }
}

// Export a singleton instance
export const PricingService = new PricingServiceClass();

// Listen for real-time changes on both rates and option_rates tables
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
      // Refresh rates when there are changes
      await PricingService.refreshRates();
    }
  )
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'option_rates'
    },
    async () => {
      // Refresh rates when there are changes to options
      await PricingService.refreshRates();
    }
  )
  .subscribe();