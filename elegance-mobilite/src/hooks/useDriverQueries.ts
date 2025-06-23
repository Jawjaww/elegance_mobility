'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from '@/hooks/useToast'
import type { Database } from '@/lib/types/database.types'

type RideRow = Database["public"]["Tables"]["rides"]["Row"]

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Hook pour récupérer les courses disponibles
export function useAvailableRidesQuery() {
  const isOnline = true // Temporary fix
  
  return useQuery({
    queryKey: ['available-rides', isOnline],
    queryFn: async () => {
      if (!isOnline) return []
      
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .is('driver_id', null)
        .order('pickup_time', { ascending: true })
        .limit(10)
      
      if (error) throw error
      return data || []
    },
    enabled: isOnline,
    refetchInterval: 30000, // Refetch toutes les 30s si pas de realtime
    staleTime: 15000, // Data fresh pendant 15s
  })
}

// Hook pour récupérer les courses programmées du chauffeur
export function useScheduledRidesQuery() {
  return useQuery({
    queryKey: ['scheduled-rides'],
    queryFn: async () => {
      // TODO: Remplacer par l'ID du chauffeur actuel
      const driverId = 'current-driver'
      
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['scheduled', 'in-progress'])
        .order('pickup_time', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    refetchInterval: 60000, // Refetch toutes les minutes
    staleTime: 30000,
  })
}

// Mutation pour accepter une course
export function useAcceptRideMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ rideId, driverId }: { rideId: string, driverId: string }) => {
      const { data, error } = await supabase
        .from('rides')
        .update({ 
          driver_id: driverId, 
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalider les caches pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['available-rides'] })
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] })
      
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
        description: "Impossible d'accepter la course"
      })
      console.error('Error accepting ride:', error)
    }
  })
}

// Mutation pour mettre à jour le statut d'une course
export function useUpdateRideStatusMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ rideId, status }: { 
      rideId: string, 
      status: Database['public']['Enums']['ride_status'] 
    }) => {
      const { data, error } = await supabase
        .from('rides')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] })
      
      const messages = {
        'in-progress': { title: "Course démarrée", description: "Bon voyage !" },
        'completed': { title: "Course terminée", description: "Merci pour votre service !" }
      }
      
      const message = messages[status as keyof typeof messages]
      if (message) {
        toast({
          variant: "success",
          title: message.title,
          description: message.description
        })
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour la course"
      })
      console.error('Error updating ride status:', error)
    }
  })
}

// Hook pour l'abonnement temps réel aux courses
export function useRealtimeRides() {
  const queryClient = useQueryClient()
  // const { addAvailableRide, removeAvailableRide } = useDriverStore() // TODO: Implement
  
  useEffect(() => {
    const channel = supabase
      .channel('rides-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'rides',
          filter: 'status=eq.pending'
        }, 
        (payload) => {
          console.log('Nouvelle course disponible:', payload.new)
          
          // Ajouter à l'état local
          // addAvailableRide(payload.new as RideRow) // TODO: Implement
          
          // Invalider le cache TanStack Query
          queryClient.invalidateQueries({ queryKey: ['available-rides'] })
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'rides'
        },
        (payload) => {
          console.log('Course mise à jour:', payload.new)
          
          // Si la course a été acceptée par un autre chauffeur, la supprimer des disponibles
          if (payload.new.driver_id && payload.new.driver_id !== 'current-driver') {
            // removeAvailableRide(payload.new.id) // TODO: Implement
          }
          
          // Invalider les caches
          queryClient.invalidateQueries({ queryKey: ['available-rides'] })
          queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] })
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'rides'
        },
        (payload) => {
          console.log('Course supprimée:', payload.old)
          // removeAvailableRide(payload.old.id) // TODO: Implement
          queryClient.invalidateQueries({ queryKey: ['available-rides'] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient]) // TODO: Add dependencies when store is implemented
}

// Hook pour calculer l'itinéraire d'une course (pour l'aperçu)
export function useRideRouteQuery(rideId: string | null) {
  return useQuery({
    queryKey: ['ride-route', rideId],
    queryFn: async () => {
      if (!rideId) return null
      
      // Récupérer la course
      const { data: ride, error } = await supabase
        .from('rides')
        .select('pickup_lat, pickup_lon, dropoff_lat, dropoff_lon')
        .eq('id', rideId)
        .single()
      
      if (error || !ride) throw error
      
      // Calculer l'itinéraire via l'API
      const response = await fetch(`/api/directions?start=${ride.pickup_lon},${ride.pickup_lat}&end=${ride.dropoff_lon},${ride.dropoff_lat}`)
      
      if (!response.ok) throw new Error('Erreur calcul itinéraire')
      
      const routeData = await response.json()
      return routeData.features?.[0] || null
    },
    enabled: !!rideId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
