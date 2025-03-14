-- Script pour créer une table d'historique des statuts de course
BEGIN;

-- Création de la table d'historique des statuts
CREATE TABLE IF NOT EXISTS ride_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  previous_status VARCHAR,
  delay_reason VARCHAR(50), -- 'driver' ou 'client' 
  delay_minutes INTEGER,
  notes TEXT
);

-- Création d'index pour des requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_status_history_ride_id ON ride_status_history(ride_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_by ON ride_status_history(changed_by);

-- Création d'une fonction pour enregistrer automatiquement les changements de statut
CREATE OR REPLACE FUNCTION log_ride_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Enregistre le changement de statut dans l'historique
  INSERT INTO ride_status_history (
    ride_id, 
    status, 
    previous_status, 
    changed_by
  ) VALUES (
    NEW.id, 
    NEW.status, 
    OLD.status,
    current_setting('app.current_user_id', true)::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création d'un déclencheur (trigger) pour appeler la fonction
DROP TRIGGER IF EXISTS ride_status_change_trigger ON rides;
CREATE TRIGGER ride_status_change_trigger
AFTER UPDATE OF status ON rides
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_ride_status_change();

COMMIT;
