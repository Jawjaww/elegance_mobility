# Migrations Base de Données

## Structure actuelle des migrations

Les migrations sont maintenant organisées en 4 fichiers principaux :

1. `20250225_00_init_schema.sql`
   - Schéma initial complet de la base de données
   - Tables : users, vehicles, drivers, rides, etc.
   - Types énumérés et fonctions de base

2. `20250225_01_promotions.sql`
   - Système de promotions et réductions
   - Tables : promo_codes, promo_usages, corporate_discounts, etc.
   - Fonctions de validation des promotions

3. `20250225_02_policies.sql`
   - Politiques de sécurité Row Level Security
   - Accès par rôle utilisateur
   - Protection des données sensibles

4. `20250226_03_setup_admin_policies.sql`
   - Politiques spécifiques aux administrateurs
   - Permissions étendues pour la gestion
   - Fonctions admin

5  `20250226_04_user_management_functions.sql`
   - Fonctions supplémentaires pour la gestion des utilisateurs




## Exécution

Les migrations doivent être exécutées dans l'ordre :

```bash
psql -f migrations/20250225_01_init_schema.sql
psql -f migrations/20250225_02_promotions.sql
psql -f migrations/20250225_03_policies.sql
psql -f migrations/20250226_01_setup_admin_policies.sql
```

## Maintenance

Pour ajouter une nouvelle migration :

1. Créer un fichier avec le format : `YYYYMMDD_XX_description.sql`
2. Documenter les changements dans ce README
3. Mettre à jour la documentation dans `/docs/architecture/database.md`

## Vérification

Après toute migration :
```bash
psql -f ../verify_database.sql
```

Pour plus de détails sur la structure : voir `/docs/architecture/database.md`
