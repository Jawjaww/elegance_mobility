'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/database/client'
import type { Database } from '@/lib/types/database.types'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

type Driver = Database['public']['Tables']['drivers']['Row']

/**
 * Hook simple pour récupérer l'utilisateur actuel de Supabase
 */
function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer l'utilisateur actuel
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

/**
 * Hook pour récupérer les informations du chauffeur actuel
 * Basé sur l'utilisateur connecté et sa relation avec la table drivers
 */
export function useCurrentDriver() {
  const { user, loading: userLoading } = useSupabaseUser()

  return useQuery({
    queryKey: ['current-driver', user?.id],
    queryFn: async (): Promise<Driver | null> => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté')
      }

      console.log('🔍 Recherche du chauffeur pour user_id:', user.id)

      // Récupérer le profil chauffeur basé sur user_id
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id) // ✅ Utilise user_id, pas id
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de profil chauffeur trouvé
          console.log('⚠️ Aucun profil chauffeur trouvé pour cet utilisateur')
          return null
        }
        console.error('❌ Erreur lors de la récupération du chauffeur:', error)
        throw error
      }

      console.log('✅ Chauffeur trouvé:', driver)
      return driver
    },
    enabled: !!user?.id && !userLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes - profil change rarement
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Ne pas retry si c'est un problème d'autorisation
      if (error?.message?.includes('403') || error?.code === 'PGRST116') {
        return false
      }
      return failureCount < 3
    }
  })
}

/**
 * Hook simple pour obtenir juste l'ID du chauffeur actuel
 */
export function useCurrentDriverId() {
  const { data: driver, isLoading, error } = useCurrentDriver()
  
  return {
    driverId: driver?.id || null,
    isLoading,
    error,
    hasDriverProfile: !!driver
  }
}

/**
 * Hook pour vérifier si l'utilisateur actuel est un chauffeur
 */
export function useIsDriver() {
  const { user } = useSupabaseUser()
  const { data: driver, isLoading } = useCurrentDriver()

  const isDriver = Boolean(
    user && 
    driver && 
    (user.app_metadata?.role === 'app_driver' || user.user_metadata?.role === 'app_driver')
  )

  return {
    isDriver,
    isLoading,
    driver,
    userRole: user?.app_metadata?.role || user?.user_metadata?.role
  }
}
