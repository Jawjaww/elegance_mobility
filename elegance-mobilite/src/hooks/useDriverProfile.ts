'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/database/client'

interface DriverProfile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  phone: string | null
  user_id: string
}

export function useDriverProfile(userId?: string) {
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchDriverProfile() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('drivers')
          .select('id, first_name, last_name, avatar_url, phone, user_id')
          .eq('user_id', userId)
          .single()

        if (error) {
          throw error
        }

        setDriver(data)
      } catch (err) {
        console.error('Erreur lors du chargement du profil chauffeur:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchDriverProfile()
  }, [userId])

  return { driver, loading, error, refetch: () => {
    if (userId) {
      const refetchDriverProfile = async () => {
        try {
          setLoading(true)
          setError(null)

          const { data, error } = await supabase
            .from('drivers')
            .select('id, first_name, last_name, avatar_url, phone, user_id')
            .eq('user_id', userId)
            .single()

          if (error) {
            throw error
          }

          setDriver(data)
        } catch (err) {
          console.error('Erreur lors du rechargement du profil chauffeur:', err)
          setError(err instanceof Error ? err.message : 'Erreur inconnue')
        } finally {
          setLoading(false)
        }
      }
      refetchDriverProfile()
    }
  }}
}

// Hook pour récupérer le profil du chauffeur connecté
export function useCurrentDriverProfile() {
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    // Récupérer l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return useDriverProfile(user?.id)
}
