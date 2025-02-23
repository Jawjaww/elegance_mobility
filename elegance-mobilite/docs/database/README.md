# Configuration de la Base de Données Elegance Mobilité

## Structure

La base de données est composée des tables suivantes :

- `vehicles` : Gestion des véhicules
- `drivers` : Informations sur les chauffeurs
- `rides` : Gestion des courses
- `options` : Options additionnelles pour les courses
- `rates` : Tarifs par type de véhicule
- `users` : Utilisateurs du système

## Installation

1. Ouvrir l'éditeur SQL de Supabase
2. Exécuter les scripts dans l'ordre suivant :

```sql
-- 1. Configuration initiale de la base de données
./migrations/20250221_setup_database.sql

-- 2. Création de l'utilisateur administrateur
./migrations/20250221_create_admin_user.sql

-- 3. Vérification de l'installation
./verify_database.sql
```

## Identifiants Administrateur

- Email : admin@elegance-mobilite.fr
- Mot de passe initial : admin123

⚠️ **Important** : Changez le mot de passe administrateur après la première connexion.

## Types Énumérés

Les types énumérés suivants sont utilisés :

- `vehicle_type_enum` : STANDARD, PREMIUM, ELECTRIC, VAN
- `driver_status` : active, inactive
- `ride_status` : pending, confirmed, cancelled

## Relations

- Les chauffeurs (`drivers`) peuvent être associés à un véhicule (`vehicles`)
- Les courses (`rides`) sont liées à un chauffeur (`drivers`) et peuvent avoir un véhicule spécifique (`override_vehicle_id`)
- Les tarifs (`rates`) sont définis par type de véhicule

## Sécurité

- Row Level Security (RLS) est activé sur toutes les tables
- L'administrateur a un accès complet à toutes les tables
- Des politiques de sécurité spécifiques sont définies pour chaque rôle

## Maintenance

Les triggers suivants sont en place :

- `update_updated_at_column` : Met à jour automatiquement le champ `updated_at` lors des modifications

## Vérification

Le script `verify_database.sql` effectue les vérifications suivantes :

- Présence de tous les types énumérés requis
- Existence des tables et de leur structure
- Validité des contraintes de clés étrangères
- Présence des triggers
- Existence des données initiales (tarifs et options)
- Configuration de l'utilisateur administrateur

## Extensions PostgreSQL Requises

- `uuid-ossp` : Pour la génération d'UUID
- `pgcrypto` : Pour le hachage des mots de passe

## Support

En cas de problème avec la base de données :

1. Exécuter le script de vérification pour identifier les problèmes potentiels
2. Vérifier les logs Supabase pour plus de détails
3. Si nécessaire, réexécuter les scripts de migration dans l'ordre