-- Migration pour ajouter la colonne created_by à la table rides
-- Date: 03/03/2025

-- Ajout de la colonne created_by
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Index sur created_by pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_rides_created_by ON rides(created_by);

-- Mise à jour des politiques pour inclure created_by
DROP POLICY IF EXISTS admin_manage_rides ON rides;

CREATE POLICY admin_manage_rides ON rides
FOR ALL
TO authenticated
USING (user_is_admin())
WITH CHECK (user_is_admin());

COMMENT ON COLUMN  IS 'ID de l''utilisateur qui a créé la course';
