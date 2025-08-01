import { supabase } from '@/lib/database/client'
import type { Database } from '@/lib/types/database.types'

type DriverRow = Database['public']['Tables']['drivers']['Row']
type DriverUpdate = Database['public']['Tables']['drivers']['Update']

// Query functions centralisées pour les drivers
// Ces APIs sont conçues pour le portail chauffeur et utilisent auth.uid()
export const driversApi = {
  // Récupérer le profil du chauffeur connecté (basé sur auth.uid())
  getCurrentDriverProfile: async (): Promise<DriverRow> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', user.id) // ✅ Utilise user_id depuis auth
      .single()
    
    if (error) throw error
    return data
  },

  // Récupérer le profil d'un chauffeur par son drivers.id (pour les relations)
  getDriverProfile: async (driverId: string): Promise<DriverRow> => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId) // ✅ Utilise l'ID du driver pour les relations
      .single()
    
    if (error) throw error
    return data
  },

  // Mettre à jour le statut en ligne/hors ligne du chauffeur connecté
  updateOnlineStatus: async (isOnline: boolean): Promise<DriverRow> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id) // ✅ Utilise user_id depuis auth
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Mettre à jour la position du chauffeur connecté
  updateLocation: async (
    lat: number, 
    lon: number
  ): Promise<DriverRow> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        current_lat: lat,
        current_lon: lon,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id) // ✅ Utilise user_id depuis auth
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Calculer les statistiques du chauffeur connecté
  getCurrentDriverStats: async (period: 'today' | 'week' | 'month') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    // D'abord récupérer le driver ID
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!driver) throw new Error('Profil chauffeur non trouvé')

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
      .eq('driver_id', driver.id) // ✅ Utilise driver.id pour la relation rides
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
  current: () => [...driverKeys.all, 'current'] as const,
  profile: (driverId: string) => [...driverKeys.all, 'profile', driverId] as const,
  stats: (period: string) => [...driverKeys.all, 'stats', period] as const,
}

/*
 * ARCHITECTURE NOTES:
 * 
 * Ce fichier contient les APIs pour le portail chauffeur.
 * 
 * DEUX TYPES D'ID DANS LE SYSTÈME:
 * 1. auth.users.id (UUID de l'utilisateur Supabase) 
 * 2. drivers.id (UUID du profil chauffeur)
 * 
 * RELATION: drivers.user_id -> auth.users.id (1:1)
 * 
 * RÈGLES D'USAGE:
 * - getCurrentDriverProfile(): Utilise auth.uid() → drivers.user_id 
 * - getDriverProfile(driverId): Utilise drivers.id pour les relations (rides.driver_id)
 * - updateOnlineStatus()/updateLocation(): Utilise auth.uid() → drivers.user_id
 * 
 * Pour les APIs admin qui manipulent drivers.id directement, voir drivers-admin.ts
 */
