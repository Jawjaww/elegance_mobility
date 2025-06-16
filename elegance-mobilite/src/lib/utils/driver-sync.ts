import { supabase } from '@/lib/database/client'

/**
 * Utilitaires pour la synchronisation des chauffeurs
 */

/**
 * Synchronise les utilisateurs existants avec le rôle app_driver vers la table drivers
 */
export async function syncExistingDrivers() {
  try {
    console.log('🔄 Début de la synchronisation des chauffeurs existants...')

    // Vérifier que nous sommes connectés en tant qu'admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Utilisateur non connecté')
    }

    const userRole = user.app_metadata?.role || user.user_metadata?.role
    if (!['app_admin', 'app_super_admin'].includes(userRole)) {
      throw new Error('Accès refusé - rôle administrateur requis')
    }

    console.log('✅ Connecté en tant qu\'admin:', user.email)

    // Exécuter la fonction de synchronisation
    const { data, error } = await supabase.rpc('sync_existing_drivers')

    if (error) {
      throw error
    }

    console.log('✅ Synchronisation réussie:', data)
    
    return data

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    throw error
  }
}

/**
 * Vérifie les chauffeurs dans la table drivers
 */
export async function checkDriversTable() {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, user_id, status')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    console.log('📊 Chauffeurs dans la table drivers:', data)
    return data

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    throw error
  }
}
