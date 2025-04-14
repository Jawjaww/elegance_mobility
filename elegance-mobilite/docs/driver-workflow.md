# Processus d'Inscription et Validation des Chauffeurs

## Vue d'ensemble

Le processus d'inscription et de validation des chauffeurs se déroule en plusieurs étapes avec différents statuts et rôles.

### 1. Inscription du Chauffeur (/auth/signup/driver)

- Formulaire complet avec validation Zod
- Champs obligatoires :
  - Informations personnelles (nom, prénom, email)
  - Numéro de carte VTC et date d'expiration
  - Numéro de permis et date d'expiration
- Champs optionnels :
  - Informations d'assurance
  - Préférences (zones, langues)

### 2. Création du Compte

- Création de l'utilisateur dans auth.users
- Attribution initiale du portal_type "driver"
- Statut initial "pending_validation" dans la table drivers
- Envoi d'email de confirmation

### 3. Validation Administrative

- Interface admin pour examiner les demandes
- Vérification des documents et informations
- Actions possibles :
  - Approbation : statut -> "active", rôle -> "app_driver"
  - Rejet : statut -> "inactive" avec raison

## Statuts Possibles (driver_status)

- `inactive` : Compte créé mais non actif
- `pending_validation` : En attente de validation administrative
- `active` : Chauffeur validé et actif
- `suspended` : Compte temporairement suspendu

## Sécurité et Permissions

### Politiques RLS

1. Lecture (SELECT)
```sql
auth.uid() = user_id OR
auth.role() IN ('app_admin', 'app_super_admin')
```

2. Insertion (INSERT)
```sql
auth.uid() = user_id AND
status = 'pending_validation'
```

3. Mise à jour (UPDATE)
- Admins : Peuvent tout modifier
- Chauffeurs : Peuvent modifier leurs informations sauf le statut

### Fonctions RPC

1. `create_pending_driver`
- Crée le profil chauffeur
- Vérifie les contraintes
- Sécurisée par SECURITY DEFINER

2. `validate_driver`
- Réservée aux administrateurs
- Gère l'approbation/rejet
- Met à jour le statut et le rôle

## Contraintes de Validation

```sql
- proper_phone : Numéro de téléphone valide
- future_vtc_expiry : Date d'expiration VTC future
- future_license_expiry : Date d'expiration permis future
- future_insurance_expiry : Date d'expiration assurance future (si fournie)
- required_fields : Vérification des champs obligatoires
```

## Notifications

Un système de notifications est implémenté via des triggers pour :
- Confirmation d'inscription
- Résultat de la validation
- Changements de statut

## Interface Utilisateur

1. Formulaire d'inscription (/auth/signup/driver)
- Validation côté client avec Zod
- Gestion des erreurs
- Retours visuels

2. Page d'attente (/driver-portal/pending)
- Affichage du statut
- Instructions
- Contacts support

## Notes Techniques

- Utiliser les fonctions RPC pour les opérations critiques
- Vérifier les dates d'expiration avant validation
- Maintenir les métadonnées utilisateur à jour
- Gérer les erreurs de manière appropriée