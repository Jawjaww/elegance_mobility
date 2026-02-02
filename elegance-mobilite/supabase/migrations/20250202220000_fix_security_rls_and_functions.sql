-- ============================================================================
-- MIGRATION: Correction des problèmes de sécurité identifiés par Supabase
-- Issues: RLS manquants, search_path mutable, colonnes sensibles exposées
-- ============================================================================

-- ============================================================================
-- 1. ACTIVER RLS SUR LES TABLES MANQUANTES
-- ============================================================================

-- Véhicules (contient insurance_number sensible)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles FORCE ROW LEVEL SECURITY;

-- Documents des chauffeurs
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents FORCE ROW LEVEL SECURITY;

-- Documents des véhicules
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents FORCE ROW LEVEL SECURITY;

-- Profils utilisateurs
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. SUPPRIMER LES ANCIENNES POLITIQUES SI ELLES EXISTENT (pour éviter doublons)
-- ============================================================================

-- Policies pour vehicles
DROP POLICY IF EXISTS "Admins can view all driver vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers can manage own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.vehicles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.vehicles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.vehicles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.vehicles;

-- Policies pour driver_documents
DROP POLICY IF EXISTS "Admins can view all driver documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Drivers can manage own documents" ON public.driver_documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.driver_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.driver_documents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.driver_documents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.driver_documents;

-- Policies pour vehicle_documents
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.vehicle_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.vehicle_documents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.vehicle_documents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.vehicle_documents;

-- Policies pour user_profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.user_profiles;

-- ============================================================================
-- 3. CRÉER LES POLITIQUES RLS SÉCURISÉES
-- ============================================================================

-- ----------------------------------------
-- VEHICLES
-- ----------------------------------------

-- Politique: Les chauffeurs peuvent voir leurs propres véhicules
CREATE POLICY "drivers_view_own_vehicles" ON public.vehicles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = vehicles.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les chauffeurs peuvent créer leurs propres véhicules
CREATE POLICY "drivers_insert_own_vehicles" ON public.vehicles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = vehicles.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les chauffeurs peuvent modifier leurs propres véhicules
CREATE POLICY "drivers_update_own_vehicles" ON public.vehicles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = vehicles.driver_id
            AND d.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = vehicles.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les chauffeurs peuvent supprimer leurs propres véhicules
CREATE POLICY "drivers_delete_own_vehicles" ON public.vehicles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = vehicles.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les admins peuvent tout voir
CREATE POLICY "admin_all_access_vehicles" ON public.vehicles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- ----------------------------------------
-- DRIVER_DOCUMENTS
-- ----------------------------------------

-- Politique: Les chauffeurs peuvent voir leurs propres documents
CREATE POLICY "drivers_view_own_documents" ON public.driver_documents
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les chauffeurs peuvent créer leurs propres documents
CREATE POLICY "drivers_insert_own_documents" ON public.driver_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les chauffeurs peuvent modifier leurs propres documents
CREATE POLICY "drivers_update_own_documents" ON public.driver_documents
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les chauffeurs peuvent supprimer leurs propres documents
CREATE POLICY "drivers_delete_own_documents" ON public.driver_documents
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les admins peuvent tout voir/modifier
CREATE POLICY "admin_all_access_driver_documents" ON public.driver_documents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- ----------------------------------------
-- VEHICLE_DOCUMENTS
-- ----------------------------------------

-- Politique: Les chauffeurs peuvent voir les documents de leurs véhicules
CREATE POLICY "drivers_view_vehicle_documents" ON public.vehicle_documents
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.drivers d ON v.driver_id = d.id
            WHERE v.id = vehicle_documents.vehicle_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les chauffeurs peuvent créer des documents pour leurs véhicules
CREATE POLICY "drivers_insert_vehicle_documents" ON public.vehicle_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.drivers d ON v.driver_id = d.id
            WHERE v.id = vehicle_documents.vehicle_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les chauffeurs peuvent modifier les documents de leurs véhicules
CREATE POLICY "drivers_update_vehicle_documents" ON public.vehicle_documents
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.drivers d ON v.driver_id = d.id
            WHERE v.id = vehicle_documents.vehicle_id
            AND d.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vehicles v
            JOIN public.drivers d ON v.driver_id = d.id
            WHERE v.id = vehicle_documents.vehicle_id
            AND d.user_id = auth.uid()
        )
    );

-- Politique: Les admins peuvent tout voir/modifier
CREATE POLICY "admin_all_access_vehicle_documents" ON public.vehicle_documents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- ----------------------------------------
-- USER_PROFILES
-- ----------------------------------------

-- Politique: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "users_view_own_profile" ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Politique: Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "users_update_own_profile" ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Politique: Les admins peuvent voir tous les profils
CREATE POLICY "admin_view_all_profiles" ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- Politique: Les admins peuvent modifier tous les profils
CREATE POLICY "admin_update_all_profiles" ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_app_meta_data->>'role' = 'app_admin' 
                 OR u.raw_app_meta_data->>'role' = 'app_super_admin')
        )
    );

-- ============================================================================
-- 4. CORRIGER LE SEARCH_PATH DES FONCTIONS (Sécurité)
-- ============================================================================

-- Fonctions utilitaires
ALTER FUNCTION public.assign_user_role_on_signup() SET search_path = public, auth;
ALTER FUNCTION public.get_drivers_completeness_stats() SET search_path = public;
ALTER FUNCTION public.debug_driver_completeness(uuid) SET search_path = public;
ALTER FUNCTION public.get_incomplete_drivers_report() SET search_path = public;
ALTER FUNCTION public.can_driver_accept_rides(uuid) SET search_path = public;
ALTER FUNCTION public.ensure_driver_profile(uuid) SET search_path = public;
ALTER FUNCTION public.auto_update_driver_status() SET search_path = public;
ALTER FUNCTION public.validate_ride_acceptance() SET search_path = public;
ALTER FUNCTION public.check_driver_profile_completeness(uuid) SET search_path = public;
ALTER FUNCTION public.get_driver_id_from_auth() SET search_path = public;
ALTER FUNCTION public.delete_user_and_associated_data(uuid) SET search_path = public;
ALTER FUNCTION public.debug_check_driver_profile_completeness(uuid) SET search_path = public;
ALTER FUNCTION public.update_driver_status_by_id(uuid) SET search_path = public;
ALTER FUNCTION public.check_is_admin() SET search_path = public;
ALTER FUNCTION public.update_driver_status_auto(uuid) SET search_path = public;
ALTER FUNCTION public.get_driver_completeness_details(uuid) SET search_path = public;
ALTER FUNCTION public.check_is_super_admin() SET search_path = public;
ALTER FUNCTION public.handle_driver_status_updates() SET search_path = public;
ALTER FUNCTION public.test_driver_completeness_full(uuid) SET search_path = public;
ALTER FUNCTION public.create_pending_driver(text, text, text, text, text, date, date, text, date, text[], text[], text, text) SET search_path = public, auth;
ALTER FUNCTION public.create_user_profile(uuid, text) SET search_path = public, auth;
ALTER FUNCTION public.validate_audit_logs_metadata() SET search_path = public;
ALTER FUNCTION public.calculate_price_on_insert() SET search_path = public;
ALTER FUNCTION public.before_insert_calculate_ride_price() SET search_path = public;
ALTER FUNCTION public.before_update_calculate_ride_price() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public, auth;
ALTER FUNCTION public.notify_driver_validation() SET search_path = public;
ALTER FUNCTION public.is_super_admin() SET search_path = public, auth;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.is_driver() SET search_path = public;
ALTER FUNCTION public.log_ride_status_change() SET search_path = public;
ALTER FUNCTION public.update_audit_logs_updated_at() SET search_path = public;
ALTER FUNCTION public.update_ride_details_timestamp() SET search_path = public;
ALTER FUNCTION public.get_safe_email() SET search_path = public;
ALTER FUNCTION public.update_rides_timestamp() SET search_path = public;
ALTER FUNCTION public.update_driver_document_url(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.check_user_role_update() SET search_path = public, auth;
ALTER FUNCTION public.fix_all_driver_statuses() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
ALTER FUNCTION public.handle_new_signup() SET search_path = public, auth;
ALTER FUNCTION public.get_user_profile(uuid) SET search_path = public, auth;
ALTER FUNCTION public.delete_driver_file(text, text, uuid, text) SET search_path = public;
ALTER FUNCTION public.log_enhanced_ride_status_change() SET search_path = public;
ALTER FUNCTION public.setup_admin_policies(uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_orphaned_files() SET search_path = public, storage;
ALTER FUNCTION public.validate_driver(uuid, boolean, text) SET search_path = public;
ALTER FUNCTION public.force_update_driver_status(uuid) SET search_path = public;
ALTER FUNCTION public.trigger_update_driver_status() SET search_path = public;

-- ============================================================================
-- 5. MASQUER LES COLONNES SENSIBLES (insurance_number, etc.)
-- ============================================================================

-- Note: Dans Supabase, on ne peut pas facilement "masquer" des colonnes au niveau de la table
-- mais on peut créer des vues sécurisées ou utiliser des politiques RLS restrictives.
-- Pour l'instant, on s'assure que les politiques RLS ci-dessus sont strictes.

-- Créer une vue publique pour vehicles sans les colonnes sensibles
DROP VIEW IF EXISTS public.vehicles_public;
CREATE VIEW public.vehicles_public AS
SELECT 
    id,
    driver_id,
    make,
    model,
    year,
    license_plate,
    color,
    vehicle_type,
    seats,
    is_primary,
    photos,
    created_at,
    updated_at,
    owner_user_id,
    owner_name,
    registration_number,
    vin,
    fuel_type,
    first_registration_date,
    validation_status,
    submitted_by,
    submitted_at
FROM public.vehicles;

-- Activer RLS sur la vue
ALTER VIEW public.vehicles_public SET (security_invoker = on);

-- Commentaires sur les colonnes sensibles
COMMENT ON COLUMN public.vehicles.insurance_number IS 'CONFIDENTIAL: Accessible uniquement par le propriétaire et les admins';
COMMENT ON COLUMN public.drivers.insurance_number IS 'CONFIDENTIAL: Accessible uniquement par le chauffeur et les admins';

-- ============================================================================
-- 6. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que RLS est bien activé sur toutes les tables critiques
SELECT 
    n.nspname as schemaname,
    c.relname as tablename,
    c.relrowsecurity as rowsecurity,
    c.relforcerowsecurity as forcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN ('vehicles', 'driver_documents', 'vehicle_documents', 'user_profiles', 'drivers', 'rides')
AND c.relkind = 'r';
