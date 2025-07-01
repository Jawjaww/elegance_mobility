import { supabase } from '@/lib/database/client'
import type { Database } from '@/lib/types/database.types'

type RideRow = Database['public']['Tables']['rides']['Row']
type RideInsert = Database['public']['Tables']['rides']['Insert']
type RideUpdate = Database['public']['Tables']['rides']['Update']

// Query functions centralisées pour les rides
export const ridesApi = {
  // Récupérer les courses disponibles pour un chauffeur
  getAvailableRides: async (driverId?: string): Promise<RideRow[]> => {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('status', 'pending')
      .is('driver_id', null)
      .order('pickup_time', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Récupérer les courses programmées d'un chauffeur
  getScheduledRides: async (driverId: string): Promise<RideRow[]> => {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', driverId)
      .in('status', ['scheduled', 'in-progress'])
      .order('pickup_time', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Récupérer l'historique des courses d'un chauffeur
  getRideHistory: async (driverId: string, limit = 50): Promise<RideRow[]> => {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .order('pickup_time', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  // Accepter une course
  acceptRide: async (rideId: string, driverId: string): Promise<RideRow> => {
    const { data, error } = await supabase
      .from('rides')
      .update({ 
        driver_id: driverId, 
        status: 'scheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .eq('status', 'pending') // S'assurer que la course est encore disponible
      .is('driver_id', null)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Démarrer une course
  startRide: async (rideId: string): Promise<RideRow> => {
    const { data, error } = await supabase
      .from('rides')
      .update({ 
        status: 'in-progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .eq('status', 'scheduled')
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Terminer une course
  completeRide: async (rideId: string, finalPrice?: number): Promise<RideRow> => {
    const { data, error } = await supabase
      .from('rides')
      .update({ 
        status: 'completed',
        final_price: finalPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .eq('status', 'in-progress')
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Calculer l'itinéraire d'une course pour preview
  getRideRoute: async (ride: RideRow) => {
    if (!ride.pickup_lat || !ride.pickup_lon || !ride.dropoff_lat || !ride.dropoff_lon) {
      throw new Error('Coordonnées manquantes pour calculer l\'itinéraire')
    }

    const startCoord = `${ride.pickup_lon.toFixed(6)},${ride.pickup_lat.toFixed(6)}`
    const endCoord = `${ride.dropoff_lon.toFixed(6)},${ride.dropoff_lat.toFixed(6)}`
    const url = `/api/directions?start=${startCoord}&end=${endCoord}`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Erreur API directions: ${response.status}`)
    
    return response.json()
  }
}

// Query keys structurées
export const rideKeys = {
  all: ['rides'] as const,
  available: (driverId?: string) => [...rideKeys.all, 'available', driverId] as const,
  scheduled: (driverId: string) => [...rideKeys.all, 'scheduled', driverId] as const,
  scheduledCurrent: () => [...rideKeys.all, 'scheduled', 'current'] as const,
  history: (driverId: string) => [...rideKeys.all, 'history', driverId] as const,
  route: (rideId: string) => [...rideKeys.all, 'route', rideId] as const,
}
