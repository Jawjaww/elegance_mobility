// Geographical zones
export enum Zone {
  PARIS = 'paris',
  SUBURB = 'suburb',
  AIRPORT = 'airport'
}

// VTC rates
export interface Tarif {
  id: string
  type: string
  offPeakRate: number
  peakRate: number
  nightRate: number
}

// Minimum fares
export const MINIMUM_FARE = 21.50
export const PREMIUM_MINIMUM_FARE = 25.50

// Tarifs store interface
export interface TarifsStore {
  tarifs: Tarif[]
  loading: boolean
  error: string | null
  fetchTarifs: () => Promise<void>
  updateTarif: (id: string, newTarif: Partial<Tarif>) => Promise<void>
}
