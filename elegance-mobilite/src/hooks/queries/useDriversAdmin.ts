/**
 * TanStack Query hooks for drivers administration
 * Used in backoffice/admin portals for managing all drivers
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  driversAdminKeys,
  fetchDriversAdmin,
  fetchDriverDetails,
  fetchDriverDailyStats,
  updateDriverStatus,
  assignVehicleToDriver,
  type DriverWithDetails
} from '@/lib/api/drivers-admin'
import type { Database } from '@/lib/types/database.types'

type Driver = Database['public']['Tables']['drivers']['Row']

/**
 * Hook to fetch all drivers (admin)
 */
export function useDriversAdmin() {
  return useQuery({
    queryKey: driversAdminKeys.lists(),
    queryFn: fetchDriversAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to fetch single driver details (admin)
 */
export function useDriverDetailsAdmin(driverId: string) {
  return useQuery({
    queryKey: driversAdminKeys.detail(driverId),
    queryFn: () => fetchDriverDetails(driverId),
    enabled: !!driverId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to fetch driver daily stats (admin)
 */
export function useDriverDailyStatsAdmin(driverId: string) {
  return useQuery({
    queryKey: driversAdminKeys.dailyStats(driverId),
    queryFn: () => fetchDriverDailyStats(driverId),
    enabled: !!driverId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // refresh every minute
  })
}

/**
 * Mutation to update driver status (admin)
 */
export function useUpdateDriverStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ driverId, status }: { driverId: string; status: Driver['status'] }) =>
      updateDriverStatus(driverId, status),
    onMutate: async ({ driverId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: driversAdminKeys.all })

      // Snapshot previous value
      const previousDrivers = queryClient.getQueryData<DriverWithDetails[]>(driversAdminKeys.lists())
      const previousDriver = queryClient.getQueryData<DriverWithDetails>(driversAdminKeys.detail(driverId))

      // Optimistically update drivers list
      if (previousDrivers) {
        queryClient.setQueryData<DriverWithDetails[]>(driversAdminKeys.lists(), (old) =>
          old?.map((driver) =>
            driver.id === driverId
              ? { ...driver, status, updated_at: new Date().toISOString() }
              : driver
          ) || []
        )
      }

      // Optimistically update driver detail
      if (previousDriver) {
        queryClient.setQueryData<DriverWithDetails>(driversAdminKeys.detail(driverId), {
          ...previousDriver,
          status,
          updated_at: new Date().toISOString()
        })
      }

      return { previousDrivers, previousDriver }
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousDrivers) {
        queryClient.setQueryData(driversAdminKeys.lists(), context.previousDrivers)
      }
      if (context?.previousDriver) {
        queryClient.setQueryData(driversAdminKeys.detail(variables.driverId), context.previousDriver)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: driversAdminKeys.all })
    },
  })
}

/**
 * Mutation to assign vehicle to driver (admin)
 */
export function useAssignVehicleToDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ driverId, vehicleId }: { driverId: string; vehicleId: string }) =>
      assignVehicleToDriver(driverId, vehicleId),
    onMutate: async ({ driverId, vehicleId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: driversAdminKeys.all })

      // Snapshot previous values
      const previousDrivers = queryClient.getQueryData<DriverWithDetails[]>(driversAdminKeys.lists())
      const previousDriver = queryClient.getQueryData<DriverWithDetails>(driversAdminKeys.detail(driverId))

      // Note: We don't have vehicle details in this optimistic update
      // The actual vehicle will be fetched in onSuccess

      return { previousDrivers, previousDriver }
    },
    onSuccess: (updatedDriver, { driverId }) => {
      // Refetch driver details to get updated vehicle info
      queryClient.invalidateQueries({ queryKey: driversAdminKeys.detail(driverId) })
      queryClient.invalidateQueries({ queryKey: driversAdminKeys.lists() })
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousDrivers) {
        queryClient.setQueryData(driversAdminKeys.lists(), context.previousDrivers)
      }
      if (context?.previousDriver) {
        queryClient.setQueryData(driversAdminKeys.detail(variables.driverId), context.previousDriver)
      }
    },
  })
}
