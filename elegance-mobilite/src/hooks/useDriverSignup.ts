import { useState } from 'react'
import { supabase } from '@/lib/database/client'
import { useToast } from './useToast'

export interface UseDriverValidationReturn {
  validateDriver: (driverId: string, approved: boolean, reason?: string) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

export function useDriverValidation(): UseDriverValidationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const validateDriver = async (driverId: string, approved: boolean, reason?: string) => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.rpc('validate_driver', {
        driver_id: driverId,
        approved,
        rejection_reason: reason
      })

      if (error) throw error

      toast({
        title: approved ? "Chauffeur validé" : "Chauffeur refusé",
        description: approved 
          ? "Le chauffeur a été validé et peut maintenant accéder à son compte" 
          : "Le chauffeur a été informé du rejet de sa candidature",
        variant: "default"
      })

      return { success: true }

    } catch (error: any) {
      console.error('Erreur lors de la validation:', error)
      
      toast({
        title: "Erreur de validation",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      })

      return {
        success: false,
        error: error.message || "Une erreur est survenue"
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { validateDriver, isLoading }
}