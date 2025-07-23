-- VÉRIFICATION COMPLÉTUDE PROFIL DRIVER
-- Script à exécuter dans l'interface Supabase SQL Editor

-- 🔍 FONCTION : Vérifier si un profil driver est complet

CREATE OR REPLACE FUNCTION check_driver_profile_completeness(driver_user_id uuid)
RETURNS TABLE (
  is_complete boolean,
  completion_percentage integer,
  missing_fields text[]
) AS $$
DECLARE
  driver_record drivers%ROWTYPE;
  missing_list TEXT[] := '{}';
  total_fields INTEGER := 16; -- Ajusté : certificat médical optionnel
  completed_fields INTEGER := 0;
BEGIN
  SELECT * INTO driver_record FROM drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, ARRAY['profil_inexistant']::TEXT[];
    RETURN;
  END IF;
  
  -- 🆔 IDENTITÉ (4 champs)
  IF driver_record.first_name IS NOT NULL AND driver_record.first_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Prénom');
  END IF;
  
  IF driver_record.last_name IS NOT NULL AND driver_record.last_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom');
  END IF;
  
  IF driver_record.phone IS NOT NULL AND driver_record.phone != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Téléphone');
  END IF;
  
  IF driver_record.date_of_birth IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Date de naissance');
  END IF;
  
  -- 🏢 ENTREPRISE (1 champ)
  IF driver_record.company_name IS NOT NULL AND driver_record.company_name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Nom entreprise');
  END IF;
  
  -- 🏠 ADRESSE (3 champs)
  IF driver_record.address_line1 IS NOT NULL AND driver_record.address_line1 != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Adresse');
  END IF;
  
  IF driver_record.city IS NOT NULL AND driver_record.city != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Ville');
  END IF;
  
  IF driver_record.postal_code IS NOT NULL AND driver_record.postal_code != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Code postal');
  END IF;
  
  -- 📄 NUMÉROS DE DOCUMENTS (3 champs)
  IF driver_record.vtc_card_number IS NOT NULL AND driver_record.vtc_card_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro carte VTC');
  END IF;
  
  IF driver_record.driving_license_number IS NOT NULL AND driver_record.driving_license_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro permis');
  END IF;
  
  IF driver_record.insurance_number IS NOT NULL AND driver_record.insurance_number != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Numéro assurance');
  END IF;
  
  -- 📷 PHOTO DE PROFIL (1 champ)
  IF driver_record.avatar_url IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Photo de profil');
  END IF;
  
  -- 🚗 VÉHICULE (1 champ)
  IF EXISTS(SELECT 1 FROM driver_vehicles WHERE driver_id = driver_record.id) THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Véhicule');
  END IF;
  
  -- 📁 DOCUMENTS PHYSIQUES OBLIGATOIRES (3 champs)
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'driving_license') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document permis');
  END IF;
  
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'vtc_card') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document carte VTC');
  END IF;
  
  IF EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'insurance') THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_list := array_append(missing_list, 'Document assurance');
  END IF;
  
  RETURN QUERY SELECT 
    (array_length(missing_list, 1) IS NULL OR array_length(missing_list, 1) = 0),
    (completed_fields * 100 / total_fields),
    COALESCE(missing_list, '{}');
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
