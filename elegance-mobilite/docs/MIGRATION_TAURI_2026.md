# 🚀 Plan de Migration : Next.js + Supabase vers Tauri-Ready 2026

## Objectif

Transformer l'architecture SSR/Cookies en une **SPA (Single Page App)** robuste, utilisant l'authentification **PKCE Client-side** et des politiques **RLS basées sur le JWT**.

---

## Étape 1 : Stabilisation Database & RLS (Docker Local)

**Action :** Sécuriser la base de données pour qu'elle reconnaisse les rôles directement depuis le jeton (JWT) envoyé par Tauri.

1. **Reréer la fonction Helper SQL si nécessaire:**

```sql
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')::text;
$$ LANGUAGE sql STABLE;

```

2. **Mettre à jour les RLS :** Remplacer les jointures sur la table `profiles` par `USING (auth.role() = 'app_driver')` (plus performant et Tauri-compatible).
3. **Sync GitOps :**

- `supabase db diff --local > supabase/migrations/target_state.sql`
- `supabase db reset` (Vérifier que tout se reconstruit sans erreur).

---

## Étape 2 : Configuration Next.js "Static Mode"

**Action :** Désactiver les fonctionnalités serveur incompatibles avec Tauri.

1. **Modifier `next.config.mjs` :**

- Ajouter `output: 'export'`.
- Ajouter `images: { unoptimized: true }`.

2. **Nettoyer les Routes :** Supprimer tous les `getServerSideProps` ou `generateStaticParams` dynamiques.
3. **Test de compilation :** Exécuter `npm run build`. Si une erreur mentionne `cookies()` ou `headers()`, la page doit être convertie en `'use client'`.

---

## Étape 3 : Refactorisation de l'Authentification (Client-Only)

**Action :** Supprimer la dépendance aux cookies et au dossier `server.ts`.

1. **Supprimer le Middleware :** Supprimer `middleware.ts` (Tauri ne l'exécute pas).
2. **Singleton Supabase Client :** Utiliser uniquement `createBrowserClient` avec :

- `flowType: 'pkce'`
- `persistSession: true`

3. **Migration du `server.ts` :** Transférer la logique de `getServerUser()` vers un hook client `useAuth()` utilisant `supabase.auth.getUser()`.

---

## Étape 4 : Navigation & Guard Client-Side

**Action :** Gérer les redirections et la protection des routes dans l'UI.

1. **Créer `src/lib/auth/navigation.client.ts` :** Implémenter `redirectToRoleHome` avec `router.push()`.
2. **Créer un `AuthGuard` :**

- Utiliser `onAuthStateChange`.
- Rediriger l'utilisateur vers sa page d'accueil selon `app_metadata.role` dès la connexion.

3. **Intégrer dans `layout.tsx` :** Envelopper `{children}` avec `<AuthGuard />`.

---

## Étape 5 : Initialisation Tauri

**Action :** Créer l'enveloppe native une fois le Web stabilisé.

1. **Init :** `npx create-tauri-app@latest`.
2. **Config `tauri.conf.json` :**

- `devPath`: `http://localhost:3000`
- `distDir`: `../out`

3. **Supabase Redirects :** Ajouter `tauri://localhost` dans la liste des URLs autorisées du dashboard Supabase.

---

## 🛠 Commandes à exécuter pour Copilot

- `Vérifie si des fichiers utilisent encore 'next/headers'`
- `Remplace les fonctions redirect() serveur par router.push() client`
- `Assure-toi que toutes les requêtes Supabase utilisent le singleton client`

---

## ✅ Étape 6 : Pure Client Architecture (IMPLÉMENTÉ)

**Date :** 7 février 2026

**Fichiers créés :**

- ✅ `src/lib/auth/navigation.client.ts` — Hook `useRoleNavigation()` pour redirection client-side
- ✅ `src/components/auth/AuthGuard.tsx` — Composant de protection des routes (remplace middleware)

**Points clés :**

- Navigation basée sur `router.push()` au lieu de `redirect()` serveur
- Écoute des événements auth via `supabase.auth.onAuthStateChange()`
- Vérification initiale avec `supabase.auth.getUser()` pour récupérer `app_metadata.role`
- Compatible Tauri : zéro dépendance serveur, stockage dans localStorage

**Prochaines étapes :**

1. Intégrer `<AuthGuard>` dans le layout racine `src/app/layout.tsx`
2. Remplacer progressivement les Server Components des layouts de portails par des composants client
3. Tester le flow complet : login → redirection automatique → accès aux pages protégées

**Note :** Les layouts serveur actuels (`(client-portal)/layout.tsx`, `backoffice-portal/layout.tsx`) peuvent coexister temporairement avec l'AuthGuard. Migration progressive recommandée.

---
