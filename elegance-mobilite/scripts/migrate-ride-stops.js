#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement
const envPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

// Créer le client Supabase
const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function executeSQLSafely(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return { success: true, data };
  } catch (e) {
    console.error('Erreur SQL:', e);
    throw e;
  }
}

async function migrateRideStops() {
  try {
    console.log('🔄 Début de la migration des arrêts de trajet...');
    
    const migrationSQL = `
    BEGIN;
    
    -- Migration de lat/lon dans ride_stops
    DO $$ 
    DECLARE
      lon_exists BOOLEAN;
      lng_exists BOOLEAN;
    BEGIN
      SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'ride_stops' AND column_name = 'lon') INTO lon_exists;
      
      SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'ride_stops' AND column_name = 'lng') INTO lng_exists;
      
      IF lon_exists AND NOT lng_exists THEN
        -- Créer la nouvelle colonne
        ALTER TABLE ride_stops ADD COLUMN lng numeric;
        
        -- Copier les données
        UPDATE ride_stops SET lng = lon;
        
        -- Supprimer l'ancienne colonne
        ALTER TABLE ride_stops DROP COLUMN lon;
        
        RAISE NOTICE 'ride_stops: Colonne lon renommée en lng';
      ELSIF NOT lng_exists THEN
        -- Si aucune colonne lng n'existe, la créer
        ALTER TABLE ride_stops ADD COLUMN lng numeric;
        RAISE NOTICE 'ride_stops: Colonne lng créée';
      END IF;
    END $$;
    
    -- Créer un index sur ride_id pour optimiser les requêtes
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ride_stops_ride_id') THEN
        CREATE INDEX idx_ride_stops_ride_id ON ride_stops(ride_id);
        RAISE NOTICE 'Index ride_stops.ride_id créé';
      END IF;
    END $$;
    
    COMMIT;
    `;
    
    await executeSQLSafely(migrationSQL);
    console.log('✅ Migration des arrêts de trajet terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur critique:', error);
    process.exit(1);
  }
}

migrateRideStops().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});
