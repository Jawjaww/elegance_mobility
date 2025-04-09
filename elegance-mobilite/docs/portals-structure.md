# Architecture des Portails

## Vue d'Ensemble

L'application est divisée en trois portails distincts :

```
src/app/
├── (client-portal)/     # Portail client public et authentifié
├── driver-portal/      # Portail chauffeur (authentifié)
└── backoffice-portal/ # Portail administratif (authentifié)
```

## Points d'Entrée

- **Client** : `/` (racine du site)
- **Chauffeur** : `/driver-portal`
- **Backoffice** : `/backoffice-portal`

## Navigation Inter-Portails

### Points de Connexion
- Page de connexion partagée : `/login`
- Authentification commune avec redirection selon le rôle
- Déconnexion unifiée : `/auth/logout`

### Redirection Automatique
- Non authentifié → Portail client
- app_customer → Portail client
- app_driver → Portail chauffeur
- app_admin/super_admin → Portail backoffice

## Structure des Headers

Chaque portail a son propre système de navigation :

### Client Portal
```tsx
<HeaderClient />   # Navigation publique + menu client
```

### Driver Portal
```tsx
<HeaderDriver />   # Navigation spécifique chauffeur
```

### Backoffice Portal
```tsx
<HeaderAdmin />    # Navigation administrative complète
```

## Conventions de Nommage

- Composants : `[Portail][Type]`
  - Exemple : `ClientHeader`, `DriverNav`, `AdminSidebar`
- Routes : `[portail]/[ressource]`
  - Exemple : `/driver-portal/rides`, `/backoffice-portal/dashboard`
- Layouts : `[Portail]Layout`
  - Exemple : `ClientPortalLayout`, `DriverPortalLayout`

## Séparation des Responsabilités

Chaque portail :
- A son propre layout racine
- Gère sa propre navigation
- Maintient son état d'authentification
- Définit ses propres routes protégées

## Composants Partagés

Les composants partagés sont dans :
```
src/components/
├── ui/           # Composants UI de base
├── forms/        # Formulaires réutilisables
└── common/       # Composants métier partagés
```

## Maintenance

Pour chaque portail :
1. Documenter les changements dans le README correspondant
2. Respecter les conventions de nommage
3. Maintenir la séparation des responsabilités
4. Utiliser les composants partagés quand possible