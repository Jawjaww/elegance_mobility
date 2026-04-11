# 🧪 Local Testing Guide

Guide pour tester les migrations Supabase localement avant de push en production.

## Installation

```bash
# Installer Supabase CLI
brew install supabase/tap/supabase  # macOS
# ou
npm install -g supabase              # npm

# Se connecter
supabase login
```

## Démarrer la base locale

```bash
# Dans le projet
cd elegance-mobilite

# Lancer Supabase local
supabase start

# Voir le status
supabase status
```

## Tester les migrations

```bash
# Reset la base locale (recrée tout depuis zéro)
supabase db reset

# Push les migrations
supabase db push

# Voir les logs
supabase db logs
```

## Workflow recommandé

1. **Créer la migration**
   ```bash
   supabase migration new ma_migration
   ```

2. **Éditer** `supabase/migrations/XXXXXXXXXX_ma_migration.sql`

3. **Tester localement**
   ```bash
   supabase db reset
   ```

4. **Vérifier que ça fonctionne** via l'interface:
   - Studio: http://localhost:54323
   - SQL Editor: Tester les requêtes

5. **Push sur production**
   ```bash
   supabase db push
   ```

## Variables d'environnement

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Différence prod/local

| Fonctionnalité | Local | Production |
|----------------|-------|------------|
| Auth | ✅ | ✅ |
| Storage | ✅ | ✅ |
| Realtime | ✅ | ✅ |
| Edge Functions | ✅ | ✅ |

## Troubleshooting

### Port déjà utilisé
```bash
supabase stop
supabase start
```

### Reset complet
```bash
supabase stop --no-backup
supabase start
```

### Voir les logs
```bash
docker ps  # voir les containers
supabase db logs
supabase auth logs
```
