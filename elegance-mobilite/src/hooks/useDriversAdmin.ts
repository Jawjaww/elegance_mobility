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

export function useDriversAdmin() {
  const [drivers, setDrivers] = useState<DriverValidationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDrivers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Récupérer tous les drivers avec leurs infos utilisateur
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select(`
          *,
          users (
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })

      if (driversError) throw driversError

      // Récupérer le rapport de complétude pour chaque driver
      const driversWithCompleteness = await Promise.all(
        (driversData || []).map(async (driver) => {
          try {
            // Essayer d'abord la fonction RPC standard
            let completenessData, completenessError
            
            try {
              const result = await supabase
                .rpc('check_driver_profile_completeness', {
                  driver_user_id: driver.user_id
                })
              completenessData = result.data
              completenessError = result.error
            } catch (rpcErr) {
              console.warn(`Fonction RPC échouée pour driver ${driver.id}, utilisation de valeurs par défaut:`, rpcErr)
              completenessError = rpcErr
            }

            if (completenessError) {
              console.warn(`Erreur complétude driver ${driver.id}:`, completenessError)
              return {
                driver: driver as DriverWithUser,
                isComplete: false,
                completionPercentage: 0,
                missingFields: ['Erreur de vérification']
              }
            }

            const completenessInfo = completenessData?.[0] || {
              is_complete: false,
              completion_percentage: 0,
              missing_fields: []
            }

            return {
              driver: driver as DriverWithUser,
              isComplete: completenessInfo.is_complete,
              completionPercentage: completenessInfo.completion_percentage,
              missingFields: completenessInfo.missing_fields || []
            }
          } catch (err) {
            console.warn(`Erreur traitement driver ${driver.id}:`, err)
            return {
              driver: driver as DriverWithUser,
              isComplete: false,
              completionPercentage: 0,
              missingFields: ['Erreur de traitement']
            }
          }
        })
      )

      setDrivers(driversWithCompleteness)
    } catch (err: any) {
      console.error('Erreur lors du chargement des drivers:', err)
      console.error('Détails de l\'erreur:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack
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
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)

      if (error) throw error

      // Recharger les drivers après mise à jour
      await loadDrivers()
      
      return { success: true }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du statut:', err)
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  const refetch = () => loadDrivers()

  // Filtres par statut
  const pendingDrivers = drivers.filter(d => d.driver.status === 'pending_validation')
  const activeDrivers = drivers.filter(d => d.driver.status === 'active')
  const inactiveDrivers = drivers.filter(d => d.driver.status === 'inactive')
  const incompleteDrivers = drivers.filter(d => d.driver.status === 'incomplete')
  const suspendedDrivers = drivers.filter(d => d.driver.status === 'suspended')
  const onVacationDrivers = drivers.filter(d => d.driver.status === 'on_vacation')

  return {
    drivers,
    loading,
    error,
    refetch,
    updateDriverStatus,
    // Filtres
    pendingDrivers,
    activeDrivers,
    inactiveDrivers,
    incompleteDrivers,
    suspendedDrivers,
    onVacationDrivers,
    // Statistiques
    stats: {
      total: drivers.length,
      pending: pendingDrivers.length,
      active: activeDrivers.length,
      inactive: inactiveDrivers.length,
      incomplete: incompleteDrivers.length,
      suspended: suspendedDrivers.length,
      onVacation: onVacationDrivers.length
    }
  }
}
