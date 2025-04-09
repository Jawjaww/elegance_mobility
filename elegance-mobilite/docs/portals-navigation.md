# Architecture de Navigation par Portail

## Structure des Portails

Nous avons 3 portails distincts avec leurs propres besoins de navigation :

### 1. Client Portal (/(client-portal))
- Public + Authentifié
- Navigation client avec réservation
- Menu mobile pour accessibilité
- Avatar utilisateur avec initiales

### 2. Driver Portal (/driver-portal)
- Authentifié uniquement (app_driver)
- Navigation spécifique aux chauffeurs
- Interface de gestion des courses
- Menu mobile adapté aux chauffeurs

### 3. Backoffice Portal (/backoffice-portal)
- Authentifié uniquement (app_admin, app_super_admin)
- Navigation administrative complète
- Tableau de bord et gestion

## Organisation des Headers

### Implémentation
```
src/
└── app/
    ├── (client-portal)/
    │   ├── layout.tsx         # Utilise PortalHeader avec clientConfig
    │   └── ...
    ├── driver-portal/
    │   ├── layout.tsx         # Utilise PortalHeader avec driverConfig
    │   └── ...
    └── backoffice-portal/
        ├── layout.tsx         # Utilise PortalHeader avec adminConfig
        └── ...
```

### Connexion avec les Layouts

Chaque portail aura son layout à la racine qui :
1. Gère l'authentification spécifique au portail
2. Charge la configuration de navigation appropriée
3. Fournit le contexte nécessaire au header

## Avantages de cette Architecture

1. Séparation Claire des Responsabilités
   - Chaque portail gère sa propre navigation
   - Configuration isolée par type d'utilisateur
   - Pas de mélange de logiques métier

2. Maintien et Évolutivité
   - Modifications faciles par portail
   - Ajout de fonctionnalités sans impact sur les autres portails
   - Tests isolés par contexte

3. Sécurité et Contrôle d'Accès
   - Vérification des rôles au niveau du layout
   - Navigation adaptée aux permissions
   - Pas d'accès accidentel aux fonctionnalités

## Prochaines Étapes

1. Audit des composants de navigation existants
2. Création des configurations par portail
3. Mise en place des layouts avec leurs headers respectifs
4. Tests de navigation par rôle utilisateur