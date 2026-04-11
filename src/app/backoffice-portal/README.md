# Backoffice Portal

Ce répertoire contient les pages et composants du portail administratif.

## Structure

```
backoffice-portal/
├── layout.tsx           # Layout racine avec header admin
├── dashboard/          # Dashboard principal
├── rides/             # Gestion des courses
├── drivers/          # Gestion des chauffeurs
├── vehicles/        # Gestion des véhicules
└── settings/       # Paramètres système
```

## Navigation

Composants de navigation :
- HeaderAdmin : Navigation principale avec niveau d'accès
- MobileAdminNav : Menu mobile pour administrateurs
- AdminSidebar : Navigation latérale complète

## Routes

### Gestion Générale
- `/backoffice-portal` - Dashboard
- `/backoffice-portal/rides` - Liste des courses
- `/backoffice-portal/rides/:id` - Détails course
- `/backoffice-portal/rides/:id/assign` - Attribution chauffeur

### Gestion des Ressources
- `/backoffice-portal/drivers` - Gestion chauffeurs
- `/backoffice-portal/vehicles` - Gestion véhicules
- `/backoffice-portal/customers` - Gestion clients

### Administration
- `/backoffice-portal/settings` - Paramètres système
- `/backoffice-portal/logs` - Journaux système
- `/backoffice-portal/analytics` - Analyses

## Niveaux d'Accès

### app_admin
- Accès au dashboard
- Gestion des courses
- Gestion des chauffeurs
- Gestion des véhicules
- Vue des statistiques

### app_super_admin
Tout ce qui précède, plus :
- Gestion des administrateurs
- Configuration système
- Accès aux journaux
- Gestion des rôles

## Composants Spécifiques

```
src/components/
├── layout/
│   ├── HeaderAdmin.tsx
│   ├── AdminSidebar.tsx
│   └── MobileAdminNav.tsx
└── admin/
    ├── DashboardStats.tsx
    ├── RideManager.tsx
    └── UserManager.tsx
```

## Sécurité

- Authentification obligatoire
- Vérification des rôles à chaque route
- Journalisation des actions
- Protection des routes sensibles