-- Suppression de la table ride_details qui contient des données redondantes
-- puisque toutes ses colonnes existent maintenant dans la table rides

-- 1. Désactiver les contraintes de clé étrangère pour cette opération
SET session_replication_role = 'replica';

-- 2. Supprimer la table ride_details
DROP TABLE IF EXISTS public.ride_details;

-- 3. Réactiver les contraintes de clé étrangère
SET session_replication_role = 'origin';

-- 4. Supprimer également la fonction et le trigger associés s'ils existent
DROP TRIGGER IF EXISTS update_ride_details_timestamp ON ride_details;
DROP FUNCTION IF EXISTS update_ride_details_timestamp();

-- 5. Vérifier que le trigger sur rides existe toujours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_rides_timestamp' 
    AND tgrelid = 'rides'::regclass
  ) THEN
    -- Créer le trigger s'il n'existe pas
    CREATE OR REPLACE FUNCTION update_rides_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_rides_timestamp
    BEFORE UPDATE ON rides
    FOR EACH ROW
    EXECUTE FUNCTION update_rides_timestamp();
  END IF;
END
$$;
