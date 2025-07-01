import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ridesApi, rideKeys } from '@/lib/api/rides'
import { driversApi } from '@/lib/api/drivers'
import { useToast } from '@/hooks/useToast'
import type { Database } from '@/lib/types/database.types'

type RideRow = Database['public']['Tables']['rides']['Row']

// Hook pour les courses disponibles (global - pas spécifique à un driver)
export function useAvailableRides() {
  return useQuery({
    queryKey: rideKeys.available(),
    queryFn: () => ridesApi.getAvailableRides(),
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // Les données sont considérées fraîches pendant 30s
  })
}

// Hook pour les courses programmées du driver connecté (utilise auth.uid())
export function useScheduledRides() {
  return useQuery({
    queryKey: rideKeys.scheduledCurrent(),
    queryFn: async () => {
      // Récupérer le profil driver depuis l'utilisateur connecté
      const driverProfile = await driversApi.getCurrentDriverProfile()
      return ridesApi.getScheduledRides(driverProfile.id)
    },
    refetchInterval: 30000, // Refetch toutes les 30 secondes
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Ne pas retry si c'est un problème d'autorisation
      if (error?.message?.includes('403') || error?.code === 'PGRST116') {
        return false
      }
      return failureCount < 3
    }
  })
}

// Hook pour les courses programmées d'un chauffeur spécifique (par driver.id)
export function useScheduledRidesForDriver(driverId: string) {
  return useQuery({
    queryKey: rideKeys.scheduled(driverId),
    queryFn: () => ridesApi.getScheduledRides(driverId),
    enabled: !!driverId,
    refetchInterval: 30000, // Refetch toutes les 30 secondes
    refetchOnReconnect: true,
  })
}

// Hook pour l'historique des courses
export function useRideHistory(driverId: string, limit = 50) {
  return useQuery({
    queryKey: rideKeys.history(driverId),
    queryFn: () => ridesApi.getRideHistory(driverId, limit),
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook pour l'itinéraire d'une course (preview)
export function useRideRoute(ride: RideRow | null) {
  return useQuery({
    queryKey: rideKeys.route(ride?.id || ''),
    queryFn: () => ridesApi.getRideRoute(ride!),
    enabled: !!ride && !!ride.pickup_lat && !!ride.dropoff_lat,
    staleTime: 10 * 60 * 1000, // 10 minutes (les itinéraires changent peu)
  })
}

// Mutation pour accepter une course
export function useAcceptRide() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ rideId, driverId }: { rideId: string; driverId: string }) =>
      ridesApi.acceptRide(rideId, driverId),
    onSuccess: (data, { driverId }) => {
      // Invalider et refetch les queries liées
      queryClient.invalidateQueries({ queryKey: rideKeys.available() })
      queryClient.invalidateQueries({ queryKey: rideKeys.scheduled(driverId) })
      
      toast({
        variant: "success",
        title: "Course acceptée",
        description: "La course a été ajoutée à votre planning"
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'accepter la course. Elle a peut-être déjà été prise."
      })
    }
  })
}

// Mutation pour démarrer une course
export function useStartRide() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (rideId: string) => ridesApi.startRide(rideId),
    onSuccess: (data) => {
      // Mettre à jour directement le cache
      queryClient.setQueryData(
        rideKeys.scheduled(data.driver_id!),
        (oldData: RideRow[] | undefined) =>
          oldData?.map(ride =>
            ride.id === data.id ? { ...ride, status: 'in-progress' } : ride
          )
      )
      
      toast({
        variant: "success",
        title: "Course démarrée",
        description: "Bon voyage !"
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de démarrer la course"
      })
    }
  })
}

// Mutation pour terminer une course
export function useCompleteRide() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ rideId, finalPrice }: { rideId: string; finalPrice?: number }) =>
      ridesApi.completeRide(rideId, finalPrice),
    onSuccess: (data) => {
      // Mettre à jour directement le cache
      queryClient.setQueryData(
        rideKeys.scheduled(data.driver_id!),
        (oldData: RideRow[] | undefined) =>
          oldData?.filter(ride => ride.id !== data.id)
      )
      
      // Invalider les stats pour les mettre à jour
      queryClient.invalidateQueries({ queryKey: ['drivers', 'stats'] })
      
      toast({
        variant: "success",
        title: "Course terminée",
        description: "Merci pour votre service !"
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de terminer la course"
      })
    }
  })
}
