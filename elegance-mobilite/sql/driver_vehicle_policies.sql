-- Activer RLS sur la table drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Politique permettant aux chauffeurs de voir uniquement leurs propres données
CREATE POLICY "Drivers can view their own profile" ON drivers
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Politique permettant aux chauffeurs de mettre à jour leurs propres données
CREATE POLICY "Drivers can update their own profile" ON drivers
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Activer RLS sur la table vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Politique permettant aux chauffeurs de voir leurs véhicules assignés
CREATE POLICY "Drivers can view vehicles assigned to them" ON vehicles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.vehicle_id = vehicles.id
    AND drivers.user_id = auth.uid()
  )
);
