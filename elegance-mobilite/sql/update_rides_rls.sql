-- Activer RLS sur la table rides
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Politique pour INSERTION - Utilisateurs
CREATE POLICY "Users can insert their own rides" ON rides
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Politique pour SÉLECTION - Utilisateurs
CREATE POLICY "Users can view their own rides" ON rides
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Politique pour MISE À JOUR - Utilisateurs (uniquement les réservations en attente)
CREATE POLICY "Users can update their pending rides" ON rides
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Politique pour SUPPRESSION - Utilisateurs (uniquement les réservations en attente)
CREATE POLICY "Users can delete their pending rides" ON rides
FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Politique pour permettre aux chauffeurs de voir leurs courses assignées
CREATE POLICY "Drivers can view their assigned rides" ON rides
FOR SELECT TO authenticated
USING (driver_id = auth.uid());

-- Politique pour permettre aux chauffeurs de mettre à jour le statut de leurs courses
CREATE POLICY "Drivers can update their assigned rides" ON rides
FOR UPDATE TO authenticated
USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid());
