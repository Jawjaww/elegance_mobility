# Élégance Mobilité - Documentation

## Vue d'ensemble
Cette documentation couvre l'ensemble du système de réservation VTC Élégance Mobilité, une application Next.js avec Supabase.

## Table des matières

### 🏗 Architecture
- [Vue d'ensemble du système](./architecture/system-overview.md)
- [Architecture de la base de données](./architecture/database.md)
- [Système d'authentification](./architecture/authentication.md)

### 📚 Guides
- [Guide d'installation](./guides/setup.md)
- [Guide de déploiement](./guides/deployment.md)
- [Guide de maintenance](./guides/maintenance.md)

### 🛠 API
- [Points d'entrée API](./api/endpoints.md)
- [Modèles de données](./api/models.md)

### 💾 Base de données
- [Migrations](./database/migrations/README.md)
- [Schémas](./database/schemas/README.md)

### ⚡ Fonctionnalités
- [Système de courses](./features/rides/README.md)
- [Gestion des chauffeurs](./features/drivers/README.md)
- [Système de tarification](./features/rates/README.md)

## Stack technique

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth)
- **Cartographie**: Leaflet
- **UI**: Radix UI, Shadcn
- **État**: Zustand
- **Tests**: Jest, Testing Library

## Commandes principales

```bash
# Installation
npm install

# Développement
npm run dev

# Build
npm run build

# Tests
npm run test

# Linting
npm run lint
```

## Structure du projet

```
elegance-mobilite/
├── src/
│   ├── app/          # Routes Next.js
│   ├── components/   # Composants React
│   ├── lib/         # Utilitaires et services
│   ├── hooks/       # Custom hooks
│   └── styles/      # Styles globaux
├── public/          # Assets statiques
├── database/        # Migrations et scripts SQL
└── docs/           # Documentation
```

## Contribution

1. Créez une branche pour votre fonctionnalité
2. Commitez vos changements
3. Soumettez une pull request
4. Assurez-vous que les tests passent

## Liens utiles

- [Tableau Jira](https://elegance-mobilite.atlassian.net)
- [Repo GitHub](https://github.com/elegance-mobilite)
- [Documentation API](https://api.elegance-mobilite.com/docs)
- [Environnement de staging](https://staging.elegance-mobilite.com)
