'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/database/client'

interface ProfileCompletenessData {
  is_complete: boolean
  missing_fields: string[]
  completion_percentage: number
}

// Hook pour vérifier la complétude du profil driver
export const useDriverProfileCompleteness = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['driver-profile-completeness', userId],
    queryFn: async (): Promise<ProfileCompletenessData | null> => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .rpc('check_driver_profile_completeness', { driver_user_id: userId })
      
      if (error) throw error
      return data?.[0] || null
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache pendant 30 secondes
  })
}

// Composant de notification profil incomplet
interface ProfileIncompleteNotificationProps {
  userId: string
  onCompleteProfile?: () => void
}

export function ProfileIncompleteNotification({ 
  userId, 
  onCompleteProfile 
}: ProfileIncompleteNotificationProps) {
  const { data: completeness, isLoading } = useDriverProfileCompleteness(userId)
  
  if (isLoading || !completeness || completeness.is_complete) {
    return null
  }
  
  const missingFieldsLabels: Record<string, string> = {
    first_name: 'Prénom',
    phone: 'Téléphone',
    company_name: 'Nom de l\'entreprise',
    company_phone: 'Téléphone entreprise',
    driving_license_number: 'Numéro de permis',
    driving_license_expiry_date: 'Date d\'expiration du permis',
    vtc_card_number: 'Numéro carte VTC',
    vtc_card_expiry_date: 'Date d\'expiration carte VTC'
  }
  
  const missingLabels = completeness.missing_fields
    .map((field: string) => missingFieldsLabels[field] || field)
    .join(', ')
  
  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            Profil incomplet ({completeness.completion_percentage}%)
          </h3>
          <div className="mt-2 text-sm text-orange-700">
            <p>
              Complétez votre profil pour accéder aux courses. 
              Champs manquants : <strong>{missingLabels}</strong>
            </p>
          </div>
          <div className="mt-3">
            <button
              onClick={() => {
                if (onCompleteProfile) {
                  onCompleteProfile()
                } else {
                  // Rediriger vers la page de profil dédiée
                  window.location.href = '/driver-portal/profile-setup'
                }
              }}
              className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
            >
              Compléter maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant pour bloquer l'accès aux courses
interface BlockedRidesNotificationProps {
  completeness: ProfileCompletenessData | null | undefined
}

export function BlockedRidesNotification({ completeness }: BlockedRidesNotificationProps) {
  if (!completeness || completeness.is_complete) {
    return null
  }
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <div className="flex justify-center mb-2">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-red-800 mb-1">Accès aux courses restreint</h3>
      <p className="text-sm text-red-600 mb-3">
        Vous devez compléter votre profil à 100% pour accéder aux courses.
        Complétude actuelle : {completeness.completion_percentage}%
      </p>
      <div className="bg-red-100 rounded-full h-2 mb-3">
        <div 
          className="bg-red-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completeness.completion_percentage}%` }}
        ></div>
      </div>
    </div>
  )
}
