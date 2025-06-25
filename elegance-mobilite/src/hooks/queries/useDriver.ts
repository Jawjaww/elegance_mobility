import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { driversApi, driverKeys } from '@/lib/api/drivers'
import { useToast } from '@/hooks/useToast'

// Hook pour le profil du chauffeur
export function useDriverProfile(driverId: string) {
  return useQuery({
    queryKey: driverKeys.profile(driverId),
    queryFn: () => driversApi.getDriverProfile(driverId),
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnReconnect: true,
  })
}

// Hook pour les statistiques du chauffeur
export function useDriverStats(driverId: string, period: 'today' | 'week' | 'month') {
  return useQuery({
    queryKey: driverKeys.stats(driverId, period),
    queryFn: () => driversApi.getDriverStats(driverId, period),
    enabled: !!driverId,
    staleTime: 2 * 60 * 1000, // 2 minutes pour les stats
    refetchInterval: 60000, // Refetch toutes les minutes
  })
}

// Mutation pour mettre à jour le statut en ligne/hors ligne
export function useUpdateOnlineStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ driverId, isOnline }: { driverId: string; isOnline: boolean }) =>
      driversApi.updateOnlineStatus(driverId, isOnline),
    onSuccess: (data, { isOnline }) => {
      // Mettre à jour le cache du profil
      queryClient.setQueryData(
        driverKeys.profile(data.id),
        (oldData: any) => ({ ...oldData, is_online: isOnline })
      )
      
      toast({
        variant: isOnline ? "success" : "destructive",
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

// Mutation pour mettre à jour la localisation (stockée dans l'UI state uniquement)
export function useUpdateLocation() {
  // Note: La localisation est stockée dans l'UI state pour l'instant
  // Si nécessaire, on peut ajouter des champs de localisation à la table drivers plus tard
  return useMutation({
    mutationFn: async ({ driverId, lat, lon }: { driverId: string; lat: number; lon: number }) => {
      // Pour l'instant, on retourne juste les coordonnées
      // Dans le futur, on pourrait stocker cela dans une table locations séparée
      console.log(`📍 Driver ${driverId} location updated: ${lat}, ${lon}`)
      return { driverId, lat, lon, timestamp: Date.now() }
    },
    // Les mises à jour de localisation sont gérées par l'UI store
  })
}
