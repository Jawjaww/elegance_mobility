import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'
import type { Database } from '@/lib/types/database.types'

type DriverRow = Database['public']['Tables']['drivers']['Row']
type DriverStatus = Database['public']['Enums']['driver_status']

interface DriverWithUser extends DriverRow {
  users?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
}

interface DriverValidationData {
  driver: DriverWithUser
  isComplete: boolean
  completionPercentage: number
  missingFields: string[]
}

export function useDriversAdminSimple() {
  const [drivers, setDrivers] = useState<DriverValidationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDrivers = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Chargement des drivers...')

      // Récupérer tous les drivers avec leurs emails depuis auth.users
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })

      if (driversError) {
        console.error('❌ Erreur requête drivers:', driversError)
        throw driversError
      }

      console.log('✅ Drivers récupérés:', driversData?.length || 0)

      // Version simplifiée sans RPC - calcul local de la complétude
      const driversWithCompleteness = (driversData || []).map((driver) => {
        // Calcul simple de la complétude
        const requiredFields = [
          'first_name', 'last_name', 'phone', 'company_name'
        ]
        
        const missingFields = requiredFields.filter(field => !driver[field as keyof typeof driver])
        const completionPercentage = Math.round(
          ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
        )
        
        return {
          driver: driver as DriverWithUser,
          isComplete: missingFields.length === 0,
          completionPercentage,
          missingFields: missingFields.map(field => `${field} manquant`)
        }
      })

      console.log('✅ Données traitées:', driversWithCompleteness.length)
      setDrivers(driversWithCompleteness)
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des drivers:', err)
      console.error('Détails de l\'erreur:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      })
      setError(err?.message || err?.code || 'Erreur lors du chargement des drivers')
    } finally {
      setLoading(false)
    }
  }

  const updateDriverStatus = async (driverId: string, newStatus: DriverStatus) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', driverId)

      if (error) throw error

      // Recharger les données
      await loadDrivers()
      return { success: true }
    } catch (err: any) {
      console.error('Erreur mise à jour statut:', err)
      return { success: false, error: err.message }
    }
  }

  const refetch = loadDrivers

  useEffect(() => {
    loadDrivers()
  }, [])

  // Calculer les statistiques
  const pendingDrivers = drivers.filter(d => d.driver.status === 'pending_validation')
  const activeDrivers = drivers.filter(d => d.driver.status === 'active')
  const inactiveDrivers = drivers.filter(d => d.driver.status === 'inactive')
  const incompleteDrivers = drivers.filter(d => d.driver.status === 'incomplete')

  const stats = {
    total: drivers.length,
    pending: pendingDrivers.length,
    active: activeDrivers.length,
    inactive: inactiveDrivers.length,
    incomplete: incompleteDrivers.length
  }

  return {
    drivers,
    loading,
    error,
    refetch,
    updateDriverStatus,
    pendingDrivers,
    activeDrivers,
    inactiveDrivers,
    incompleteDrivers,
    stats
  }
}
