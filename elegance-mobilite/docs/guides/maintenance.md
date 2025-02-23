# Guide de maintenance

## Maintenance préventive

### 1. Vérifications quotidiennes

```bash
# Vérification des logs d'application
pm2 logs elegance-mobilite

# Vérification de la base de données
psql -d elegance_mobilite -c "SELECT now() - pg_last_vacuum_time as last_vacuum_time FROM pg_stat_all_tables WHERE schemaname = 'public';"

# Monitoring des performances
curl -s http://localhost:3000/api/health
```

### 2. Vérifications hebdomadaires

#### Base de données
```sql
-- Analyse des tables volumineuses
SELECT schemaname, relname, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;

-- Index inutilisés
SELECT * FROM pg_stat_user_indexes 
WHERE idx_scan = 0;
```

#### Sécurité
```bash
# Vérification des dépendances
npm audit

# Scan de sécurité
snyk test

# Revue des accès
supabase projects list-access-logs
```

### 3. Vérifications mensuelles

#### Nettoyage
```sql
-- Suppression des sessions expirées
DELETE FROM auth.sessions 
WHERE not_after < NOW() - INTERVAL '30 days';

-- Archive des anciennes courses
INSERT INTO rides_archive 
SELECT * FROM rides 
WHERE created_at < NOW() - INTERVAL '6 months';
```

#### Optimisation
```sql
-- Vacuum analyse
VACUUM ANALYZE;

-- Réindexation
REINDEX DATABASE elegance_mobilite;
```

## Maintenance corrective

### 1. Gestion des incidents

#### Niveau 1 : Problèmes mineurs
- Temps de réponse : < 4h
- Impact : Fonctionnalité non critique
```bash
# Vérification rapide
pm2 restart elegance-mobilite
curl -s http://localhost:3000/api/health
```

#### Niveau 2 : Problèmes majeurs
- Temps de réponse : < 1h
- Impact : Fonctionnalité critique
```bash
# Rollback rapide
git reset --hard HEAD~1
npm run build && pm2 restart elegance-mobilite
```

#### Niveau 3 : Urgence
- Temps de réponse : < 15min
- Impact : Service inaccessible
```bash
# Activation du mode maintenance
mv .env.backup .env.maintenance
pm2 restart elegance-mobilite --env maintenance
```

### 2. Procédures de restauration

#### Base de données
```bash
# Restauration complète
pg_restore -d elegance_mobilite backup.dump

# Restauration sélective
psql -d elegance_mobilite -f table_backup.sql
```

#### Application
```bash
# Restauration du code
git checkout stable-tag
npm ci && npm run build
pm2 reload elegance-mobilite

# Vérification post-restauration
curl -s http://localhost:3000/api/health
```

## Maintenance évolutive

### 1. Gestion des mises à jour

```bash
# Dépendances
npm update
npm audit fix

# Node.js
nvm install lts/* --reinstall-packages-from=current
```

### 2. Optimisation des performances

```typescript
// Exemple de monitoring
const monitor = {
  checkPerformance: async () => {
    const metrics = await collectMetrics();
    if (metrics.responseTime > threshold) {
      notifyTeam('Performance dégradée');
    }
  }
};
```

## Outils de maintenance

### 1. Scripts utilitaires

```bash
#!/bin/bash
# maintenance.sh

case $1 in
  "backup")
    ./scripts/backup_db.sh
    ;;
  "clean")
    ./scripts/clean_logs.sh
    ;;
  "monitor")
    ./scripts/check_health.sh
    ;;
esac
```

### 2. Tableaux de bord

- Vercel Analytics : Performance frontend
- Supabase Dashboard : Santé de la BDD
- Custom Dashboard : Métriques métier

## Documentation

### 1. Logs à conserver

- Logs d'application : 30 jours
- Logs d'accès : 90 jours
- Logs de sécurité : 1 an
- Métriques : 2 ans

### 2. Rapports

```typescript
// Exemple de rapport hebdomadaire
interface MaintenanceReport {
  uptime: number;
  performance: Metrics;
  incidents: Incident[];
  recommendations: string[];
}
```

## Contacts d'urgence

### Équipe technique
- Lead Dev : +33 6 XX XX XX XX
- DBA : +33 6 XX XX XX XX
- DevOps : +33 6 XX XX XX XX

### Prestataires
- Supabase Support : support@supabase.io
- Vercel Support : support@vercel.com

## Annexes

### Check-lists

#### Quotidienne
- [ ] Vérification des logs
- [ ] Monitoring des performances
- [ ] Vérification des backups

#### Hebdomadaire
- [ ] Analyse des métriques
- [ ] Scan de sécurité
- [ ] Nettoyage des données temporaires

#### Mensuelle
- [ ] Optimisation de la base de données
- [ ] Revue des accès
- [ ] Mise à jour des dépendances
