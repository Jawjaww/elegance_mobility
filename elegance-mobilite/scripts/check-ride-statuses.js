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

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function checkRideStatuses() {
  try {
    console.log('🔍 Vérification des statuts des trajets dans la base de données...');
    
    // Exécuter une requête SQL pour récupérer les valeurs de l'enum ride_status
    const { data: enumValues, error: enumError } = await supabase.rpc('get_enum_values', {
      enum_name: 'ride_status'
    });
    
    if (enumError) {
      console.error('Erreur lors de la récupération des valeurs de l\'enum:', enumError);
      
      // Approche alternative si la fonction RPC n'existe pas
      console.log('Tentative avec requête SQL directe...');
      const { data, error } = await supabase
        .from('_manual_sql')
        .select('*')
        .filter('query', 'eq', `
          SELECT e.enumlabel
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'ride_status'
          ORDER BY e.enumsortorder;
        `);
        
      if (error) {
        console.error('Erreur avec la requête SQL directe:', error);
        console.log('\n⚠️ Pour vérifier l\'enum, connectez-vous à l\'interface de Supabase et exécutez cette requête SQL:');
        console.log(`
          SELECT e.enumlabel
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'ride_status'
          ORDER BY e.enumsortorder;
        `);
      } else if (data) {
        console.log('Valeurs de l\'enum ride_status:', data);
      }
    } else {
      console.log('Valeurs de l\'enum ride_status:', enumValues);
    }
    
    // Vérifier les statuts utilisés dans la table rides
    const { data: statusCount, error: statusError } = await supabase
      .from('rides')
      .select('status, count(*)')
      .group('status');
      
    if (statusError) {
      console.error('Erreur lors du comptage des statuts:', statusError);
    } else {
      console.log('\nDistribution des statuts dans la table rides:');
      statusCount.forEach(item => {
        console.log(`${item.status}: ${item.count} trajet(s)`);
      });
    }
    
    console.log('\n✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des statuts:', error);
  }
}

checkRideStatuses().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});
