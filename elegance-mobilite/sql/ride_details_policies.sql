-- Activer RLS sur la table ride_details
ALTER TABLE ride_details ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres détails de trajet
CREATE POLICY "Users can view their own ride details" ON ride_details
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_details.ride_id
    AND rides.user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs d'insérer des détails pour leurs propres trajets
CREATE POLICY "Users can insert their own ride details" ON ride_details
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_details.ride_id
    AND rides.user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs de mettre à jour les détails de leurs propres trajets
CREATE POLICY "Users can update their own ride details" ON ride_details
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_details.ride_id
    AND rides.user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs de supprimer les détails de leurs propres trajets
CREATE POLICY "Users can delete their own ride details" ON ride_details
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rides
    WHERE rides.id = ride_details.ride_id
    AND rides.user_id = auth.uid()
    AND rides.status = 'pending'
  )
);
