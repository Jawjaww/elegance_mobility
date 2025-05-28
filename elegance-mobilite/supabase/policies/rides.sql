-- Ajout des colonnes prix si elles n'existent pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public'
                  AND table_name = 'rides'
                  AND column_name = 'price') THEN
        ALTER TABLE rides ADD COLUMN price DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public'
                  AND table_name = 'rides'
                  AND column_name = 'final_price') THEN
        ALTER TABLE rides ADD COLUMN final_price DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public'
                  AND table_name = 'rides'
                  AND column_name = 'estimated_price') THEN
        ALTER TABLE rides ADD COLUMN estimated_price DECIMAL(10,2);
    END IF;
END $$;

-- Note: Le calcul des prix est entièrement géré par l'Edge Function
-- Pour modifier les tarifs, utilisez le backoffice d'administration
-- Voir /docs/edge-function-tarif-recalcule.md pour plus de détails

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Customers can view their own rides" ON rides;
DROP POLICY IF EXISTS "Drivers can view their assigned rides" ON rides;
DROP POLICY IF EXISTS "Admins can view all rides" ON rides;
DROP POLICY IF EXISTS "Customers can create their own rides" ON rides;
DROP POLICY IF EXISTS "Drivers can update their assigned rides" ON rides;
DROP POLICY IF EXISTS "Admins can update any ride" ON rides;
DROP POLICY IF EXISTS "Customers can delete their own rides" ON rides;
DROP POLICY IF EXISTS "Admins can delete any ride" ON rides;

-- Activer RLS
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Créer la fonction d'aide pour vérifier le rôle applicatif
CREATE OR REPLACE FUNCTION public.get_user_app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role'),
    (auth.jwt() -> 'app_metadata' ->> 'role')
  );
$$;

-- Politiques avec la nouvelle fonction
CREATE POLICY "Customers can view their own rides"
ON rides
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() AND get_user_app_role() = 'app_customer'
);

CREATE POLICY "Drivers can view their assigned rides"
ON rides
FOR SELECT
TO authenticated
USING (
  driver_id = auth.uid() AND get_user_app_role() = 'app_driver'
);

CREATE POLICY "Admins can view all rides"
ON rides
FOR SELECT
TO authenticated
USING (get_user_app_role() IN ('app_admin', 'app_super_admin'));

CREATE POLICY "Customers can create their own rides"
ON rides
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  get_user_app_role() = 'app_customer'
);

CREATE POLICY "Drivers can update their assigned rides"
ON rides
FOR UPDATE
TO authenticated
USING (
  driver_id = auth.uid() AND get_user_app_role() = 'app_driver'
)
WITH CHECK (
  driver_id = auth.uid() AND get_user_app_role() = 'app_driver'
);

CREATE POLICY "Admins can update any ride"
ON rides
FOR UPDATE
TO authenticated
USING (get_user_app_role() IN ('app_admin', 'app_super_admin'));

CREATE POLICY "Customers can update their own rides"
ON rides
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND get_user_app_role() = 'app_customer'
)
WITH CHECK (
  user_id = auth.uid() AND get_user_app_role() = 'app_customer'
);

CREATE POLICY "Customers can delete their own rides"
ON rides
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() AND get_user_app_role() = 'app_customer'
);

CREATE POLICY "Admins can delete any ride"
ON rides
FOR DELETE
TO authenticated
USING (get_user_app_role() IN ('app_admin', 'app_super_admin'));