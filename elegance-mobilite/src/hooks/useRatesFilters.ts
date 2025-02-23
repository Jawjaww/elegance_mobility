import { useState, useCallback } from 'react'
import { VehicleType } from '@/lib/vehicle'
import { Database } from '@/lib/database.types'

type Rate = Database['public']['Tables']['rates']['Row']

interface RatesFilters {
  vehicleType: VehicleType | 'ALL'
}

interface UseRatesFiltersReturn {
  filters: RatesFilters
  filteredRates: Rate[]
  setVehicleTypeFilter: (type: VehicleType | 'ALL') => void
  resetFilters: () => void
}

const defaultFilters: RatesFilters = {
  vehicleType: 'ALL',
}

export function useRatesFilters(rates: Rate[]): UseRatesFiltersReturn {
  const [filters, setFilters] = useState<RatesFilters>(defaultFilters)

  const setVehicleTypeFilter = useCallback((vehicleType: VehicleType | 'ALL') => {
    setFilters((prev) => ({
      ...prev,
      vehicleType,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const filteredRates = rates.filter((rate) => {
    if (filters.vehicleType === 'ALL') return true
    return rate.vehicle_type === filters.vehicleType
  })

  return {
    filters,
    filteredRates,
    setVehicleTypeFilter,
    resetFilters,
  }
}