# Driver Portal

Ce répertoire contient les pages et composants spécifiques au portail chauffeur.

## Structure

```
driver-portal/
├── layout.tsx           # Layout racine avec header chauffeur
├── rides/              # Gestion des courses
├── profile/           # Profil chauffeur
└── history/          # Historique des courses
```

## Navigation

La navigation est gérée par deux composants :
- HeaderDriver : Navigation principale et profil
- MobileDriverNav : Navigation mobile adaptée aux chauffeurs

## Routes

- `/driver-portal` - Dashboard chauffeur
- `/driver-portal/rides` - Courses actives
- `/driver-portal/rides/:id` - Détails course
- `/driver-portal/history` - Historique des courses
- `/driver-portal/profile` - Profil chauffeur

## Authentification

- Authentification requise pour toutes les routes
- Rôle requis : app_driver
- Redirection vers /login si non connecté

## Composants Spécifiques

Les composants sont situés dans :
```
src/components/
├── layout/
│   ├── HeaderDriver.tsx
│   └── MobileDriverNav.tsx
└── driver/
    ├── RideCard.tsx
    └── StatusUpdater.tsx
```

## Fonctionnalités

- Vue en temps réel des courses assignées
- Mise à jour du statut des courses
- Gestion du profil chauffeur
- Historique des courses effectuées
- Navigation adaptée au contexte chauffeur