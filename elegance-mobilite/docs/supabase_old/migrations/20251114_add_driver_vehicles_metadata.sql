-- Script: add_driver_vehicles_metadata.sql
-- Objectif: ajouter métadonnées essentielles pour véhicules VTC
-- À exécuter dans Supabase SQL Editor (ne pas exécuter sans validation en production)

BEGIN;

-- 1) Ajouter colonnes utiles
ALTER TABLE IF EXISTS public.vehicles
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS owner_user_id uuid,
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS fuel_type text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS first_registration_date date,
ADD COLUMN IF NOT EXISTS insurance_number text,
ADD COLUMN IF NOT EXISTS vin text,
ADD COLUMN IF NOT EXISTS seats integer;

-- 2) Indexes pour recherche rapide (plaque et numéro carte grise)
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate_lower
ON public.vehicles (lower(license_plate));

CREATE INDEX IF NOT EXISTS idx_vehicles_registration_number_lower
ON public.vehicles (lower(registration_number));

-- 3) Exemple de normalisation du champ documents (JSON) :
-- documents := [
--   {
--     "type": "carte_grise",            -- string
--     "file_url": "https://...",       -- string (Supabase Storage public/private)
--     "uploaded_at": "2025-11-14T12:00:00Z",
--     "expiry_date": "2028-11-14",
--     "validated_by": "admin_user_id",
--     "validation_status": "validated" -- or pending / rejected
--   },
--   { ... }
-- ]
-- On laisse la colonne 'documents' existante mais il est recommandé d'utiliser
-- la même structure que `driver_documents` pour pouvoir réutiliser les outils.

-- 4) Permissions / RLS :
-- Vérifiez les policies existantes avant d'ajouter de nouvelles règles.
-- Exemple (ne PAS exécuter tel quel sans validation) :
-- CREATE POLICY vehicles_update_owner ON public.vehicles
-- FOR UPDATE USING (auth.role() = 'authenticated' AND (owner_user_id = auth.uid() OR exists(...)))

COMMIT;

-- NOTES:
-- - owner_user_id : peut référencer auth.users.id ou drivers.user_id selon le besoin.
-- - Si vous préférez une table séparée `vehicle_documents`, je peux générer le SQL de migration.
-- - Après exécution, veuillez mettre à jour les types TypeScript si vous utilisez des types générés.
-- End of file
