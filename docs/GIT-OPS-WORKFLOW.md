# 🚀 Workflow Git-Ops - Database

## Principe

Le déploiement de la base de données se fait **automatiquement via GitHub Actions** à chaque merge sur `main`. Pas de `supabase push` manuel !

## Avantages

- ✅ **Traçabilité** : Chaque changement est versionné dans Git
- ✅ **Revue de code** : Les migrations passent par PR avant déploiement
- ✅ **Tests automatisés** : Vérifications RLS, fonctions, etc.
- ✅ **Historique propre** : Squash merge = 1 commit propre par feature
- ✅ **Rollback** : On peut revenir à une version précédente via Git

---

## 🔄 Workflow de développement

### 1. Créer une branche feature

```bash
git checkout main
git pull origin main
git checkout -b feature/ma-nouvelle-feature
```

### 2. Modifier la base localement

```bash
# Démarrer Supabase localement
supabase start

# Faire des modifications via Studio ou SQL Editor
# http://localhost:54323

# Générer la migration depuis les changements
supabase db diff -f 20250202_ajout_table_xyz

# OU créer manuellement
supabase migration new 20250202_ajout_table_xyz
```

### 3. Tester les modifications

```bash
# Vérifier que tout fonctionne
./scripts/verify-setup.sh

# Vérifier la conformité VTC
./scripts/verify-vtc-compliance.sh

# Reset complet et test
supabase db reset
```

### 4. Commiter et pousser

```bash
git add supabase/migrations/20250202_ajout_table_xyz.sql
git commit -m "feat: ajout table xyz pour feature Y

- Description du changement
- Pourquoi c'est nécessaire
- Impact sur les données existantes"

git push origin feature/ma-nouvelle-feature
```

### 5. Créer une Pull Request

```bash
gh pr create --title "feat: ajout table xyz" --body "Description..." --base main
```

**⚠️ La PR sera automatiquement vérifiée par les GitHub Actions :**
- ✅ RLS activé sur les tables
- ✅ Search path des fonctions
- ✅ Convention de nommage
- ✅ Tests de fonctions critiques

### 6. Merge (Squash uniquement)

Le repo est configuré pour **Squash Merge uniquement**.

```
squash merge = transforme tous les commits de la PR en 1 seul commit propre
```

Dans l'interface GitHub :
1. Cliquer sur "Squash and merge"
2. Éditer le message de commit si nécessaire
3. Confirmer

### 7. Déploiement automatique

Une fois mergé sur `main`, la GitHub Action se déclenche :

```
Push sur main
    ↓
GitHub Action : supabase-migrations.yml
    ↓
Lint & Tests
    ↓
supabase db push (vers production)
    ↓
✅ Déployé !
```

---

## 📁 Convention de nommage des migrations

```
YYYYMMDDHHMMSS_description_courte.sql

Exemples :
✅ 20250202220000_fix_security_rls.sql
✅ 20250202230000_add_payments_table.sql
❌ 2025_02_02_fix.sql (pas assez de chiffres)
❌ fix.sql (pas de timestamp)
```

---

## 🔐 Secrets nécessaires

Dans GitHub Repository → Settings → Secrets and variables → Actions :

| Secret | Description | Où le trouver |
|--------|-------------|---------------|
| `SUPABASE_ACCESS_TOKEN` | Token d'accès Supabase | Supabase Dashboard → Account → Access Tokens |
| `SUPABASE_PROJECT_ID` | ID du projet | Dans l'URL du projet ou `supabase/config.toml` |

---

## 🐛 Dépannage CI/CD

### Erreur : "Authentication failed"

```
Vérifier que SUPABASE_ACCESS_TOKEN est bien configuré dans GitHub Secrets
```

### Erreur : "Migration conflict"

```bash
# En local, résoudre les conflits
supabase db reset
supabase db pull  # Récupérer l'état de production

# Re-générer la migration
supabase db diff -f 20250202_correction
```

### Voir les logs du déploiement

Dans GitHub :
1. Aller sur l'onglet "Actions"
2. Cliquer sur le workflow "Database Migrations"
3. Voir les logs de l'étape "Push Migrations"

---

## 📊 Monitoring

### Vérifier l'état des migrations

```bash
supabase migration list
```

### Statut de la base de production

Via Supabase Dashboard :
- https://supabase.com/dashboard/project/ioddsdzustunlahxafif

### Logs de la base

```bash
supabase logs db
```

---

## 🎯 Bonnes pratiques

### ✅ Faire

- ✅ Tester les migrations en local avant de push
- ✅ Créer des migrations atomiques (1 feature = 1 migration si possible)
- ✅ Documenter les migrations complexes dans le message de commit
- ✅ Vérifier que RLS est activé sur les nouvelles tables
- ✅ Ajouter des index sur les colonnes fréquemment recherchées

### ❌ Ne pas faire

- ❌ Modifier une migration déjà mergée sur `main`
- ❌ Pousser directement sur `main` (toujours passer par PR)
- ❌ Créer des migrations sans les tester
- ❌ Oublier d'activer RLS sur les nouvelles tables
- ❌ Supprimer des colonnes sans migration de données

---

## 🔄 Rollback

Si une migration pose problème :

### 1. Créer une migration de rollback

```bash
supabase migration new 20250202_rollback_feature_xyz
```

### 2. Écrire le SQL inverse

```sql
-- Annuler les changements de la migration précédente
DROP TABLE IF EXISTS nouvelle_table;
ALTER TABLE existing_table DROP COLUMN nouvelle_colonne;
```

### 3. Merger la PR de rollback

Le déploiement se fera automatiquement.

---

## 📚 Ressources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Git-Ops Principles](https://www.gitops.tech/)
