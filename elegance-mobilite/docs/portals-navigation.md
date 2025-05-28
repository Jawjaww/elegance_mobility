# Architecture de Navigation par Portail

## Structure des Portails

Nous avons 4 portails distincts avec leurs propres besoins de navigation :

### 1. Public Portal (/(public-portal))
- Complètement public
- Réservation de courses
- Landing pages
- Contact et informations

### 2. Client Portal (/(client-portal))
- Authentifié uniquement (app_customer)
- Gestion des réservations
- Historique des courses
- Profil utilisateur
- Menu mobile pour accessibilité
- Avatar utilisateur avec initiales

### 3. Driver Portal (/driver-portal)
- Authentifié uniquement (app_driver)
- Navigation spécifique aux chauffeurs
- Interface de gestion des courses
- Menu mobile adapté aux chauffeurs

### 4. Backoffice Portal (/backoffice-portal)
- Authentifié uniquement (app_admin, app_super_admin)
- Navigation administrative complète
- Tableau de bord et gestion

## Organisation des Headers

### Implémentation
```
src/
└── app/
    ├── (public-portal)/
    │   ├── layout.tsx         # Utilise PublicHeader
    │   └── ...
    ├── (client-portal)/
    │   ├── layout.tsx         # Utilise ClientHeader avec authentification
    │   └── ...
    ├── driver-portal/
    │   ├── layout.tsx         # Utilise DriverHeader avec authentification
    │   └── ...
    └── backoffice-portal/
        ├── layout.tsx         # Utilise AdminHeader avec authentification
        └── ...
```

### Connexion avec les Layouts

Chaque portail a son layout à la racine qui :
1. Gère l'authentification si nécessaire (sauf portail public)
2. Charge la configuration de navigation appropriée
3. Fournit le contexte nécessaire au header

## Avantages de cette Architecture

1. Séparation Claire des Responsabilités
   - Portail public distinct des fonctionnalités authentifiées
   - Chaque portail gère sa propre navigation
   - Configuration isolée par type d'utilisateur
   - Pas de mélange de logiques métier

2. Maintien et Évolutivité
   - Modifications faciles par portail
   - Ajout de fonctionnalités sans impact sur les autres portails
   - Tests isolés par contexte

3. Sécurité et Contrôle d'Accès
   - Accès public clairement délimité
   - Vérification des rôles au niveau du layout pour les zones protégées
   - Navigation adaptée aux permissions
   - Pas d'accès accidentel aux fonctionnalités protégées

## Bonnes Pratiques

1. Maintenir une séparation stricte entre contenu public et authentifié
2. Centraliser la logique d'authentification dans les layouts
3. Adapter la navigation selon le contexte utilisateur
4. Utiliser les guards pour la protection des routes authentifiées