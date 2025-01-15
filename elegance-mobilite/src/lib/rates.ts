// VTC rates in Île-de-France
export const MINIMUM_FARE = 21.50; // Regulatory minimum fare
export const PREMIUM_MINIMUM_FARE = 25.50; // Premium minimum fare

import { Zone } from './types'
import { useRatesStore } from './ratesStore'

// Zone surcharges
export const ZONE_SURCHARGES = {
  [Zone.SUBURB]: 1.15, // +15%
  [Zone.AIRPORT]: 1.20 // +20%
};

// Determines if it's night time (10 PM - 6 AM)
export function isNightTime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
}

// Determines if it's peak hour (7 AM - 8 PM on weekdays)
export function isPeakHour(date: Date): boolean {
  const hour = date.getHours();
  const day = date.getDay();
  return hour >= 7 && hour < 20 && day >= 1 && day <= 5;
}

// Determines if it's Sunday or a public holiday
export function isSundayOrHoliday(date: Date): boolean {
  const day = date.getDay();
  return day === 0; // TODO: Add public holiday management
}

// Determines geographical zone
export function determineZone(departure: string, arrival: string): Zone {
  const airportZones = ['CDG', 'ORY', 'Paris-Charles de Gaulle', 'Paris-Orly'];
  const isAirport = airportZones.some(z => 
    departure.includes(z) || arrival.includes(z)
  );
  
  if (isAirport) return Zone.AIRPORT;
  
  const suburbPostcodes = ['75', '92', '93', '94'];
  const isSuburb = suburbPostcodes.some(cp =>
    departure.startsWith(cp) || arrival.startsWith(cp)
  );
  
  return isSuburb ? Zone.SUBURB : Zone.PARIS;
}

// Hook for calculating ride price
export function useCalculatePrice() {
  const { rates } = useRatesStore()

  const calculatePrice = (
    distanceKm: number,
    durationMinutes: number,
    vehicleType: 'STANDARD' | 'PREMIUM' | 'VIP',
    date: Date,
    departure: string,
    arrival: string
  ): number => {
    const rate = rates.find(t => t.type === vehicleType)
    
    if (!rate) {
      throw new Error(`Rates not found for vehicle type ${vehicleType}`)
    }
    
    // Determine pricing period
    let period = 'base';
    if (isNightTime(date) || isSundayOrHoliday(date)) {
      period = 'night';
    } else if (isPeakHour(date)) {
      period = 'peak';
    }
    
    // Calculate base price with typed access
    let price: number;
    switch (period) {
      case 'base':
        price =
          rate.baseRate +
          (distanceKm * rate.baseRate * 0.8) +
          (durationMinutes * rate.baseRate * 0.05);
        break;
      case 'peak':
        price =
          rate.peakRate +
          (distanceKm * rate.peakRate * 0.8) +
          (durationMinutes * rate.peakRate * 0.05);
        break;
      case 'night':
        price =
          rate.nightRate +
          (distanceKm * rate.nightRate * 0.8) +
          (durationMinutes * rate.nightRate * 0.05);
        break;
      default:
        price = MINIMUM_FARE;
    }
      
    // Apply geographical surcharges
    const zone = determineZone(departure, arrival);
    if (zone !== Zone.PARIS) {
      price *= ZONE_SURCHARGES[zone];
    }
    
    // Apply minimum fare based on vehicle type
    const minimum =
      vehicleType === 'VIP' ? PREMIUM_MINIMUM_FARE * 1.2 :
      vehicleType === 'PREMIUM' ? PREMIUM_MINIMUM_FARE :
      MINIMUM_FARE;
    return Math.max(price, minimum);
  }

  return { calculatePrice }
}
