import { supabase } from '@/lib/database/client'
import type { Database } from '@/lib/types/database.types'

type DriverRow = Database['public']['Tables']['drivers']['Row']
type DriverUpdate = Database['public']['Tables']['drivers']['Update']

// Query functions centralisées pour les drivers
export const driversApi = {
  // Récupérer le profil d'un chauffeur
  getDriverProfile: async (driverId: string): Promise<DriverRow> => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single()
    
    if (error) throw error
    return data
  },

  // Mettre à jour le statut en ligne/hors ligne
  updateOnlineStatus: async (driverId: string, isOnline: boolean): Promise<DriverRow> => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Mettre à jour la position du chauffeur
  updateLocation: async (
    driverId: string, 
    lat: number, 
    lon: number
  ): Promise<DriverRow> => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        current_lat: lat,
        current_lon: lon,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Calculer les statistiques d'un chauffeur
  getDriverStats: async (driverId: string, period: 'today' | 'week' | 'month') => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000))
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const { data, error } = await supabase
      .from('rides')
      .select('id, estimated_price, final_price, pickup_time')
      .eq('driver_id', driverId)
      .eq('status', 'completed')
      .gte('pickup_time', startDate.toISOString())
      .order('pickup_time', { ascending: false })
    
    if (error) throw error

    const rides = data || []
    const totalRides = rides.length
    const totalEarnings = rides.reduce((sum, ride) => 
      sum + (ride.final_price || ride.estimated_price || 0), 0
    )

    // Calcul approximatif des heures (1h par course en moyenne)
    const totalHours = totalRides * 1

    return {
      rides: totalRides,
      earnings: totalEarnings,
      hours: totalHours,
      rating: 4.8 // TODO: Implémenter le système de notation
    }
  }
}

// Query keys structurées pour les drivers
export const driverKeys = {
  all: ['drivers'] as const,
  profile: (driverId: string) => [...driverKeys.all, 'profile', driverId] as const,
  stats: (driverId: string, period: string) => [...driverKeys.all, 'stats', driverId, period] as const,
}
