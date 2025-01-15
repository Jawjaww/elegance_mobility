// Geographical zones
export enum Zone {
  PARIS = 'paris',
  SUBURB = 'suburb',
  AIRPORT = 'airport'
}

// VTC rates
export interface Rate {
  id: string
  type: string
  baseRate: number
  peakRate: number
  nightRate: number
}

// Minimum fares
export const MINIMUM_FARE = 21.50
export const PREMIUM_MINIMUM_FARE = 25.50

// Rates store interface
export interface RatesStore {
  rates: Rate[]
  loading: boolean
  error: string | null
  fetchRates: () => Promise<void>
  updateRate: (id: string, newRate: Partial<Rate>) => Promise<void>
}
