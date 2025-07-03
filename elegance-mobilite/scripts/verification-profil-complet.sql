-- VÉRIFICATION COMPLÉTUDE PROFIL DRIVER
-- Script à exécuter dans l'interface Supabase SQL Editor

-- 🔍 FONCTION : Vérifier si un profil driver est complet
CREATE OR REPLACE FUNCTION check_driver_profile_completeness(driver_user_id uuid)
RETURNS TABLE (
  is_complete boolean,
  missing_fields text[],
  completion_percentage integer
) AS $$
DECLARE
  driver_record record;
  missing_list text[] := '{}';
  total_fields integer := 8;
  completed_fields integer := 0;
BEGIN
  -- Récupérer le driver
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
$$ LANGUAGE plpgsql;

-- 🔍 TEST : Vérifier votre driver actuel
SELECT * FROM check_driver_profile_completeness('dc62bd52-0ed7-495b-9055-22635d6c5e74');

-- 🔍 FONCTION : Mettre à jour le statut du driver selon la complétude
CREATE OR REPLACE FUNCTION update_driver_status_based_on_completeness(driver_user_id uuid)
RETURNS text AS $$
DECLARE
  completeness_result record;
  new_status text;
BEGIN
  -- Vérifier la complétude
  SELECT * INTO completeness_result 
  FROM check_driver_profile_completeness(driver_user_id);
  
  IF NOT FOUND OR completeness_result.missing_fields @> ARRAY['profil_inexistant'] THEN
    RETURN 'Profil driver introuvable';
  END IF;
  
  -- Déterminer le nouveau statut
  IF completeness_result.is_complete THEN
    new_status := 'active';
  ELSE
    new_status := 'pending_validation';
  END IF;
  
  -- Mettre à jour le statut
  UPDATE public.drivers 
  SET status = new_status::driver_status,
      updated_at = NOW()
  WHERE user_id = driver_user_id;
  
  RETURN format('Statut mis à jour: %s (complétude: %s%%)', 
                new_status, completeness_result.completion_percentage);
END;
$$ LANGUAGE plpgsql;

-- 📊 RAPPORT : Tous les drivers incomplets
SELECT 
  d.user_id,
  u.first_name,
  u.last_name,
  d.status,
  completeness.*
FROM public.drivers d
LEFT JOIN public.users u ON d.user_id = u.id
CROSS JOIN LATERAL check_driver_profile_completeness(d.user_id) AS completeness
WHERE NOT completeness.is_complete
ORDER BY completeness.completion_percentage DESC;

-- ✅ CONFIRMATION
SELECT '
🎯 FONCTIONS CRÉÉES:

1. check_driver_profile_completeness(uuid) 
   - Vérifie si un profil est complet
   - Retourne les champs manquants et le pourcentage

2. update_driver_status_based_on_completeness(uuid)
   - Met à jour le statut selon la complétude
   - active si 100%, pending_validation sinon

🚀 UTILISATION DANS LE FRONTEND:
   - Appeler ces fonctions via RPC Supabase
   - Afficher notifications selon les champs manquants
' as rapport;
