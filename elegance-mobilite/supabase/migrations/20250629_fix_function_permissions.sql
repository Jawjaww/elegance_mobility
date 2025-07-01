-- 🔧 CORRECTION DE LA FONCTION check_driver_profile_completeness
-- Cette fonction a besoin des permissions SECURITY DEFINER pour accéder aux tables

BEGIN;

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.check_driver_profile_completeness(uuid);

-- Recréer la fonction avec les bonnes permissions
CREATE OR REPLACE FUNCTION public.check_driver_profile_completeness(driver_user_id uuid)
RETURNS TABLE (
  is_complete boolean,
  missing_fields text[],
  completion_percentage integer
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- 🔑 CRITIQUE: Permet à la fonction d'outrepasser RLS
SET search_path = public
AS $$
DECLARE
  driver_record record;
  missing_list text[] := '{}';
  total_fields integer := 8;
  completed_fields integer := 0;
BEGIN
  -- Récupérer le driver (avec SECURITY DEFINER, ignore RLS)
  SELECT * INTO driver_record FROM public.drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ARRAY['profil_inexistant'], 0;
    RETURN;
  END IF;
  
  -- Vérifier chaque champ obligatoire
  IF driver_record.first_name IS NULL OR driver_record.first_name = '' THEN
    missing_list := array_append(missing_list, 'first_name');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.phone IS NULL OR driver_record.phone = '' THEN
    missing_list := array_append(missing_list, 'phone');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.company_name IS NULL OR driver_record.company_name = '' THEN
    missing_list := array_append(missing_list, 'company_name');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.company_phone IS NULL OR driver_record.company_phone = '' THEN
    missing_list := array_append(missing_list, 'company_phone');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.driving_license_number IS NULL OR driver_record.driving_license_number = '' THEN
    missing_list := array_append(missing_list, 'driving_license_number');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.driving_license_expiry_date IS NULL THEN
    missing_list := array_append(missing_list, 'driving_license_expiry_date');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.vtc_card_number IS NULL OR driver_record.vtc_card_number = '' THEN
    missing_list := array_append(missing_list, 'vtc_card_number');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.vtc_card_expiry_date IS NULL THEN
    missing_list := array_append(missing_list, 'vtc_card_expiry_date');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Retourner les résultats
  RETURN QUERY SELECT 
    array_length(missing_list, 1) IS NULL OR array_length(missing_list, 1) = 0,
    missing_list,
    ROUND((completed_fields::float / total_fields::float) * 100)::integer;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.check_driver_profile_completeness(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_driver_profile_completeness(uuid) TO anon;

-- Ajouter un commentaire explicatif
COMMENT ON FUNCTION public.check_driver_profile_completeness(uuid) IS 
'Fixed: Uses SECURITY DEFINER to bypass RLS restrictions when checking driver profile completeness';

COMMIT;

-- 🧪 Test de la fonction corrigée
SELECT 
  'Function Test' as test,
  is_complete,
  missing_fields,
  completion_percentage
FROM check_driver_profile_completeness('dc62bd52-0ed7-495b-9055-22635d6c5e74');

-- 🎯 EXPLICATION DU FIX:
-- SECURITY DEFINER permet à la fonction de s'exécuter avec les permissions
-- du propriétaire de la fonction (généralement un super-utilisateur)
-- plutôt qu'avec celles de l'utilisateur qui l'appelle.
-- Cela permet de contourner les restrictions RLS pour cette fonction spécifique.
