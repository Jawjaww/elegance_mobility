# Workflow GitOps Supabase — Base de données locale → Production

## 🎯 Objectif

Développer et tester les migrations sur une base Supabase locale (Docker), puis les pousser vers production en mode GitOps.

---

## 📋 Prerequisites

- Supabase CLI installé : `brew install supabase/tap/supabase`
- Docker/Colima en cours d'exécution
- Base locale démarrée : `supabase start`

---

## 🔄 Workflow complet

### 1️⃣ **Basculer vers l'environnement LOCAL**

```bash
# Activer la config locale
chmod +x scripts/switch-env.sh
./scripts/switch-env.sh local

# OU manuellement
cp .env.local.development .env.local

# Redémarrer l'application
npm run dev
```

**Résultat :** L'app pointe maintenant vers `http://127.0.0.1:54321` (base Docker locale).

---

### 2️⃣ **Développer & tester les migrations localement**

#### Créer une nouvelle migration

```bash
# Générer un fichier de migration vide
supabase migration new my_feature_name

# OU capturer les différences avec la base locale
supabase db diff --schema public -f supabase/migrations/my_migration_name.sql
```

#### Appliquer les migrations localement

```bash
# Push vers la base locale
supabase db push

# Vérifier l'état
supabase db status
```

#### Régénérer les types TypeScript

```bash
supabase gen types typescript --schema public > src/lib/types/database.types.ts
```

#### Reset/Replay complet (pour tester les migrations from scratch)

```bash
# Reset + replay toutes les migrations
supabase db reset

# Vérifier
supabase db status
```

---

### 3️⃣ **Tester l'application avec la base locale**

```bash
# App tourne sur http://localhost:3000
# Base locale sur http://127.0.0.1:54321

# Tester les features :
# - Créer des données
# - Vérifier les policies RLS
# - Tester l'auth
# - Vérifier les triggers/fonctions
```

**Checklist de validation:**

- [ ] L'app démarre sans erreur
- [ ] Les requêtes Supabase renvoient 200 (pas de 400/403)
- [ ] Les policies RLS fonctionnent correctement
- [ ] Pas d'erreurs TypeScript (`npx tsc --noEmit`)
- [ ] Les migrations se rejouent correctement (`supabase db reset`)

---

### 4️⃣ **Versionner les migrations (GitOps)**

```bash
# Commit les migrations + types générés
git add supabase/migrations/*.sql
git add src/lib/types/database.types.ts
git commit -m "feat(db): add X feature with migrations"

# Pusher sur la branche feature
git push origin feature/my-feature
```

---

### 5️⃣ **Pousser vers Production (après validation locale)**

#### Option A : Push direct via CLI

```bash
# Basculer vers l'env remote (pour utiliser les bons credentials)
./scripts/switch-env.sh remote

# Pusher les migrations vers prod
supabase db push --db-url "$DATABASE_URL"

# OU via le project-ref
supabase link --project-ref iodsddzustunlahxafif
supabase db push
```

#### Option B : CI/CD GitHub Actions (recommandé)

Créer un job dans `.github/workflows/supabase-migrations.yml` :

```yaml
name: Supabase Migrations

on:
  push:
    branches: [main]
    paths:
      - "supabase/migrations/**"

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - name: Apply migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

### 6️⃣ **Rollback (si problème en prod)**

```bash
# Créer une migration de rollback
supabase migration new rollback_my_feature

# Éditer le fichier SQL pour annuler les changements
# Puis pusher
supabase db push
```

---

## 📂 Structure des fichiers

```
elegance-mobilite/
├── .env.local                    # Config active (LOCAL ou REMOTE)
├── .env.local.development        # Config pour base locale (Docker)
├── .env.local.production         # Config pour base remote (Supabase Cloud)
├── scripts/
│   └── switch-env.sh            # Script pour basculer entre envs
├── supabase/
│   ├── config.toml              # Config Supabase CLI
│   ├── migrations/              # Migrations SQL (versionnées Git)
│   │   ├── 20260208_init.sql
│   │   └── 20260208_fix_vehicles_rls_policies.sql
│   └── seed.sql                 # Données de test (optionnel)
└── src/lib/types/
    └── database.types.ts        # Types TS générés (versionnés Git)
```

---

## 🛡️ Bonnes pratiques

### ✅ À FAIRE

- ✅ Toujours tester les migrations localement **avant** de pusher en prod
- ✅ Versionner les migrations dans Git
- ✅ Nommer les migrations de façon explicite : `YYYYMMDD_description.sql`
- ✅ Générer et committer `database.types.ts` après chaque migration
- ✅ Tester `supabase db reset` pour valider que les migrations rejoue correctement
- ✅ Documenter les changements breaking dans les commits

### ❌ À ÉVITER

- ❌ Modifier les migrations déjà appliquées en production
- ❌ Pusher directement en prod sans test local
- ❌ Versionner `.env.local` (contient des secrets)
- ❌ Appliquer des migrations manuellement (via SQL direct)

---

## 🔍 Commandes utiles

```bash
# État des services locaux
supabase status

# Logs de la base locale
supabase db logs

# Accéder au studio local
open http://127.0.0.1:54323

# Dump de la base locale
supabase db dump -f backup.sql

# Comparer schemas (local vs remote)
supabase db diff --schema public

# Lister les migrations appliquées
supabase migration list

# Générer types TypeScript
supabase gen types typescript --schema public > src/lib/types/database.types.ts
```

---

## 📝 Exemple complet

```bash
# 1. Activer env local
./scripts/switch-env.sh local

# 2. Créer migration
supabase migration new add_notifications_table

# 3. Éditer supabase/migrations/YYYYMMDD_add_notifications_table.sql
# (créer table, policies, etc.)

# 4. Appliquer localement
supabase db push

# 5. Régénérer types
supabase gen types typescript --schema public > src/lib/types/database.types.ts

# 6. Tester l'app
npm run dev
# → Vérifier que tout fonctionne

# 7. Valider replay des migrations
supabase db reset
supabase db push

# 8. Commit
git add supabase/migrations/*.sql src/lib/types/database.types.ts
git commit -m "feat(db): add notifications table with RLS policies"
git push origin feature/notifications

# 9. Après review/merge : pousser en prod
./scripts/switch-env.sh remote
supabase link --project-ref iodsddzustunlahxafif
supabase db push
```

---

## 🚀 Migration Production (checklist finale)

Avant de pousser en production :

- [ ] Migrations testées localement avec `supabase db reset`
- [ ] Types TypeScript régénérés et committés
- [ ] Aucune erreur `npx tsc --noEmit`
- [ ] Pull request reviewée et approuvée
- [ ] Backup de prod effectué (si changements critiques)
- [ ] Plan de rollback documenté

```bash
# Push vers prod
supabase link --project-ref iodsddzustunlahxafif
supabase db push --dry-run  # Preview des changements
supabase db push            # Appliquer réellement
```

---

## 📞 En cas de problème

1. **Migration échoue en prod** → Créer migration de rollback
2. **Types TS désynchronisés** → Régénérer depuis remote : `supabase gen types typescript --db-url "$REMOTE_URL"`
3. **RLS policies bloquent** → Vérifier avec `debugRlsProblem()` (voir `src/lib/database/client.ts`)
4. **Port 54321 déjà utilisé** → `supabase stop && supabase start`

---

**Auteur:** Migration workflow setup  
**Date:** 2026-02-08  
**Status:** ✅ Configuration prête pour dev local → GitOps → prod
