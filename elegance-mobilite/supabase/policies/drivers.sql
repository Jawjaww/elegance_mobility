-- Politiques RLS pour la table drivers
-- Ces politiques permettent un accès approprié selon les rôles

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Admins can view all drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can view own data" ON drivers;
DROP POLICY IF EXISTS "Admins can update drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can insert drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can update own data" ON drivers;

-- Activer RLS sur la table drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de voir tous les drivers
CREATE POLICY "Admins can view all drivers" ON drivers
FOR SELECT USING (
  -- Vérifier le rôle dans app_metadata
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role')
  ) IN ('app_admin', 'app_super_admin')
);

-- Politique pour permettre aux drivers de voir leurs propres données
CREATE POLICY "Drivers can view own data" ON drivers
FOR SELECT USING (
  auth.uid() = user_id OR
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role')
  ) = 'app_driver' AND auth.uid() = user_id
);

-- Politique pour permettre aux admins de modifier tous les drivers
CREATE POLICY "Admins can update drivers" ON drivers
FOR UPDATE USING (
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role')
  ) IN ('app_admin', 'app_super_admin')
);

-- Politique pour permettre aux admins d'insérer de nouveaux drivers
CREATE POLICY "Admins can insert drivers" ON drivers
FOR INSERT WITH CHECK (
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role')
  ) IN ('app_admin', 'app_super_admin')
);

-- Politique pour permettre aux utilisateurs de créer leur propre profil driver
CREATE POLICY "Users can create own driver profile" ON drivers
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Politique pour permettre aux drivers de mettre à jour leurs propres données
CREATE POLICY "Drivers can update own data" ON drivers
FOR UPDATE USING (
  auth.uid() = user_id AND
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role')
  ) = 'app_driver'
);

-- Commentaires pour documentation
COMMENT ON POLICY "Admins can view all drivers" ON drivers IS 
'Permet aux administrateurs de voir tous les chauffeurs pour l''assignation manuelle';

COMMENT ON POLICY "Drivers can view own data" ON drivers IS 
'Permet aux chauffeurs de voir leurs propres informations';

COMMENT ON POLICY "Admins can update drivers" ON drivers IS 
'Permet aux administrateurs de modifier les informations des chauffeurs';

COMMENT ON POLICY "Drivers can update own data" ON drivers IS 
'Permet aux chauffeurs de mettre à jour leurs propres informations';
