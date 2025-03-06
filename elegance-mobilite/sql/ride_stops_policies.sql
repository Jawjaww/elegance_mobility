-- Activer RLS sur la table ride_stops
ALTER TABLE ride_stops ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent voir leurs propres arrêts
CREATE POLICY "Users can view their own ride stops" ON ride_stops
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_stops.ride_id
    AND rides.user_id = auth.uid()
  )
);

-- Politique pour que les utilisateurs puissent ajouter des arrêts à leurs propres trajets
CREATE POLICY "Users can insert their own ride stops" ON ride_stops
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_stops.ride_id
    AND rides.user_id = auth.uid()
    AND rides.status = 'pending'
  )
);

-- Politique pour que les utilisateurs puissent modifier les arrêts de leurs propres trajets
CREATE POLICY "Users can update their own ride stops" ON ride_stops
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_stops.ride_id
    AND rides.user_id = auth.uid()
    AND rides.status = 'pending'
  )
);

-- Politique pour que les utilisateurs puissent supprimer les arrêts de leurs propres trajets
CREATE POLICY "Users can delete their own ride stops" ON ride_stops
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_stops.ride_id
    AND rides.user_id = auth.uid()
    AND rides.status = 'pending'
  )
);

-- Politique pour que les chauffeurs puissent voir les arrêts des courses qui leur sont assignées
CREATE POLICY "Drivers can view stops for assigned rides" ON ride_stops
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_stops.ride_id
    AND rides.driver_id = auth.uid()
  )
);
