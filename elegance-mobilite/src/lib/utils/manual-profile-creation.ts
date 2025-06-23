import { supabase } from '@/lib/database/client'
import type { Database } from '@/lib/types/database.types'

type UserInsert = Database['public']['Tables']['users']['Insert']
type DriverInsert = Database['public']['Tables']['drivers']['Insert']

/**
 * Crée manuellement les profils public.users et public.drivers après inscription
 * À utiliser temporairement jusqu'à ce que le trigger soit fixé
 */
export async function createManualProfiles(
  authUserId: string, 
  userMetadata: {
    first_name?: string
    last_name?: string  
    phone?: string
    portal_type?: string
  }
) {
  try {
    console.log('🔧 Création manuelle des profils pour:', authUserId, userMetadata)

    // 1. Créer public.users
    const userData: UserInsert = {
      id: authUserId,
      first_name: userMetadata.first_name || '',
      last_name: userMetadata.last_name || '', 
      phone: userMetadata.phone || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: userError } = await supabase
      .from('users')
      .insert(userData)

    if (userError) {
      console.error('❌ Erreur création public.users:', userError)
      throw userError
    }

    console.log('✅ public.users créé avec succès')

    // 2. Créer public.drivers si c'est un driver  
    if (userMetadata.portal_type === 'driver') {
      const driverData: DriverInsert = {
        user_id: authUserId,
        first_name: userMetadata.first_name || '',
        last_name: userMetadata.last_name || '',
        phone: userMetadata.phone || '',
        status: 'incomplete',
        // Valeurs par défaut pour les champs obligatoires
        company_name: 'À compléter',
        company_phone: 'À compléter', 
        employee_name: userMetadata.first_name || 'À compléter',
        employee_phone: userMetadata.phone || 'À compléter',
        driving_license_number: 'À compléter',
        driving_license_expiry_date: '2025-12-31',
        vtc_card_number: 'À compléter', 
        vtc_card_expiry_date: '2025-12-31',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: driverError } = await supabase
        .from('drivers')
        .insert(driverData)

      if (driverError) {
        console.error('❌ Erreur création public.drivers:', driverError)
        throw driverError
      }

      console.log('✅ public.drivers créé avec succès')
    }

    return { success: true }

  } catch (error) {
    console.error('❌ Erreur création manuelle profils:', error)
    return { success: false, error }
  }
}

/**
 * Vérifie si les profils existent déjà
 */
export async function checkExistingProfiles(authUserId: string) {
  try {
    // Vérifier public.users
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUserId)
      .single()

    // Vérifier public.drivers  
    const { data: driver } = await supabase
      .from('drivers')
      .select('user_id, status')
      .eq('user_id', authUserId)
      .single()

    return {
      userExists: !!user,
      driverExists: !!driver,
      driverStatus: driver?.status || null
    }
  } catch (error) {
    console.error('❌ Erreur vérification profils:', error)
    return {
      userExists: false,
      driverExists: false, 
      driverStatus: null
    }
  }
}
