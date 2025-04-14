import { useState } from 'react'
import { supabase } from '@/lib/database/client'
import { useToast } from './useToast'

export interface DriverSignupData {
  first_name: string
  last_name: string
  email: string
  password: string
  phone: string
  vtc_card_number: string
  driving_license_number: string
  vtc_card_expiry_date: string
  driving_license_expiry_date: string
  insurance_number?: string
  insurance_expiry_date?: string
  languages_spoken?: string[]
  preferred_zones?: string[]
  company_name?: string
  company_phone?: string
}

export interface UseDriverSignupReturn {
  signup: (data: DriverSignupData) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

export function useDriverSignup(): UseDriverSignupReturn {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const signup = async (data: DriverSignupData) => {
    setIsLoading(true)

    try {
      // 1. Création du compte utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            portal_type: 'driver',
            full_name: `${data.first_name} ${data.last_name}`
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No user data returned')
      }

      // 2. Création du profil chauffeur
      const { data: driverData, error: driverError } = await supabase.rpc(
        'create_pending_driver',
        {
          p_first_name: data.first_name,
          p_last_name: data.last_name,
          p_phone: data.phone,
          p_vtc_card_number: data.vtc_card_number,
          p_driving_license_number: data.driving_license_number,
          p_vtc_card_expiry_date: new Date(data.vtc_card_expiry_date),
          p_driving_license_expiry_date: new Date(data.driving_license_expiry_date),
          p_insurance_number: data.insurance_number,
          p_insurance_expiry_date: data.insurance_expiry_date 
            ? new Date(data.insurance_expiry_date) 
            : null,
          p_languages_spoken: data.languages_spoken,
          p_preferred_zones: data.preferred_zones,
          p_company_name: data.company_name,
          p_company_phone: data.company_phone
        }
      )

      if (driverError) {
        throw driverError
      }

      toast({
        title: "Inscription réussie",
        description: "Votre demande est en cours d'examen. Vous recevrez un email de confirmation.",
        variant: "default"
      })

      return { success: true }

    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error)
      
      toast({
        title: "Erreur d'inscription",
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

  return { signup, isLoading }
}

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