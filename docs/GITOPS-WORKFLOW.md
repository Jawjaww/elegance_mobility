# Workflow GitOps - Base de Données

> **Règle d'or:** La source de vérité est `init.sql.sql`. Jamais de modification directe.

---

## 🎯 Principes

1. **Source de Vérité Unique:** `supabase/migrations/20260201234023_supabase/migrations/init.sql.sql`
2. **Pas de Modification Directe:** Toujours via migrations
3. **Review Obligatoire:** Toute migration doit être revue
4. **Test Local Avant Push:** `supabase db reset` puis `supabase db push`

---

## 🔄 Workflow Complet

### 1. Création d'une Migration

```bash
# Créer une nouvelle branche
git checkout -b feature/ajout-table-notifications

# Créer la migration (timestamp auto)
supabase migration new ajout_table_notifications

# Éditer le fichier généré
# supabase/migrations/YYYYMMDDHHMMSS_ajout_table_notifications.sql
```

**Contenu de la migration:**
```sql
-- supabase/migrations/20260201120000_ajout_table_notifications.sql

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read) WHERE NOT read;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
```

---

### 2. Test Local

```bash
# Reset la base locale (ATTENTION: supprime tout!)
supabase db reset

# Vérifier que tout est OK
supabase status

# Tester les requêtes
supabase db dump --data-only --table notifications
```

---

### 3. Génération des Types

```bash
# Générer les types TypeScript
supabase gen types typescript --local --schema public > src/lib/types/database.types.ts

# OU si connecté au projet
supabase gen types typescript --linked --schema public > src/lib/types/database.types.ts

# Nettoyer le fichier (supprimer la première ligne si nécéssaire)
tail -n +2 src/lib/types/database.types.ts > temp.ts && mv temp.ts src/lib/types/database.types.ts
```

---

### 4. Vérification TypeScript

```bash
# Vérifier la compilation
npx tsc --noEmit

# Si erreurs, corriger avant de committer
```

---

### 5. Commit et PR

```bash
# Commit des changements
git add .
git commit -m "feat: ajout table notifications avec RLS

- Table notifications pour le système de messagerie
- Index sur user_id et read
- Policy RLS pour accès utilisateur uniquement
- Types TypeScript mis à jour"

# Push et création de PR
git push origin feature/ajout-table-notifications

# Créer la PR sur GitHub avec:
# - Description des changements
# - SQL de la migration
# - Tests effectués
```

---

### 6. Déploiement

```bash
# Une fois la PR mergée sur main
git checkout main
git pull origin main

# Déployer sur Supabase
supabase db push --project-ref ioddsdzustunlahxafif

# Vérifier le statut
supabase migration list --project-ref ioddsdzustunlahxafif
```

---

## 🚨 Interdictions

### ❌ NE JAMAIS FAIRE

```bash
# 1. Modifier init.sql.sql directement
vim supabase/migrations/20260201234023_supabase/migrations/init.sql.sql  # ❌

# 2. Supprimer une migration déjà appliquée
rm supabase/migrations/20260201_*  # ❌ DANGER

# 3. Modifier manuellement la production sans migration
psql $DATABASE_URL -c "ALTER TABLE..."  # ❌ ABSOLUMENT INTERDIT

# 4. Push de migration sans review
git push origin main  # ❌ Sans PR

# 5. Oublier RLS sur une nouvelle table
CREATE TABLE new_table (...);  # ❌ Sans ENABLE ROW LEVEL SECURITY
```

---

## ✅ Bonnes Pratiques

### RLS Toujours Actif
```sql
-- TOUJOURS activer RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Jamais de politique "allow all"
-- ❌ CREATE POLICY "allow_all" ON table FOR ALL USING (true);

-- ✅ Toujours restreindre
CREATE POLICY "Users can access own data" 
    ON table FOR SELECT 
    USING (user_id = auth.uid());
```

### Migrations Idempotentes
```sql
-- Utiliser IF EXISTS / IF NOT EXISTS
DROP TABLE IF EXISTS temp_table;
CREATE TABLE IF NOT EXISTS new_table (...);
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

### Commentaires
```sql
-- Commenter les objets importants
COMMENT ON TABLE drivers IS 'Profils chauffeurs avec validation workflow';
COMMENT ON COLUMN drivers.status IS 'pending_validation | active | inactive | on_vacation | suspended | incomplete | draft | rejected | pending_review';
```

---

## 🔍 Checklist Avant PR

- [ ] Migration testée avec `supabase db reset`
- [ ] Types TypeScript générés et compilables
- [ ] RLS activé sur les nouvelles tables
- [ ] Indexes créés sur les colonnes filtrées/jointes
- [ ] Contraintes de validation définies
- [ ] Documentation mise à jour (si schéma majeur)
- [ ] Pas de données sensibles en dur dans la migration

---

## 🆘 Résolution de Problèmes

### Migration en Échec
```bash
# Voir l'état des migrations
supabase migration list

# Reprendre une migration bloquée
supabase db push --include-all

# Reset complet (perte de données!)
supabase db reset
```

### Conflit de Schéma
```bash
# Pull les dernières migrations
git pull origin main

# Vérifier les conflits
git diff supabase/migrations/

# Résoudre manuellement si nécessaire
# Puis recréer les types
supabase gen types typescript --linked --schema public > src/lib/types/database.types.ts
```

### Rollback d'une Migration
```bash
# Créer une migration de rollback
supabase migration new rollback_ajout_x

# Dans le fichier SQL:
DROP TABLE IF EXISTS table_creee;
DROP FUNCTION IF EXISTS fonction_creee;
```

---

## 📊 Commandes Utiles

```bash
# Statut du projet
supabase status

# Lister les migrations
supabase migration list

# Dump du schéma
supabase db dump --project-ref ioddsdzustunlahxafif > schema_backup.sql

# Diff entre local et remote
supabase db diff

# Seeding (données de test)
supabase db seed
```

---

## 📚 Ressources

- [Documentation Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Référence du schéma
- [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md) - Système de rôles

---

**Rappel:** Le fichier `init.sql.sql` est sacré. Il représente l'état initial de la base.  
Toute évolution passe par les migrations incrémentielles.
