-- Migration pour la gestion des courses
-- Date: 03/03/2025

-- Vérification que l'utilisateur a un rôle administrateur
CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT CASE 
      WHEN auth.jwt() ->> 'role' = 'admin' THEN true
      ELSE false
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique permettant aux admins de gérer les courses
CREATE POLICY admin_manage_rides ON rides
  FOR ALL
  TO authenticated
  USING (user_is_admin())
  WITH CHECK (user_is_admin());

-- Politique permettant aux admins de voir les chauffeurs disponibles
CREATE POLICY admin_view_drivers ON drivers
  FOR SELECT
  TO authenticated
  USING (user_is_admin());

-- Politique permettant aux admins de voir les véhicules disponibles
CREATE POLICY admin_view_vehicles ON vehicles
  FOR SELECT
  TO authenticated
  USING (user_is_admin());

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_datetime ON rides(pickup_datetime);
CREATE INDEX IF NOT EXISTS idx_drivers_is_active ON drivers(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON vehicles(is_active);
