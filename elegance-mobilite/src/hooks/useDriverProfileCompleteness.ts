'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/database/client'

export interface ProfileCompletenessResult {
  is_complete: boolean
  completion_percentage: number
  missing_fields: string[]
}

export function useDriverProfileCompleteness(userId: string) {
  return useQuery({
    queryKey: ['driver-profile-completeness', userId],
    queryFn: async (): Promise<ProfileCompletenessResult> => {
      const { data, error } = await supabase
        .rpc('check_driver_profile_completeness', { driver_user_id: userId })
        .single()

      if (error) {
        console.error('Erreur lors de la vérification du profil:', error)
        throw error
      }

      return data as ProfileCompletenessResult
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 secondes
    refetchOnWindowFocus: true,
  })
}
