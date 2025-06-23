import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ridesApi, rideKeys } from '@/lib/api/rides'
import { useToast } from '@/hooks/useToast'
import type { Database } from '@/lib/types/database.types'

type RideRow = Database['public']['Tables']['rides']['Row']

// Hook pour les courses disponibles
export function useAvailableRides(driverId?: string) {
  return useQuery({
    queryKey: rideKeys.available(driverId),
    queryFn: () => ridesApi.getAvailableRides(driverId),
    enabled: !!driverId,
    staleTime: 30000, // 30s de cache - les invalidations Realtime actualiseront automatiquement
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

// Hook pour les courses programmées
export function useScheduledRides(driverId: string) {
  return useQuery({
    queryKey: rideKeys.scheduled(driverId),
    queryFn: () => ridesApi.getScheduledRides(driverId),
    enabled: !!driverId,
    staleTime: 60000, // 1 minute de cache - Realtime gère les mises à jour
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
