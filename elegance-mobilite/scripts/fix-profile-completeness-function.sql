-- 🔧 CORRECTION DE LA FONCTION check_driver_profile_completeness
-- Inclure la vérification des documents uploadés

BEGIN;

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.check_driver_profile_completeness(uuid);

-- Recréer la fonction avec vérification des documents
CREATE OR REPLACE FUNCTION public.check_driver_profile_completeness(driver_user_id uuid)
RETURNS TABLE (
  is_complete boolean,
  missing_fields text[],
  completion_percentage integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  driver_record record;
  missing_list text[] := '{}';
  total_fields integer := 10; -- Augmenté pour inclure les documents
  completed_fields integer := 0;
  has_driving_license_doc boolean := false;
  has_vtc_card_doc boolean := false;
BEGIN
  -- Récupérer le driver
  SELECT * INTO driver_record FROM public.drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ARRAY['profil_inexistant'], 0;
    RETURN;
  END IF;
  
  -- Vérifier les documents uploadés
  SELECT EXISTS(
    SELECT 1 FROM public.driver_documents 
    WHERE driver_id = driver_user_id 
    AND document_type = 'driving_license' 
    AND file_url IS NOT NULL
  ) INTO has_driving_license_doc;
  
  SELECT EXISTS(
    SELECT 1 FROM public.driver_documents 
    WHERE driver_id = driver_user_id 
    AND document_type = 'vtc_card' 
    AND file_url IS NOT NULL
  ) INTO has_vtc_card_doc;
  
  -- Vérifier chaque champ obligatoire
  IF driver_record.first_name IS NULL OR driver_record.first_name = '' THEN
    missing_list := array_append(missing_list, 'Prénom');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.phone IS NULL OR driver_record.phone = '' THEN
    missing_list := array_append(missing_list, 'Téléphone');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.company_name IS NULL OR driver_record.company_name = '' OR driver_record.company_name = 'Non renseigné' THEN
    missing_list := array_append(missing_list, 'Entreprise');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.company_phone IS NULL OR driver_record.company_phone = '' THEN
    missing_list := array_append(missing_list, 'Tél. entreprise');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.driving_license_number IS NULL OR driver_record.driving_license_number = '' THEN
    missing_list := array_append(missing_list, 'Numéro permis');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.driving_license_expiry_date IS NULL THEN
    missing_list := array_append(missing_list, 'Expiration permis');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.vtc_card_number IS NULL OR driver_record.vtc_card_number = '' THEN
    missing_list := array_append(missing_list, 'Numéro carte VTC');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF driver_record.vtc_card_expiry_date IS NULL THEN
    missing_list := array_append(missing_list, 'Expiration VTC');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  -- Vérifier les documents uploadés
  IF NOT has_driving_license_doc THEN
    missing_list := array_append(missing_list, 'Document permis');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF NOT has_vtc_card_doc THEN
    missing_list := array_append(missing_list, 'Document carte VTC');
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

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.check_driver_profile_completeness(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_driver_profile_completeness(uuid) TO anon;

COMMENT ON FUNCTION public.check_driver_profile_completeness(uuid) IS 
'Fixed: Includes document verification for driving license and VTC card uploads';

COMMIT;

-- 🧪 Test de la fonction corrigée
SELECT 
  'Updated Function Test' as test,
  is_complete,
  missing_fields,
  completion_percentage
FROM check_driver_profile_completeness('dc62bd52-0ed7-495b-9055-22635d6c5e74');

-- 🎯 AMÉLIORATIONS:
-- ✅ Vérifie maintenant les documents uploadés dans driver_documents
-- ✅ Libellés plus clairs pour l'affichage frontend
-- ✅ Gestion du cas "Non renseigné" pour company_name
-- ✅ Total sur 10 champs au lieu de 8
