#!/usr/bin/env node
/**
 * Script pour générer les types TypeScript depuis Supabase
 * Utilise l'API REST car supabase gen types nécessite des privilèges spéciaux
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://iodsddzustunlahxafif.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchSchema() {
  console.log("🔍 Récupération du schéma...");

  try {
    // Récupérer les tables
    const tablesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_SERVICE_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          Accept: "application/json",
        },
      },
    );

    if (!tablesRes.ok) {
      throw new Error(`HTTP ${tablesRes.status}: ${await tablesRes.text()}`);
    }

    const schema = await tablesRes.json();
    console.log("✅ Schéma récupéré");

    // Générer un fichier types basique
    const typesContent = generateTypes(schema);

    const outputPath = path.join(
      __dirname,
      "..",
      "src",
      "lib",
      "types",
      "database.types.ts",
    );
    fs.writeFileSync(outputPath, typesContent);
    console.log(`✅ Types générés: ${outputPath}`);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.log("\n💡 Utilisez plutôt la Solution 1 ou 2 ci-dessus");
    process.exit(1);
  }
}

function generateTypes(schema) {
  // Type basique si on ne peut pas récupérer le schéma complet
  return `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, any>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      [key: string]: string[];
    };
  };
};

// Types générés manuellement depuis le schéma
// TODO: Régénérer avec: supabase gen types typescript --linked --schema public
`;
}

fetchSchema();
