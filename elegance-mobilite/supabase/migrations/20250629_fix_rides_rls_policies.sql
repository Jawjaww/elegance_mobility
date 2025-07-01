-- Migration: Fix Rides RLS Policies
-- Fixes HTTP 406 errors by using raw_app_meta_data correctly
-- Adds critical policy for drivers to accept rides

BEGIN;

-- Supprimer toutes les politiques existantes pour la table rides
DROP POLICY IF EXISTS "Customers can view their own rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view their assigned rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view available rides" ON rides;
DROP POLICY IF EXISTS "Drivers can accept rides" ON rides;
DROP POLICY IF EXISTS "Admins can view all rides" ON rides;
DROP POLICY IF EXISTS "Customers can create their own rides" ON rides;
DROP POLICY IF EXISTS "Admins can create rides" ON rides;
DROP POLICY IF EXISTS "Drivers can update their assigned rides" ON rides;
DROP POLICY IF EXISTS "Admins can update any ride" ON rides;
DROP POLICY IF EXISTS "Customers can update their own rides" ON rides;
DROP POLICY IF EXISTS "Customers can delete their own rides" ON rides;
DROP POLICY IF EXISTS "Admins can delete any ride" ON rides;

-- Supprimer l'ancienne fonction qui utilise JWT
DROP FUNCTION IF EXISTS public.get_user_app_role();

-- Activer RLS (au cas où ce ne serait pas déjà fait)
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- 🎯 POLITIQUES SELECT (Lecture)

-- Les clients peuvent voir leurs propres courses
CREATE POLICY "Customers can view their own rides"
ON rides FOR SELECT USING (
  user_id = auth.uid()
);

-- Les chauffeurs peuvent voir leurs courses assignées
CREATE POLICY "Drivers can view their assigned rides"
ON rides FOR SELECT USING (
  driver_id = (
    SELECT id FROM drivers 
    WHERE user_id = auth.uid()
  )
);

-- 🚀 CRITIQUE: Les chauffeurs peuvent voir les courses disponibles (sans chauffeur)
CREATE POLICY "Drivers can view available rides"
ON rides FOR SELECT USING (
  driver_id IS NULL 
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') = 'app_driver'
  )
);

-- Les admins peuvent voir toutes les courses
CREATE POLICY "Admins can view all rides"
ON rides FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- 🎯 POLITIQUES INSERT (Création)

-- Les clients peuvent créer leurs propres courses
CREATE POLICY "Customers can create their own rides"
ON rides FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Les admins peuvent créer des courses pour n'importe qui
CREATE POLICY "Admins can create rides"
ON rides FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- 🎯 POLITIQUES UPDATE (Modification)

-- 🚀 CRITIQUE: Les chauffeurs peuvent accepter des courses disponibles
CREATE POLICY "Drivers can accept rides"
ON rides FOR UPDATE USING (
  -- Course disponible (sans chauffeur)
  driver_id IS NULL 
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') = 'app_driver'
  )
) WITH CHECK (
  -- Le chauffeur s'assigne la course
  driver_id = (
    SELECT id FROM drivers 
    WHERE user_id = auth.uid()
  )
  AND status IN ('scheduled', 'in-progress')
);

-- Les chauffeurs peuvent modifier leurs courses assignées
CREATE POLICY "Drivers can update their assigned rides"
ON rides FOR UPDATE USING (
  driver_id = (
    SELECT id FROM drivers 
    WHERE user_id = auth.uid()
  )
) WITH CHECK (
  driver_id = (
    SELECT id FROM drivers 
    WHERE user_id = auth.uid()
  )
);

-- Les clients peuvent modifier leurs propres courses (avant assignation)
CREATE POLICY "Customers can update their own rides"
ON rides FOR UPDATE USING (
  user_id = auth.uid()
  AND (driver_id IS NULL OR status = 'pending')
) WITH CHECK (
  user_id = auth.uid()
);

-- Les admins peuvent modifier toutes les courses
CREATE POLICY "Admins can update any ride"
ON rides FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- 🎯 POLITIQUES DELETE (Suppression)

-- Les clients peuvent supprimer leurs courses non assignées
CREATE POLICY "Customers can delete their own rides"
ON rides FOR DELETE USING (
  user_id = auth.uid()
  AND (driver_id IS NULL OR status = 'pending')
);

-- Les admins peuvent supprimer toutes les courses
CREATE POLICY "Admins can delete any ride"
ON rides FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

COMMIT;

-- 📝 Comment tester cette migration:
-- 
-- 1. En tant que chauffeur, vérifier l'accès aux courses disponibles:
--    SELECT * FROM rides WHERE driver_id IS NULL AND status = 'pending';
--
-- 2. En tant que chauffeur, tester l'acceptation d'une course:
--    UPDATE rides SET driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid()), status = 'scheduled' 
--    WHERE id = 'course_id' AND driver_id IS NULL AND status = 'pending';
--
-- 3. Vérifier que les clients voient uniquement leurs courses:
--    SELECT * FROM rides; -- (devrait filtrer automatiquement)
