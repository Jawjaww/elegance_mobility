-- Script pour améliorer la table d'historique des statuts avec plus de cas métier VTC

BEGIN;

-- 1. Ajouter de nouveaux types de statuts pour couvrir davantage de cas métier
DO $$
BEGIN
  -- Problèmes techniques
  BEGIN
    ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'vehicle-breakdown';
    RAISE NOTICE 'Ajouté statut vehicle-breakdown (panne de véhicule)';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Le statut vehicle-breakdown existe déjà';
  END;
  
  -- Incidents
  BEGIN
    ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'incident';
    RAISE NOTICE 'Ajouté statut incident (problème pendant la course)';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Le statut incident existe déjà';
  END;
  
  -- Litiges
  BEGIN
    ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'disputed';
    RAISE NOTICE 'Ajouté statut disputed (litige en cours)';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Le statut disputed existe déjà';
  END;
  
  -- Course avec arrêts multiples
  BEGIN
    ALTER TYPE ride_status ADD VALUE IF NOT EXISTS 'multi-stop';
    RAISE NOTICE 'Ajouté statut multi-stop (course avec arrêts multiples)';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Le statut multi-stop existe déjà';
  END;
end
$$;

-- 2. Enrichir la table ride_status_history avec des colonnes supplémentaires
ALTER TABLE ride_status_history 
  -- Raison détaillée du changement de statut
  ADD COLUMN IF NOT EXISTS reason_category VARCHAR(50),
  -- Impact financier (remboursement, pénalité)
  ADD COLUMN IF NOT EXISTS financial_impact DECIMAL(10,2),
  -- Si un incident a nécessité l'intervention d'un tiers (police, assurance)
  ADD COLUMN IF NOT EXISTS external_intervention BOOLEAN DEFAULT FALSE,
  -- Coordonnées GPS au moment du changement de statut
  ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,6),
  ADD COLUMN IF NOT EXISTS location_lng DECIMAL(10,6),
  -- Si le statut nécessite une action de suivi
  ADD COLUMN IF NOT EXISTS requires_followup BOOLEAN DEFAULT FALSE,
  -- Si cette entrée d'historique a été confirmée par les deux parties
  ADD COLUMN IF NOT EXISTS confirmed_by_client BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS confirmed_by_driver BOOLEAN DEFAULT FALSE;

-- 3. Créer une table de catégories de raisons pour une meilleure organisation
CREATE TABLE IF NOT EXISTS status_reason_categories (
  id SERIAL PRIMARY KEY,
  category_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  requires_notes BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT FALSE
);

-- Insérer quelques catégories de base
INSERT INTO status_reason_categories (category_code, description, requires_notes, requires_approval)
VALUES
  ('traffic', 'Problèmes de circulation', false, false),
  ('client-request', 'Demande du client', true, false),
  ('technical-issue', 'Problème technique', true, false),
  ('security', 'Problème de sécurité', true, true),
  ('weather', 'Conditions météorologiques', false, false),
  ('driver-emergency', 'Urgence chauffeur', true, true),
  ('client-behavior', 'Comportement du client', true, true),
  ('payment-issue', 'Problème de paiement', true, false)
ON CONFLICT (category_code) DO NOTHING;

-- 4. Ajouter une contrainte de clé étrangère à la table d'historique
ALTER TABLE ride_status_history 
  ADD CONSTRAINT fk_reason_category 
  FOREIGN KEY (reason_category) 
  REFERENCES status_reason_categories(category_code) 
  ON DELETE SET NULL;

-- 5. Mettre à jour le déclencheur pour capturer plus d'informations
CREATE OR REPLACE FUNCTION log_enhanced_ride_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Enregistre le changement de statut dans l'historique avec plus de détails
  INSERT INTO ride_status_history (
    ride_id, 
    status, 
    previous_status, 
    changed_by,
    location_lat,
    location_lng,
    requires_followup
  ) VALUES (
    NEW.id, 
    NEW.status, 
    OLD.status,
    NULLIF(current_setting('app.current_user_id', true), '')::UUID,
    NEW.current_lat, -- Supposant que ces colonnes existent ou sont ajoutées à rides
    NEW.current_lng,
    CASE 
      WHEN NEW.status IN ('disputed', 'incident', 'vehicle-breakdown') THEN TRUE
      ELSE FALSE
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remplacer le déclencheur existant
DROP TRIGGER IF EXISTS ride_status_change_trigger ON rides;
CREATE TRIGGER ride_status_change_enhanced_trigger
AFTER UPDATE OF status ON rides
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_enhanced_ride_status_change();

COMMIT;
