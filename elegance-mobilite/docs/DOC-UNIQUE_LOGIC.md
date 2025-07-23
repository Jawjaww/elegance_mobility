> Dernière mise à jour : 2025-07-04
> Statut : à jour
Fonctions disponibles dans la base de données :

Fonctions dans le schéma public



SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    t.typname as return_type,
    p.prosecdef as security_definer
FROM 
    pg_proc p
    LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
    LEFT JOIN pg_type t ON p.prorettype = t.oid
WHERE 
    n.nspname = 'public'
ORDER BY 
    n.nspname, p.proname;

Examinons les déclencheurs (triggers) dans la base de données :

Triggers dans le schéma public



SELECT 
    t.tgname AS trigger_name,
    n.nspname AS schema_name,
    c.relname AS table_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM 
    pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND NOT t.tgisinternal
ORDER BY 
    n.nspname, c.relname, t.tgname;

Examinons les politiques RLS (Row Level Security) :

Politiques RLS dans le schéma public



SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    pol.polname AS policy_name,
    CASE pol.polpermissive WHEN TRUE THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression,
    CASE WHEN pol.polroles = '{0}' THEN 'PUBLIC' ELSE array_to_string(array(SELECT rolname FROM pg_roles WHERE oid = ANY(pol.polroles)), ', ') END AS roles
FROM 
    > **Dernière mise à jour : 2025-07-04**
    > **Statut : À jour**

    # 📚 Documentation Unique - Logique Supabase

    ---

    ## 🗂️ Table des matières

    - [Introduction](#introduction)
    - [Structure de la Base de Données](#structure-de-la-base-de-données)
    - [Fonctions](#fonctions)
    - [Déclencheurs (Triggers)](#déclencheurs-triggers)
    - [Politiques de Sécurité (RLS)](#politiques-de-sécurité-rls)
    - [Edge Functions](#edge-functions)
    - [Stockage](#stockage)
    - [Flux de Travail Principaux](#flux-de-travail-principaux)
    - [Gestion des Utilisateurs et Rôles](#gestion-des-utilisateurs-et-rôles)
    - [Intégrations Externes](#intégrations-externes)

    ---

    ## 🏁 Introduction

    Ce projet est une application de **VTC (Voiture de Transport avec Chauffeur)** permettant de gérer chauffeurs, véhicules, courses et utilisateurs. L'application s'appuie sur **Supabase** pour la gestion des données, l'authentification, le stockage de fichiers et les fonctions serverless.

    ---

    ## 🏗️ Structure de la Base de Données

    ### **Tables principales**

    - **users** : Profils utilisateurs liés à `auth.users`  
        _Stocke les informations de base des utilisateurs (first_name, last_name, phone)_
    - **drivers** : Informations des chauffeurs  
        _Infos personnelles/professionnelles, documents, statuts, complétude_
    - **vehicles** : Véhicules disponibles  
        _Modèle, type, plaque d'immatriculation_
    - **driver_vehicles** : Association chauffeurs/véhicules  
        _Un chauffeur peut avoir plusieurs véhicules, photos, documents_
    - **driver_documents** : Documents des chauffeurs  
        _Références aux documents, dates d'expiration, validation_
    - **rides** : Courses  
        _Adresses, coordonnées, prix, statut, liens avec chauffeurs et utilisateurs_
    - **ride_stops** : Arrêts intermédiaires  
        _Plusieurs arrêts par course_
    - **ride_status_history** : Historique des statuts  
        _Trace les changements de statut_
    - **rates** : Tarifs par type de véhicule  
        _Prix de base, par km, minimum_
    - **options** : Options additionnelles  
        _Siège enfant, animaux, etc._
    - **promo_codes / promo_usages** : Codes promo  
        _Définition et suivi des promotions_
    - **seasonal_promotions** : Promotions saisonnières  
        _Limitées dans le temps ou par zone_
    - **corporate_discounts** : Remises entreprises  
        _Remises spéciales corporate_
    - **driver_rewards** : Récompenses chauffeurs  
        _Bonus, commissions, performance_
    - **audit_logs** : Journal d'audit  
        _Sécurité, débogage_
    - **user_profiles** : Profils utilisateurs étendus  
        _Métadonnées supplémentaires_

    ### **Types énumérés**

    - **driver_status** : `pending_validation`, `active`, `inactive`, `on_vacation`, `suspended`, `incomplete`
    - **ride_status** : `pending`, `scheduled`, `in-progress`, `completed`, `client-canceled`, `driver-canceled`, `admin-canceled`, `no-show`, `delayed`
    - **vehicle_type_enum** : `STANDARD`, `PREMIUM`, `VAN`, `ELECTRIC`
    - **discount_type_enum** : `percentage`, `fixed`
    - **promo_type_enum** : `percentage`, `fixed_amount`
    - **reward_type_enum** : `bonus`, `commission_increase`

    ---

    ## 🧩 Fonctions

    ### **Gestion des Chauffeurs**

    - **`check_driver_profile_completeness(driver_user_id uuid)`**  
        _Vérifie la complétude du profil chauffeur (16 champs, catégories identité, entreprise, adresse, etc.)_  
        _Retourne : booléen, pourcentage, liste des champs manquants_
    - **`can_driver_accept_rides(driver_user_id uuid)`**  
        _Vérifie si un chauffeur peut accepter des courses (statut, complétude, documents)_
    - **`ensure_driver_profile(driver_user_id uuid)`**  
        _Crée un profil chauffeur si inexistant, retourne l'ID_
    - **`create_pending_driver(...)`**  
        _Crée un chauffeur en "pending_validation"_
    - **`validate_driver(driver_id uuid, approved boolean, rejection_reason text)`**  
        _Approuve/rejette un chauffeur, met à jour le statut_
    - **`update_driver_status_auto(driver_user_id uuid)`**  
        _Met à jour automatiquement le statut selon la complétude (utilisé par triggers)_
    - **`force_update_driver_status(driver_user_id uuid)`**  
        _Force la mise à jour du statut (admin)_

    ### **Gestion des Documents**

    - **`update_driver_document_url(p_driver_id uuid, p_document_type text, p_file_url text)`**  
        _Met à jour l'URL d'un document après upload_
    - **`delete_driver_file(file_bucket text, file_path text, driver_id_param uuid, document_type_param text)`**  
        _Supprime un fichier du stockage et met à jour la base_

    ### **Gestion des Utilisateurs**

    - **`get_user_role()`**  
        _Récupère le rôle de l'utilisateur actuel_
    - **`is_admin()`, `is_super_admin()`, `is_driver()`**  
        _Helpers pour vérifier le rôle_
    - **`create_user_profile(user_id uuid, user_role text)`**  
        _Crée un profil utilisateur avec rôle_
    - **`get_user_profile(user_id uuid)`**  
        _Récupère le profil complet (auth.users + public.users)_
    - **`delete_user_by_id(p_user_id uuid)`**  
        _Suppression sécurisée d'un utilisateur_

    ### **Calcul de Prix**

    - **`before_insert_calculate_ride_price()`**, **`before_update_calculate_ride_price()`**  
        _Calcule le prix d'une course à l'insertion/mise à jour_

    ---

    ## ⚡ Déclencheurs (Triggers)

    - **`update_audit_logs_timestamp`** sur `audit_logs`  
        _Met à jour le timestamp lors de modification_
    - **`validate_audit_logs_metadata`** sur `audit_logs`  
        _Valide les métadonnées avant insertion/mise à jour_
    - **`update_driver_vehicles_updated_at`** sur `driver_vehicles`  
        _Met à jour `updated_at` lors de modification_
    - **`cleanup_driver_files_on_delete`** sur `drivers`  
        _Nettoie les fichiers lors de suppression d'un chauffeur_
    - **`trigger_auto_update_driver_status`** sur `drivers`  
        _Met à jour automatiquement le statut chauffeur_
    - **`price-calculator-update-webhook`** sur `rides`  
        _Appelle l'Edge Function price-calculator lors de mise à jour de course_
    - **`validate_ride_acceptance_trigger`** sur `rides`  
        _Valide l'acceptation d'une course par un chauffeur_

    ---

    ## 🔒 Politiques de Sécurité (RLS)

    ### **Chauffeurs (`drivers`)**
    - **Admins can view all drivers** : Accès admin à tous les chauffeurs
    - **Drivers can check own completeness** : Chauffeur vérifie son profil
    - **drivers_admin_access** : Accès complet admin
    - **drivers_own_access** : Gestion du profil par le chauffeur

    ### **Documents (`driver_documents`)**
    - **Admins can view all driver documents**
    - **Drivers can manage own documents**

    ### **Véhicules (`driver_vehicles`)**
    - **Admins can view all driver vehicles**
    - **Drivers can manage own vehicles**

    ### **Courses (`rides`)**
    - **rides_admin_all** : Accès complet admin
    - **rides_assigned_to_driver** : Chauffeur voit ses courses
    - **rides_available_for_drivers** : Chauffeur voit les courses disponibles
    - **rides_create_customer** : Client crée une course
    - **rides_own_customer** : Client voit ses courses
    - **rides_accept_by_driver** : Chauffeur accepte une course
    - **rides_update_assigned** : Chauffeur met à jour ses courses

    ### **Utilisateurs (`users`)**
    - **Admins can view all users**
    - **Users can view own profile**
    - **Users can update own profile**
    - **admin_full_access**

    ---

    ## 🧬 Edge Functions

    1. **price-calculator**  
         _Calcule le prix d'une course (distance, type véhicule, options)_
    2. **get-all-drivers**  
         _Retourne la liste complète des chauffeurs (admin)_
    3. **get-driver-by-id**  
         _Retourne les infos d'un chauffeur par ID_

    ---

    ## 🗄️ Stockage

    ### **Buckets de stockage**

    - **driver-avatars**  
        _Public, 5 MB, images (jpeg/png/webp), photos de profil_
    - **driver-documents**  
        _Privé, 10 MB, images/pdf, documents officiels_
    - **vehicle-photos**  
        _Public, 5 MB, images, photos véhicules_

    ---

    ## 🔄 Flux de Travail Principaux

    ### 1. **Inscription & Validation Chauffeur**
    1. L'utilisateur s'inscrit via `auth.users`
    2. Un profil chauffeur est créé avec statut `incomplete`
    3. Le chauffeur complète son profil et télécharge ses documents
    4. `check_driver_profile_completeness` vérifie la complétude → statut `pending_validation` si complet
    5. Un admin valide le chauffeur via `validate_driver` → statut `active` si approuvé

    ### 2. **Création & Attribution de Course**
    1. Un client crée une course (`pending`)
    2. Trigger `price-calculator-update-webhook` calcule le prix
    3. Chauffeurs disponibles voient la course (`rides_available_for_drivers`)
    4. Un chauffeur accepte la course (`rides_accept_by_driver`) → statut `scheduled`
    5. Le chauffeur met à jour le statut (in-progress, completed)
    6. Chaque changement de statut est tracé dans `ride_status_history`

    ### 3. **Gestion des Documents**
    1. Chauffeur upload un document dans `driver-documents`
    2. `update_driver_document_url` met à jour la référence
    3. Un admin valide le document
    4. `update_driver_status_auto` met à jour le statut si besoin

    ---

    ## 👥 Gestion des Utilisateurs et Rôles

    ### **Rôles principaux**
    - `app_super_admin` : Accès complet
    - `app_admin` : Accès administratif limité
    - `app_driver` : Chauffeur (profil, courses)
    - `authenticated` : Utilisateur standard (courses)

    ### **Attribution des rôles**
    1. Inscription via `auth.users`
    2. Fonction `handle_new_user` déclenchée
    3. Rôle attribué selon contexte
    4. Métadonnées utilisateur mises à jour

    ---

    ## 🌐 Intégrations Externes

    ### 1. **OpenStreetMap**
    _Utilisé par `price-calculator` pour calculer distances/durées_

    ### 2. **Webhooks**
    _Le trigger `price-calculator-update-webhook` appelle l'Edge Function `price-calculator`_

    ---

    > _Cette documentation reflète l'état actuel du projet Supabase. Les fonctionnalités, tables et politiques peuvent évoluer. Consultez-la régulièrement pour rester à jour._