/**
 * Script pour créer le profil driver manquant
 * À exécuter une seule fois pour résoudre l'erreur 406
 */

import { supabase } from '@/lib/database/client'

export async function createMissingDriverProfile() {
  const userId = '477371f6-644c-439e-b09d-b93042c757c6' // ID de l'utilisateur connecté
  
  try {
    console.log('🚀 Création du profil driver...')
    
    // Créer le profil driver
    const { data: driver, error } = await supabase
      .from('drivers')
      .insert({
        id: crypto.randomUUID(), // Générer un nouvel ID driver
        user_id: userId,
        first_name: 'Jaw',
        last_name: 'Bej',
        phone: '+33123456789',
        company_name: 'Elegance Mobilité',
        company_phone: '+33123456789',
        employee_name: 'Jaw Bej',
        employee_phone: '+33123456789',
        driving_license_number: 'DL123456789',
        driving_license_expiry_date: '2030-12-31',
        vtc_card_number: 'VTC123456789',
        vtc_card_expiry_date: '2030-12-31',
        status: 'active',
        rating: null,
        total_rides: 0,
        current_vehicle_id: null,
        availability_hours: null,
        preferred_zones: null,
        languages_spoken: ['français', 'anglais'],
        insurance_number: null,
        insurance_expiry_date: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur lors de la création:', error)
      return { success: false, error }
    }

    console.log('✅ Profil driver créé avec succès:', driver)
    return { success: true, driver }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return { success: false, error }
  }
}

// Fonction pour vérifier si le profil existe
export async function checkDriverProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profil n'existe pas
      return { exists: false, data: null }
    }

    if (error) {
      console.error('Erreur lors de la vérification:', error)
      return { exists: false, error }
    }

    return { exists: true, data }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { exists: false, error }
  }
}
