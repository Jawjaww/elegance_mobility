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

// Fonction pour exécuter du SQL pur en toute sécurité (sans dépendre des fonctions RPC)
async function executeSQLSafely(sql) {
  try {
    // Nous utilisons directement la fonction de requête SQL de Supabase avec le service role
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Erreur lors de l\'exécution SQL:', error);
      throw error;
    }
    
    return { success: true, data };
  } catch (e) {
    console.log('Échec de l\'exécution via RPC, tentative via PostgreSQL REST...');
    try {
      // Méthode alternative: Faire une requête directe en SQL
      const { error } = await supabase.auth.getUser();
      
      if (!error) {
        // Nous devons utiliser une approche différente si la RPC ne fonctionne pas
        console.error('Le rôle du service est requis pour effectuer des migrations SQL');
        throw new Error('Permissions insuffisantes pour effectuer des opérations SQL directes');
      }
      
      throw new Error('Impossible d\'exécuter du SQL direct: ' + (e.message || e));
    } catch (error) {
      console.error('Échec de toutes les méthodes d\'exécution SQL:', error);
      throw error;
    }
  }
}

async function migrateDatabase() {
  try {
    console.log('🔄 Début de la migration et du nettoyage complet de la base de données...');
    
    // 1. Exécuter la migration complète en une seule transaction SQL 
    // pour garantir l'intégrité des données
    const migrationSQL = `
    BEGIN;
    
    -- Vérifier et migrer dropoff_lon vers dropoff_lng
    DO $$ 
    DECLARE
      lon_exists BOOLEAN;
      lng_exists BOOLEAN;
    BEGIN
      SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'rides' AND column_name = 'dropoff_lon') INTO lon_exists;
      
      SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'rides' AND column_name = 'dropoff_lng') INTO lng_exists;
      
      IF lon_exists AND NOT lng_exists THEN
        -- Créer la nouvelle colonne
        ALTER TABLE rides ADD COLUMN dropoff_lng numeric;
        
        -- Copier les données
        UPDATE rides SET dropoff_lng = dropoff_lon;
        
        -- Supprimer l'ancienne colonne
        ALTER TABLE rides DROP COLUMN dropoff_lon;
        
        RAISE NOTICE 'dropoff_lon migré vers dropoff_lng et supprimé';
      ELSIF NOT lng_exists THEN
        -- Si aucune colonne n'existe, créer la nouvelle
        ALTER TABLE rides ADD COLUMN dropoff_lng numeric;
        RAISE NOTICE 'dropoff_lng créé (aucune donnée à migrer)';
      ELSE
        RAISE NOTICE 'dropoff_lng existe déjà, aucune action nécessaire';
      END IF;
    END $$;
    
    -- Vérifier et migrer pickup_lon vers pickup_lng
    DO $$ 
    DECLARE
      lon_exists BOOLEAN;
      lng_exists BOOLEAN;
    BEGIN
      SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'rides' AND column_name = 'pickup_lon') INTO lon_exists;
      
      SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'rides' AND column_name = 'pickup_lng') INTO lng_exists;
      
      IF lon_exists AND NOT lng_exists THEN
        -- Créer la nouvelle colonne
        ALTER TABLE rides ADD COLUMN pickup_lng numeric;
        
        -- Copier les données
        UPDATE rides SET pickup_lng = pickup_lon;
        
        -- Supprimer l'ancienne colonne
        ALTER TABLE rides DROP COLUMN pickup_lon;
        
        RAISE NOTICE 'pickup_lon migré vers pickup_lng et supprimé';
      ELSIF NOT lng_exists THEN
        -- Si aucune colonne n'existe, créer la nouvelle
        ALTER TABLE rides ADD COLUMN pickup_lng numeric;
        RAISE NOTICE 'pickup_lng créé (aucune donnée à migrer)';
      ELSE
        RAISE NOTICE 'pickup_lng existe déjà, aucune action nécessaire';
      END IF;
    END $$;
    
    -- Supprimer la table admins obsolète si elle existe
    -- (nous avons maintenant un champ admin_level dans la table users)
    DO $$ 
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        DROP TABLE admins CASCADE;
        RAISE NOTICE 'Table admins supprimée';
      END IF;
    END $$;
    
    -- Nettoyer toutes les entrées doublons ou invalides
    -- Supprimer les lignes dans rides où les coordonnées sont NULL ou manquantes
    DELETE FROM rides 
    WHERE (pickup_lat IS NULL OR pickup_lng IS NULL OR dropoff_lat IS NULL OR dropoff_lng IS NULL)
    AND status = 'pending';
    
    -- NE PAS renommer la contrainte override_vehicle_id - c'est un champ avec une fonction spécifique
    -- Il permet à un chauffeur d'utiliser temporairement un véhicule différent pour une course donnée
    
    -- Créer des index pour améliorer les performances des requêtes fréquentes
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rides_status') THEN
        CREATE INDEX idx_rides_status ON rides(status);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rides_user_id') THEN
        CREATE INDEX idx_rides_user_id ON rides(user_id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rides_pickup_time') THEN
        CREATE INDEX idx_rides_pickup_time ON rides(pickup_time);
      END IF;
      
      -- Ajouter un index sur le champ override_vehicle_id pour optimiser les requêtes
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rides_override_vehicle_id') THEN
        CREATE INDEX idx_rides_override_vehicle_id ON rides(override_vehicle_id);
      END IF;
    END $$;
    
    -- VACUUM et ANALYZE pour optimiser les performances après les modifications
    ANALYZE rides;
    
    COMMIT;
    `;
    
    console.log('Exécution de la migration SQL...');
    await executeSQLSafely(migrationSQL);
    
    console.log('✅ Migration et nettoyage terminés avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur critique lors de la migration de la base de données:', error);
    console.error('Message détaillé:', error.message || error);
    process.exit(1);
  }
}

migrateDatabase().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});
