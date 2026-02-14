#!/usr/bin/env node
// Script de test ESM pour vérifier le flux d'authentification et les rôles
// Usage: node scripts/test-auth-flow.mjs <email> <password>

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const SUPABASE_URL =
  process.env.TEST_SUPABASE_URL || "https://iodsddzustunlahxafif.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.TEST_SUPABASE_ANON_KEY || "REDACTED_ANON_KEY";

// Fonction getAppRole (copiée de common.types.ts pour debug local)
function getAppRole(user) {
  if (!user) return undefined;
  return (
    user?.app_metadata?.role ||
    user?.raw_app_meta_data?.role ||
    user?.user_metadata?.role ||
    user?.role
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth(email, password) {
  console.log("🔐 Test de connexion...\n");

  // 1. Login
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    console.error("❌ Erreur de connexion:", authError.message);
    process.exit(1);
  }

  console.log("✅ Connexion réussie!");
  console.log("📧 Email:", authData.user.email);
  console.log("🆔 User ID:", authData.user.id);

  // 2. Vérification des rôles
  console.log("\n📊 Vérification des rôles:");
  console.log("  - user.role (natif):", authData.user.role);
  console.log(
    "  - user.app_metadata:",
    JSON.stringify(authData.user.app_metadata, null, 2),
  );
  console.log(
    "  - user.user_metadata:",
    JSON.stringify(authData.user.user_metadata, null, 2),
  );

  // 3. Test getAppRole
  const appRole = getAppRole(authData.user);
  console.log("\n🎯 Rôle détecté par getAppRole():", appRole);

  // 4. Vérification cohérence
  console.log("\n✅ Vérifications:");
  if (appRole) {
    console.log("  ✓ Rôle trouvé via getAppRole():", appRole);

    if (
      ["app_customer", "app_driver", "app_admin", "app_super_admin"].includes(
        appRole,
      )
    ) {
      console.log("  ✓ Rôle valide");
    } else {
      console.log("  ⚠ Rôle inattendu:", appRole);
    }
  } else {
    console.log("  ❌ Aucun rôle détecté!");
    console.log("     Cela peut causer des problèmes de redirection.");
  }

  // 5. Test RPC get_user_role (si service role disponible)
  console.log("\n🔄 Test RPC get_user_role...");
  try {
    const { data: rpcRole, error: rpcError } =
      await supabase.rpc("get_user_role");
    if (rpcError) {
      console.log("  ⚠ RPC indisponible pour anon key:", rpcError.message);
    } else {
      console.log("  ✓ RPC get_user_role() retourne:", rpcRole);
    }
  } catch (e) {
    console.log("  ⚠ RPC erreur:", e?.message || e);
  }

  // 6. Test d'accès aux données
  console.log("\n📦 Test d'accès aux données:");
  const { data: rides, error: ridesError } = await supabase
    .from("rides")
    .select("id, status")
    .limit(3);

  if (ridesError) {
    console.log("  ⚠ Erreur accès rides:", ridesError.message);
    console.log("     Code:", ridesError.code);
  } else {
    console.log(
      "  ✓ Accès aux rides OK:",
      rides?.length || 0,
      "courses trouvées",
    );
  }

  // Déconnexion
  await supabase.auth.signOut();
  console.log("\n👋 Déconnecté");
}

// Main
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node scripts/test-auth-flow.mjs <email> <password>");
  console.log("\nCe script teste:");
  console.log("  1. La connexion");
  console.log("  2. La récupération du rôle via getAppRole()");
  console.log("  3. L'accès aux données selon le rôle");
  process.exit(1);
}

try {
  await testAuth(email, password);
} catch (err) {
  console.error(err);
  process.exit(1);
}
