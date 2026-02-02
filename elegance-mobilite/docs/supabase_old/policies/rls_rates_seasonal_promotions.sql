-- Activation de RLS et politiques pour les tables rates et seasonal_promotions

-- Table : rates
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Allow SELECT for all authenticated and service role" ON rates;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON rates;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users" ON rates;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users" ON rates;

-- Créer de nouvelles politiques
-- SELECT pour tous les utilisateurs authentifiés et service_role
CREATE POLICY "Allow SELECT for all authenticated and service role"
  ON rates
  FOR SELECT
  USING (
    auth.role() IN ('authenticated', 'service_role')
    OR auth.jwt()->>'role' = 'service_role'
  );

-- INSERT pour utilisateurs authentifiés
CREATE POLICY "Allow INSERT for authenticated users"
  ON rates
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE pour utilisateurs authentifiés
CREATE POLICY "Allow UPDATE for authenticated users"
  ON rates
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- DELETE pour utilisateurs authentifiés
CREATE POLICY "Allow DELETE for authenticated users"
  ON rates
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Table : seasonal_promotions
ALTER TABLE seasonal_promotions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Allow SELECT for authenticated users" ON seasonal_promotions;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON seasonal_promotions;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users" ON seasonal_promotions;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users" ON seasonal_promotions;

-- Créer de nouvelles politiques
-- SELECT pour utilisateurs authentifiés
CREATE POLICY "Allow SELECT for authenticated users"
  ON seasonal_promotions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT pour utilisateurs authentifiés
CREATE POLICY "Allow INSERT for authenticated users"
  ON seasonal_promotions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE pour utilisateurs authentifiés
CREATE POLICY "Allow UPDATE for authenticated users"
  ON seasonal_promotions
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- DELETE pour utilisateurs authentifiés
CREATE POLICY "Allow DELETE for authenticated users"
  ON seasonal_promotions
  FOR DELETE
  USING (auth.role() = 'authenticated');