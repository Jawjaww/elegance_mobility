# Scripts Utilitaires

Ce dossier contient les scripts utilitaires pour la gestion de l'application.

## Installation

```bash
npm install
```

## Configuration

1. Copier le fichier d'exemple :
```bash
cp .env.example .env
```

2. Remplir les variables dans `.env` :
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role Supabase

## Scripts Disponibles

### Création d'un Super Admin

Crée un compte administrateur avec tous les droits :

```bash
npm run create-admin
```

Le script :
- Crée un utilisateur dans auth.users
- L'ajoute à la table admins avec le niveau 'super'
- Configure les politiques RLS correspondantes

### Réinitialisation de la Base

Réinitialise la base de données à son état initial :

```bash
npm run reset-db
```

⚠️ **ATTENTION** : Cette commande supprime toutes les données existantes.

## Développement

Pour ajouter un nouveau script :

1. Créer le fichier `.js` dans ce dossier
2. Ajouter la commande dans `package.json`
3. Documenter le script dans ce README

## Dépendances

- @supabase/supabase-js : Client Supabase
- dotenv : Gestion des variables d'environnement
- ora : Animations console
- prompts : Interface interactive
- argon2 : Hachage de mots de passe (optionnel)
- uuid : Génération d'identifiants uniques

Pour plus d'informations sur la configuration de la base de données, voir la [documentation principale](/docs/architecture/database.md).
