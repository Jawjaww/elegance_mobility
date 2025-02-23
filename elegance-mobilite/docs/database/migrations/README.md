# Migrations de base de données

Ce dossier contient toutes les migrations de la base de données PostgreSQL/Supabase.

## Structure des fichiers

Les fichiers de migration suivent la convention de nommage :
```
YYYYMMDD_description_courte.sql
```

## Migrations principales

- `20250223_clean_and_setup_database.sql` : Structure initiale de la base
- `20250223_create_initial_users.sql` : Utilisateurs initiaux
- `20250223_create_promotions_tables.sql` : Système de promotions

## Ordre d'exécution

1. Structure de base :
```bash
psql -d elegance_mobilite -f 20250223_clean_and_setup_database.sql
```

2. Données initiales :
```bash
psql -d elegance_mobilite -f 20250223_create_initial_users.sql
```

3. Modules additionnels :
```bash
psql -d elegance_mobilite -f 20250223_create_promotions_tables.sql
```

## Vérification

Pour vérifier l'état de la base après migration :
```bash
psql -d elegance_mobilite -f ../tests/verify_migration.sql
```

## Documentation connexe

- [Guide de déploiement](../../guides/deployment.md)
- [Architecture de la base de données](../../architecture/database.md)
