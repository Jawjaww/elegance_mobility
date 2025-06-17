#!/usr/bin/env ts-node

/**
 * Script pour synchroniser les utilisateurs avec le rôle app_driver 
 * vers la table drivers
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../src/lib/types/database.types'

// Configuration Supabase avec clé service pour accès aux tables auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé service nécessaire

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

type AuthUser = {
  id: string
  email?: string
  raw_app_meta_data?: any
  app_metadata?: any
  created_at: string
}

async function syncDrivers() {
  try {
    console.log('🔍 Recherche des utilisateurs avec le rôle app_driver...')
    
    // 1. Récupérer tous les utilisateurs avec le rôle app_driver
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`)
    }

    console.log(`📊 ${users.users.length} utilisateurs trouvés au total`)

    // Filtrer les utilisateurs avec le rôle app_driver
    const driverUsers = users.users.filter((user: AuthUser) => {
      const appMetadata = user.app_metadata || user.raw_app_meta_data || {}
      const role = appMetadata.role || appMetadata.user_role
      return role === 'app_driver'
    })

    console.log(`🚗 ${driverUsers.length} utilisateurs avec le rôle app_driver trouvés:`)
    driverUsers.forEach((user: AuthUser) => {
      const metadata = user.app_metadata || user.raw_app_meta_data || {}
      console.log(`  - ${user.email} (ID: ${user.id}) - Rôle: ${metadata.role || metadata.user_role}`)
    })

    if (driverUsers.length === 0) {
      console.log('⚠️ Aucun utilisateur avec le rôle app_driver trouvé')
      return
    }

    // 2. Vérifier quels drivers existent déjà dans la table drivers
    const { data: existingDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('user_id')

    if (driversError) {
      throw new Error(`Erreur lors de la récupération des drivers: ${driversError.message}`)
    }

    const existingDriverUserIds = new Set(existingDrivers?.map(d => d.user_id) || [])
    console.log(`📋 ${existingDrivers?.length || 0} entrées existantes dans la table drivers`)

    // 3. Créer les entrées manquantes
    const missingDrivers = driverUsers.filter((user: AuthUser) => !existingDriverUserIds.has(user.id))

    if (missingDrivers.length === 0) {
      console.log('✅ Tous les utilisateurs app_driver ont déjà une entrée dans la table drivers')
      return
    }

    console.log(`🔧 Création de ${missingDrivers.length} entrées manquantes...`)

    for (const user of missingDrivers) {
      console.log(`\n📝 Création de l'entrée driver pour ${user.email}...`)
      
      // Données minimales requises pour créer un driver
      const driverData = {
        user_id: user.id,
        first_name: 'À compléter', // Valeur par défaut
        last_name: 'À compléter',  // Valeur par défaut
        phone: '0000000000',       // Valeur par défaut
        company_name: 'À compléter',
        company_phone: '0000000000',
        employee_name: 'À compléter',
        employee_phone: '0000000000',
        driving_license_number: 'TEMP_' + user.id.substring(0, 8),
        driving_license_expiry_date: '2025-12-31', // Date future par défaut
        vtc_card_number: 'TEMP_' + user.id.substring(0, 8),
        vtc_card_expiry_date: '2025-12-31', // Date future par défaut
        status: 'pending_validation' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('drivers')
        .insert(driverData)
        .select()

      if (error) {
        console.error(`❌ Erreur lors de la création du driver pour ${user.email}:`, error.message)
        continue
      }

      console.log(`✅ Driver créé avec succès pour ${user.email}`)
      console.log(`   - ID driver: ${data[0].id}`)
      console.log(`   - Statut: ${data[0].status}`)
    }

    console.log('\n🎉 Synchronisation terminée!')
    console.log('⚠️  Note: Les drivers créés ont des données par défaut.')
    console.log('   Il est recommandé de les compléter via l\'interface admin.')

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    process.exit(1)
  }
}

// Exécuter le script
if (require.main === module) {
  syncDrivers()
    .then(() => {
      console.log('\n✅ Script terminé avec succès')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}

export { syncDrivers }
