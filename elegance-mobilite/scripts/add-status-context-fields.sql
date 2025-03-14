-- Script pour ajouter des champs contextuels aux statuts spéciaux
BEGIN;

-- Ajout de champs pour contextualiser les statuts
ALTER TABLE rides ADD COLUMN IF NOT EXISTS status_updated_by UUID;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS status_notes TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS delay_reason VARCHAR(50); -- 'driver' ou 'client'
ALTER TABLE rides ADD COLUMN IF NOT EXISTS delay_minutes INTEGER;

-- Créer un commentaire sur les colonnes pour la documentation
COMMENT ON COLUMN rides.status_updated_by IS 'ID de l''utilisateur qui a changé le statut (chauffeur ou admin)';
COMMENT ON COLUMN rides.status_changed_at IS 'Timestamp du dernier changement de statut';
COMMENT ON COLUMN rides.status_notes IS 'Notes supplémentaires sur le statut (raison de l''absence ou du retard)';
COMMENT ON COLUMN rides.delay_reason IS 'Indique qui est en retard: "driver" ou "client"';
COMMENT ON COLUMN rides.delay_minutes IS 'Estimation du retard en minutes';

-- Créer un index sur status_updated_by pour des requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_rides_status_updated_by ON rides(status_updated_by);

COMMIT;
