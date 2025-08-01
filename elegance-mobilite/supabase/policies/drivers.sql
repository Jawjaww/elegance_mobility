-- Politiques RLS pour la table drivers
-- Ces politiques permettent un accès approprié selon les rôles

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Admins can view all drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can view own data" ON drivers;
DROP POLICY IF EXISTS "Admins can update drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can insert drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can update own data" ON drivers;
DROP POLICY IF EXISTS "Users can create own driver profile" ON drivers;

-- Activer RLS sur la table drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de voir tous les drivers
-- Utilise raw_app_meta_data depuis auth.users
CREATE POLICY "Admins can view all drivers" ON drivers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- Politique pour permettre aux drivers de voir leurs propres données
-- Plus simple : si l'utilisateur connecté = user_id du driver
CREATE POLICY "Drivers can view own data" ON drivers
FOR SELECT USING (
  auth.uid() = user_id
);

-- Politique pour permettre aux admins de modifier tous les drivers
CREATE POLICY "Admins can update drivers" ON drivers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- Politique pour permettre aux admins d'insérer de nouveaux drivers
CREATE POLICY "Admins can insert drivers" ON drivers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') IN ('app_admin', 'app_super_admin')
  )
);

-- Politique pour permettre aux utilisateurs de créer leur propre profil driver
CREATE POLICY "Users can create own driver profile" ON drivers
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Politique pour permettre aux drivers de mettre à jour leurs propres données
CREATE POLICY "Drivers can update own data" ON drivers
FOR UPDATE USING (
  auth.uid() = user_id
);

-- Commentaires pour documentation
COMMENT ON POLICY "Admins can view all drivers" ON drivers IS 
'Permet aux administrateurs de voir tous les chauffeurs - utilise raw_app_meta_data depuis auth.users';

COMMENT ON POLICY "Drivers can view own data" ON drivers IS 
'Permet aux chauffeurs de voir leurs propres informations - basé sur auth.uid() = user_id';

COMMENT ON POLICY "Admins can update drivers" ON drivers IS 
'Permet aux administrateurs de modifier les informations des chauffeurs - utilise raw_app_meta_data';

COMMENT ON POLICY "Drivers can update own data" ON drivers IS 
'Permet aux chauffeurs de mettre à jour leurs propres informations';

COMMENT ON POLICY "Users can create own driver profile" ON drivers IS 
'Permet aux utilisateurs de créer leur profil chauffeur - basé sur auth.uid() = user_id';
