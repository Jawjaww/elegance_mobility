# Client Portal

Ce répertoire contient toutes les pages et composants spécifiques au portail client.

## Structure

```
(client-portal)/
├── layout.tsx           # Layout racine avec header client
├── my-account/         # Pages compte utilisateur
├── reservation/        # Pages réservation
└── services/          # Pages services
```

## Navigation

La navigation est gérée par le HeaderClient qui inclut :
- Menu principal desktop
- Avatar utilisateur avec initiales
- Menu mobile adaptatif
- États connecté/déconnecté

## Routes

- `/` - Page d'accueil
- `/services` - Services disponibles
- `/contact` - Page de contact
- `/reservation` - Formulaire de réservation
- `/my-account/*` - Pages compte client
  - `/my-account/profile` - Profil
  - `/my-account/reservations` - Liste des réservations

## Authentification

- Accès public pour les pages principales
- Authentification requise pour :
  - `/my-account/*`
  - `/reservation`

## Composants Partagés

Les composants sont situés dans :
```
src/components/layout/
├── HeaderClient.tsx    # Navigation principale
└── header/
    └── ClientSideUserMenu.tsx  # Menu utilisateur