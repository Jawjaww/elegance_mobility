'use server'

import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface DashboardMetrics {
  todayRides: number
  pendingRides: number
  activeDrivers: number
  remainingRides: number
  availableVehicles: number
  todayRidesTrend: {
    percentage: number
    isUp: boolean
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')

  // Récupérer les courses d'aujourd'hui
  const { data: todayRides, count: todayCount } = await supabase
    .from('rides')
    .select('*', { count: 'exact' })
    .gte('pickup_datetime', `${today}T00:00:00`)
    .lte('pickup_datetime', `${today}T23:59:59`)

  // Récupérer les courses d'hier pour la tendance
  const { count: yesterdayCount } = await supabase
    .from('rides')
    .select('*', { count: 'exact' })
    .gte('pickup_datetime', `${yesterday}T00:00:00`)
    .lte('pickup_datetime', `${yesterday}T23:59:59`)

  // Courses non attribuées
  const { count: pendingCount } = await supabase
    .from('rides')
    .select('*', { count: 'exact' })
    .is('driver_id', null)
    .gte('pickup_datetime', today)

  // Chauffeurs actifs
  const { count: activeDriversCount } = await supabase
    .from('drivers')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  // Véhicules disponibles
  const { count: availableVehiclesCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .eq('status', 'available')

  // Courses restantes
  const { count: remainingCount } = await supabase
    .from('rides')
    .select('*', { count: 'exact' })
    .gt('pickup_datetime', new Date().toISOString())

  // Calculer la tendance
  const trend = yesterdayCount 
    ? ((todayCount || 0) - yesterdayCount) / yesterdayCount * 100
    : 0

  return {
    todayRides: todayCount || 0,
    pendingRides: pendingCount || 0,
    activeDrivers: activeDriversCount || 0,
    remainingRides: remainingCount || 0,
    availableVehicles: availableVehiclesCount || 0,
    todayRidesTrend: {
      percentage: Math.abs(trend),
      isUp: trend >= 0
    }
  }
}
