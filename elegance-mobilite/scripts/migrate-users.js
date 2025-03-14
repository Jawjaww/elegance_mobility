#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement du répertoire parent
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error(`File not found: ${envPath}`);
  console.error('Please make sure .env.local exists in the project root directory');
  process.exit(1);
}

dotenv.config({ path: envPath });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

console.log('Creating Supabase client...');

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function migrateUsers() {
  try {
    console.log('🔄 Début de la migration des utilisateurs...');

    // 1. Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`);
    }

    console.log(`📊 ${users.length} utilisateurs à traiter`);

    // 2. Récupérer tous les admins actuels
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*');

    if (adminsError) {
      throw new Error(`Erreur lors de la récupération des admins: ${adminsError.message}`);
    }

    // Créer une map pour un accès rapide
    const adminMap = new Map();
    if (admins) {
      admins.forEach(admin => {
        adminMap.set(admin.id, admin);
      });
    }

    // 3. Pour chaque utilisateur, mettre à jour le niveau admin si nécessaire
    for (const user of users) {
      // Vérifier si c'est un admin ou un superAdmin
      let adminLevel = null;
      
      if (user.role === 'admin' || user.role === 'superAdmin') {
        // Chercher dans la table des admins
        const admin = adminMap.get(user.id);
        
        if (admin) {
          adminLevel = admin.level;
        } else if (user.role === 'superAdmin') {
          // Fallback si pas trouvé dans la table admin mais marqué comme superAdmin
          adminLevel = 'super';
        } else {
          // Admin standard par défaut
          adminLevel = 'standard';
        }
        
        // Standardiser le rôle à 'admin'
        const standardRole = 'admin';
        
        // Mettre à jour l'utilisateur
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: standardRole,
            admin_level: adminLevel
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.warn(`⚠️ Erreur lors de la mise à jour de l'utilisateur ${user.id}: ${updateError.message}`);
        } else {
          console.log(`✅ Utilisateur ${user.id} mis à jour: ${user.role} → admin avec niveau ${adminLevel}`);
        }
      }
    }

    console.log('✅ Migration des utilisateurs terminée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration des utilisateurs:', error);
    console.error('Detailed error:', error.message);
    process.exit(1);
  }
}

migrateUsers().catch(error => {
  console.error('Unexpected error:', error);
  console.error('Detailed error:', error.message);
  process.exit(1);
});
