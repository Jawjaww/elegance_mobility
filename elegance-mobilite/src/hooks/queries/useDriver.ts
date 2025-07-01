import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { driversApi, driverKeys } from '@/lib/api/drivers'
import { useToast } from '@/hooks/useToast'

// Hook pour le profil du chauffeur connecté (utilise auth.uid())
export function useCurrentDriverProfile() {
  return useQuery({
    queryKey: driverKeys.current(),
    queryFn: () => driversApi.getCurrentDriverProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Ne pas retry si c'est un problème d'autorisation ou pas de profil
      if (error?.message?.includes('403') || error?.code === 'PGRST116') {
        return false
      }
      return failureCount < 3
    }
  })
}

// Hook pour le profil d'un chauffeur spécifique (par drivers.id)
export function useDriverProfile(driverId: string) {
  return useQuery({
    queryKey: driverKeys.profile(driverId),
    queryFn: () => driversApi.getDriverProfile(driverId),
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnReconnect: true,
  })
}

// Hook pour les statistiques du chauffeur connecté
export function useCurrentDriverStats(period: 'today' | 'week' | 'month') {
  return useQuery({
    queryKey: driverKeys.stats(period),
    queryFn: () => driversApi.getCurrentDriverStats(period),
    staleTime: 2 * 60 * 1000, // 2 minutes pour les stats
    refetchInterval: 60000, // Refetch toutes les minutes
  })
}

// Mutation pour mettre à jour le statut en ligne/hors ligne du chauffeur connecté
export function useUpdateOnlineStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ isOnline }: { isOnline: boolean }) =>
      driversApi.updateOnlineStatus(isOnline),
    onSuccess: (data, { isOnline }) => {
      // Mettre à jour le cache du profil
      queryClient.setQueryData(
        driverKeys.current(),
        (oldData: any) => ({ ...oldData, is_online: isOnline })
      )
      
      toast({
        variant: isOnline ? "success" : "default",
        title: isOnline ? "Vous êtes en ligne" : "Vous êtes hors ligne",
        description: isOnline 
          ? "Vous pouvez maintenant recevoir des courses" 
          : "Vous ne recevrez plus de nouvelles courses"
      })
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour votre statut"
      })
    }
  })
}

// Mutation pour mettre à jour la localisation du chauffeur connecté
export function useUpdateLocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ lat, lon }: { lat: number; lon: number }) =>
      driversApi.updateLocation(lat, lon),
    onSuccess: (data, { lat, lon }) => {
      // Mettre à jour le cache du profil
      queryClient.setQueryData(
        driverKeys.current(),
        (oldData: any) => ({ 
          ...oldData, 
          current_lat: lat, 
          current_lon: lon,
          last_seen: new Date().toISOString()
        })
      )
      console.log(`📍 Location updated: ${lat}, ${lon}`)
    },
    onError: (error) => {
      console.error('❌ Erreur mise à jour localisation:', error)
    }
  })
}
