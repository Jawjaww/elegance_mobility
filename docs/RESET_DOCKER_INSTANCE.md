# RESET Docker Supabase — Procédure reproductible

Ce document décrit une procédure sûre et reproductible pour réinitialiser l'instance Supabase locale (Docker), re-seeder les données de développement et recréer les comptes test utilisables par GoTrue.

## Pré-requis

- `supabase` CLI installée (npx supabase disponible)
- Docker installé et accessible
- Node.js disponible pour exécuter les scripts de seed
- Ne pas lancer en production — destructif

## Étapes rapides

1. Reset complet de la DB (migrations + seed)

```bash
npx supabase db reset
```

2. Vérifier l'URL et les clés publiables/secret générées

```bash
npx supabase status
# Note: copier Publishable & Secret (Publishable / Secret)
```

3. Mettre à jour localement `./.env.local` si nécessaire

Éditez `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` avec les valeurs affichées par `supabase status`.

4. Recréer (idempotent) les comptes via l'Admin API (exemples)

Avec le script Node existant `scripts/create_one_user.mjs` (utilise la clé `SUPABASE_SERVICE_ROLE_KEY`):

```bash
# depuis la racine du projet
node scripts/create_one_user.mjs admin1@elegance-mobilite.local password123 app_super_admin Admin SuperAdmin
node scripts/create_one_user.mjs driver1@elegance-mobilite.local password123 app_driver Driver Chauffeur
node scripts/create_one_user.mjs client1@elegance-mobilite.local password123 app_customer Client Client
```

Ou via `curl` sur l'Admin API (exemple pour créer un admin) :

```bash
curl -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{"email":"admin1@elegance-mobilite.local","password":"password123","email_confirm":true,"raw_app_meta_data":{"role":"app_super_admin"},"user_metadata":{"first_name":"Admin","last_name":"Principal"}}'
```

5. Vérifications post-seed

- S'assurer que les 3 comptes s'authentifient :

```bash
curl -s -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H 'Content-Type: application/json' \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -d '{"email":"client1@elegance-mobilite.local","password":"password123"}' | jq '.'
```

- Vérifier que `auth.identities` existe et contient les providers `email` pour ces comptes :

```bash
# exécutez psql dans le container postgres (nom de container équivalent sur votre machine)
# Ajuster le nom du container si nécessaire

docker exec -i supabase_db_*/ psql -U postgres -d postgres -c "SELECT i.user_id, i.provider, au.email FROM auth.identities i JOIN auth.users au ON i.user_id = au.id ORDER BY au.email;"
```

- Vérifier que `public.users` et `public.user_profiles` sont synchronisés (trigger `handle_new_user` ou seed qui crée ces lignes).

## Checklist (avant de pousser dans CI)

- [ ] Seed idempotent (`ON CONFLICT` ou logique upsert)
- [ ] `seed.sql` ne crée pas d'`auth.users` sans `auth.identities` (ou créer explicitement `auth.identities`)
- [ ] Scripts de seed sensibles (création d'utilisateurs) utilisent la Admin API et sont idempotents
- [ ] Ne pas stocker `SUPABASE_SERVICE_ROLE_KEY` en clair dans le repo
- [ ] Ajouter un job CI optionnel (GitHub Actions) pour exécuter `npx supabase db reset` + seed sur une branche `dev`/`staging` si besoin

## Conseils de sécurité & bonnes pratiques

- Pour CI : stocker la `SUPABASE_SERVICE_ROLE_KEY` dans les secrets du dépôt et injecter uniquement dans les jobs de déploiement ou test.
- Pour tests E2E : préférez créer/supprimer des comptes via l'Admin API plutôt que de reseed globalement à chaque test, pour gagner en rapidité.
- Avant un reset destructif, prendre un dump/backup si vous avez des données utiles.

## Restauration rapide en cas de problème

- Re-run : `npx supabase db reset && node scripts/create_one_user.mjs ...`
- Voir logs CLI : `npx supabase logs` ou `docker logs <container>`

---

Si vous voulez, je peux également :

- ajouter `scripts/seed_admins.mjs` idempotent (Admin API) et l'ajouter au `package.json` comme `npm run seed:admin` ; ou
- ajouter un workflow GitHub Actions minimal qui exécute le reset + seed sur push vers `dev`.
