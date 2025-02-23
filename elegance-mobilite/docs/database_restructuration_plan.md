# Plan de restructuration de la base de données et adaptations du backoffice

## Introduction
Ce document présente le plan détaillé pour repenser le schéma de la base de données existante ainsi que pour adapter le backoffice et le meta-editor afin de corriger les erreurs de typage signalées. L’objectif principal est de permettre une gestion flexible des véhicules et des attributions, en supportant à la fois un véhicule attitré par défaut et la possibilité de modifier ce véhicule en cas d'exception ou pour une période donnée.

## Objectifs
- Mettre en place une nouvelle table dédiée aux véhicules pour gérer les plaques d'immatriculation et autres informations spécifiques.
- Modifier les tables existantes (drivers, rates, rides) afin de retirer les informations redondantes et introduire des relations vers la nouvelle table `vehicles` lorsque nécessaire.
- Offrir une flexibilité permettant à un chauffeur d’avoir un véhicule attitré par défaut, tout en autorisant une modification ponctuelle ou temporaire de ce véhicule lors d'une course.
- Corriger les erreurs de typage dans le backoffice et le meta-editor, notamment celles liées aux propriétés `minimum_fare`, `size`, `variant` et aux événements dans `rates-grid`.

## 1. Repenser le schéma de la base de données

### 1.1 Création de la table `vehicles`
- **Champs proposés** :
  - `id` (clé primaire, integer ou UUID)
  - `license_plate` (string, plaque d'immatriculation)
  - `vehicle_type` (string)
  - `vehicle_model` (string)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- **Justification** : Séparer la gestion des informations spécifiques au véhicule permet de gérer les véhicules non attitrés et attitrés de manière flexible.

### 1.2 Modification de la table `drivers`
- **Changements** :
  - Supprimer les champs redondants liés au véhicule (`vehicle_type`, `vehicle_model` et `vehicle_plate`).
  - Ajouter un champ optionnel `vehicle_id` référant le véhicule attitré par défaut.
- **Impact** : Permet aux chauffeurs d'avoir un véhicule par défaut automatiquement attribué sans intervention manuelle à chaque course.

### 1.3 Vérification des tables `rates` et `rides`
- **Rates** : S’assurer que les colonnes de tarification (prix au km, tarif de base, etc.) restent cohérentes après migration.
- **Rides** : Intégrer une flexibilité pour l’attribution de véhicule :
  - Garder la possibilité d’assigner manuellement un véhicule pour une course spécifique, indépendamment du véhicule par défaut du chauffeur.
  - Ajouter éventuellement un champ `override_vehicle_id` dans `rides` pour indiquer une modification temporaire du véhicule attitré.

### 1.4 Flexibilité dans l'attribution des véhicules
- **Exigences** :
  - Permettre au chauffeur d'avoir un véhicule attitré par défaut (via `vehicle_id` dans `drivers`).
  - Autoriser la modification ponctuelle pour une course en particulier en ajoutant un champ optionnel (ex: `override_vehicle_id`) dans la table `rides`. Ce champ prévaudra lors de la création d'une course.
  - Assurer que la logistique du backoffice et du meta-editor puisse gérer ces deux cas de figure, avec une interface permettant de choisir ou modifier le véhicule de façon intuitive.

## 2. Migration et gestion des données
- **Étapes de migration** :
  1. Analyser et extraire les données existantes liées aux véhicules.
  2. Créer la nouvelle table `vehicles`.
  3. Mettre à jour la table `drivers` en ajoutant le champ `vehicle_id` et en transférant, si possible, les informations existantes.
  4. Mettre à jour la table `rides` en ajoutant le champ `override_vehicle_id` pour gérer les cas exceptionnels.
  5. Valider la cohérence des relations après migration.

## 3. Adaptations du backoffice et du meta-editor

### 3.1 Corrections de typage dans le meta-editor
- **Erreur "minimum_fare"** : Vérifier dans le fichier `metadata-editor.tsx` si l’on utilise une propriété inexistante sur le type `FieldError` et ajuster le typage.
- **Adaptation des tailles des boutons** : Remplacer ou étendre le type de `size` pour accepter les valeurs utilisées dans l’interface, notamment `"xs"`.

### 3.2 Corrections dans les composants UI
- **`Badge` dans le fichier `rate-card.tsx`** :
  - Adapter la valeur de `variant` pour inclure `"outline"` ou modifier son usage en faveur d'une valeur compatible.
- **`RatesGridProps` dans `rates-grid.tsx`** :
  - Ajuster la signature de la méthode `onSelect` pour qu’elle respecte le type d'événement attendu et éviter les incompatibilités de type.
- **Typages génériques dans `data-table.tsx`** :
  - Installer ou déclarer les types manquants du module `@tanstack/react-table`.
  - Ajouter des types explicites pour éviter les éventuelles erreurs implicites.

### 3.3 Processus itératif de mise à jour
- Procéder par étapes pour chaque modification fonctionnelle.
- Mettre à jour le document de planification (`database_restructuration_plan.md`) après chaque étape terminée et livrable fonctionnel.
- Valider chaque phase par des tests unitaires et de régression.

## 4. Plan d'implémentation et de tests
1. **Phase 1 : Migration initiale**
   - Implémenter la création de la table `vehicles` et la modification de la table `drivers` avec le champ `vehicle_id`.
   - Documenter et tester la migration.
2. **Phase 2 : Flexibilité d'attribution des véhicules**
   - Ajouter le champ `override_vehicle_id` dans `rides`.
   - Adapter la logique backoffice pour permettre la modification ponctuelle du véhicule pour une course.
3. **Phase 3 : Mise à jour du backoffice et des interfaces**
   - Corriger les problèmes de typage dans le meta-editor et les composants UI (`rate-card.tsx`, `rates-grid.tsx`, `data-table.tsx`).
   - Valider via des tests fonctionnels et unitaires.
4. **Phase 4 : Documentation et validation finale**
   - Mettre à jour la documentation technique avec le nouveau schéma.
   - Effectuer une validation en environnement de pré-production.

## Conclusion
Ce plan détaillé intègre désormais la possibilité pour un chauffeur d'avoir un véhicule attitré par défaut tout en offrant la flexibilité de modifier ce véhicule pour une course spécifique ou sur une durée indéterminée. L’approche itérative permettra de livrer et de valider chaque étape fonctionnelle avant de passer à la suivante, garantissant ainsi une transition sécurisée et progressive vers le nouveau schéma.