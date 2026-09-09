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
- Authentification requise pour `/my-account/*`
- **Portail client** : `app_customer`, `app_driver` (droits client inclus), `app_admin`, `app_super_admin`
  - Helper frontend : `canAccessClientPortal()` dans `src/lib/utils/roles.ts`
  - Garde pages : `canUserAccessClientPortal()` dans `src/lib/auth/client-portal-access.ts`
- Un chauffeur (`app_driver`) peut réserver et gérer son compte client **en plus** du portail `/driver-portal/*`
- Login avec session active : `redirectTo` est respecté (ex. `/my-account/reservations` ne renvoie plus silencieusement vers le dashboard chauffeur)

## Composants Partagés

Les composants sont situés dans :
```
src/components/layout/
├── HeaderClient.tsx    # Navigation principale
└── header/
    └── ClientSideUserMenu.tsx  # Menu utilisateur