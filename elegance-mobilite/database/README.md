# Base de données Vector Elegans

## Structure

La structure complète de la base de données est définie dans les fichiers de migration SQL sous `/migrations`. La documentation détaillée est disponible dans [/docs/architecture/database.md](/docs/architecture/database.md).

## Migrations

Les migrations sont exécutées dans l'ordre suivant :

1. `20250225_01_init_schema.sql` : Schéma initial
2. `20250225_02_promotions.sql` : Système de promotions
3. `20250225_03_policies.sql` : Politiques de sécurité
4. `20250226_01_setup_admin_policies.sql` : Politiques admin

## Scripts utilitaires

Retrouvez les scripts de maintenance dans le dossier `/scripts` :
- `resetDatabase.js` : Réinitialisation complète
- `createAdmin.js` : Création compte admin

## Types TypeScript

Les types TypeScript correspondant à la structure de la base de données sont maintenus dans `src/lib/database.types.ts`.
