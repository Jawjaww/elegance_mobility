-- VÉRIFICATION COMPLÉTUDE PROFIL DRIVER - VERSION FINALE
-- Script à exécuter dans l'interface Supabase SQL Editor

-- ⚠️ ÉTAPE 1 : NETTOYER LES FONCTIONS REDONDANTES EXISTANTES
-- Exécutez d'abord ces commandes pour supprimer les anciennes versions :

/*
DROP FUNCTION IF EXISTS check_driver_profile_completeness(uuid);
DROP FUNCTION IF EXISTS check_driver_profile_completeness_simple(uuid);
DROP FUN-- 🔧 EXEMPLES D'UTILISATION EN PRODUCTION

/*
-- Pour un driver : vérifier son propre profil
SELECT * FROM check_driver_profile_completeness(auth.uid());
SELECT * FROM get_driver_completeness_details();

-- Pour un admin : analyser n'importe quel driver  
SELECT * FROM get_driver_completeness_details('user-id-du-driver');
SELECT * FROM get_incomplete_drivers_report();

-- Mise à jour automatique du statut après modification profil
SELECT update_driver_status_auto(auth.uid());

-- Vérifier les permissions (nouvelles fonctions nettoyées)
SELECT is_admin(); -- true si app_admin ou app_super_admin
SELECT is_super_admin(); -- true si app_super_admin uniquement
SELECT get_user_role(); -- retourne le rôle actuel depuis JWT
*/ check_driver_profile_completeness_complete(uuid);
DROP FUNCTION IF EXISTS debug_check_driver_profile_completeness(uuid);
DROP FUNCTION IF EXISTS update_driver_status_based_on_completeness(uuid);
DROP FUNCTION IF EXISTS update_driver_status_auto(uuid);
DROP FUNCTION IF EXISTS get_incomplete_drivers_report();
*/

-- 🎯 FONCTION PRINCIPALE : Vérification complète et définitive
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
    RETURN QUERY SELECT false, 0, ARRAY['Driver not found']::TEXT[];
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
  
  -- 📁 DOCUMENTS PHYSIQUES OBLIGATOIRES (3 champs) - Ajusté selon l'interface
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

-- 🔄 FONCTION : Gestion automatique des statuts
CREATE OR REPLACE FUNCTION update_driver_status_auto(driver_user_id uuid)
RETURNS text AS $$
DECLARE
  completeness_result record;
  new_status text;
  current_status text;
BEGIN
  SELECT status INTO current_status FROM drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN 'Driver introuvable';
  END IF;
  
  SELECT * INTO completeness_result 
  FROM check_driver_profile_completeness(driver_user_id);
  
  IF NOT FOUND THEN
    RETURN 'Erreur lors de la vérification';
  END IF;
  
  IF completeness_result.is_complete THEN
    IF current_status = 'incomplete' OR current_status IS NULL THEN
      new_status := 'pending_validation';
    ELSE
      new_status := current_status;
    END IF;
  ELSE
    new_status := 'incomplete';
  END IF;
  
  IF new_status != current_status OR current_status IS NULL THEN
    UPDATE drivers 
    SET status = new_status::driver_status, updated_at = NOW()
    WHERE user_id = driver_user_id;
    
    RETURN format('Statut: %s → %s (%s%%)', 
                  COALESCE(current_status, 'null'), new_status, completeness_result.completion_percentage);
  ELSE
    RETURN format('Statut inchangé: %s (%s%%)', 
                  current_status, completeness_result.completion_percentage);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 📊 FONCTION D'ADMINISTRATION : Rapport des profils incomplets
CREATE OR REPLACE FUNCTION get_incomplete_drivers_report()
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  status driver_status,
  is_complete boolean,
  completion_percentage integer,
  missing_fields text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.user_id, d.first_name, d.last_name, d.status,
    completeness.is_complete, completeness.completion_percentage, completeness.missing_fields
  FROM drivers d
  CROSS JOIN LATERAL check_driver_profile_completeness(d.user_id) AS completeness
  WHERE NOT completeness.is_complete
    AND completeness.missing_fields != ARRAY['Driver not found']
  ORDER BY completeness.completion_percentage DESC, d.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 📊 FONCTION D'ADMINISTRATION : Statistiques globales
CREATE OR REPLACE FUNCTION get_drivers_completeness_stats()
RETURNS TABLE (
  total_drivers integer,
  complete_drivers integer,
  incomplete_drivers integer,
  pending_validation integer,
  average_completion_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer,
    COUNT(CASE WHEN completeness.is_complete THEN 1 END)::integer,
    COUNT(CASE WHEN NOT completeness.is_complete THEN 1 END)::integer,
    COUNT(CASE WHEN d.status = 'pending_validation' THEN 1 END)::integer,
    ROUND(AVG(completeness.completion_percentage), 2)
  FROM drivers d
  CROSS JOIN LATERAL check_driver_profile_completeness(d.user_id) AS completeness
  WHERE completeness.missing_fields != ARRAY['Driver not found'];
END;
$$ LANGUAGE plpgsql;

-- 🔍 FONCTION DE DEBUG : Détail de la vérification
CREATE OR REPLACE FUNCTION debug_driver_completeness(driver_user_id uuid)
RETURNS TABLE (
  check_name text,
  field_value text,
  is_valid boolean,
  field_category text
) AS $$
DECLARE
  driver_record drivers%ROWTYPE;
BEGIN
  SELECT * INTO driver_record FROM drivers WHERE user_id = driver_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'Driver', 'NOT FOUND', false, 'ERROR';
    RETURN;
  END IF;
  
  -- IDENTITÉ
  RETURN QUERY SELECT 'Prénom', COALESCE(driver_record.first_name, 'NULL'), (driver_record.first_name IS NOT NULL AND driver_record.first_name != ''), 'IDENTITÉ';
  RETURN QUERY SELECT 'Nom', COALESCE(driver_record.last_name, 'NULL'), (driver_record.last_name IS NOT NULL AND driver_record.last_name != ''), 'IDENTITÉ';
  RETURN QUERY SELECT 'Téléphone', COALESCE(driver_record.phone, 'NULL'), (driver_record.phone IS NOT NULL AND driver_record.phone != ''), 'IDENTITÉ';
  RETURN QUERY SELECT 'Date de naissance', COALESCE(driver_record.date_of_birth::text, 'NULL'), (driver_record.date_of_birth IS NOT NULL), 'IDENTITÉ';
  
  -- ENTREPRISE
  RETURN QUERY SELECT 'Nom entreprise', COALESCE(driver_record.company_name, 'NULL'), (driver_record.company_name IS NOT NULL AND driver_record.company_name != ''), 'ENTREPRISE';
  
  -- ADRESSE
  RETURN QUERY SELECT 'Adresse', COALESCE(driver_record.address_line1, 'NULL'), (driver_record.address_line1 IS NOT NULL AND driver_record.address_line1 != ''), 'ADRESSE';
  RETURN QUERY SELECT 'Ville', COALESCE(driver_record.city, 'NULL'), (driver_record.city IS NOT NULL AND driver_record.city != ''), 'ADRESSE';
  RETURN QUERY SELECT 'Code postal', COALESCE(driver_record.postal_code, 'NULL'), (driver_record.postal_code IS NOT NULL AND driver_record.postal_code != ''), 'ADRESSE';
  
  -- DOCUMENTS NUMÉROS
  RETURN QUERY SELECT 'Numéro carte VTC', COALESCE(driver_record.vtc_card_number, 'NULL'), (driver_record.vtc_card_number IS NOT NULL AND driver_record.vtc_card_number != ''), 'DOCUMENTS';
  RETURN QUERY SELECT 'Numéro permis', COALESCE(driver_record.driving_license_number, 'NULL'), (driver_record.driving_license_number IS NOT NULL AND driver_record.driving_license_number != ''), 'DOCUMENTS';
  RETURN QUERY SELECT 'Numéro assurance', COALESCE(driver_record.insurance_number, 'NULL'), (driver_record.insurance_number IS NOT NULL AND driver_record.insurance_number != ''), 'DOCUMENTS';
  
  -- PHOTO
  RETURN QUERY SELECT 'Photo de profil', COALESCE(driver_record.avatar_url, 'NULL'), (driver_record.avatar_url IS NOT NULL), 'PHOTO';
  
  -- VÉHICULE
  RETURN QUERY SELECT 'Véhicule', 
    CASE WHEN EXISTS(SELECT 1 FROM driver_vehicles WHERE driver_id = driver_record.id) THEN 'PRÉSENT' ELSE 'ABSENT' END,
    EXISTS(SELECT 1 FROM driver_vehicles WHERE driver_id = driver_record.id),
    'VÉHICULE';
  
  -- DOCUMENTS PHYSIQUES
  RETURN QUERY SELECT 'Document permis', 
    CASE WHEN EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'driving_license') THEN 'UPLOADÉ' ELSE 'MANQUANT' END,
    EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'driving_license'),
    'FICHIERS';
    
  RETURN QUERY SELECT 'Document carte VTC', 
    CASE WHEN EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'vtc_card') THEN 'UPLOADÉ' ELSE 'MANQUANT' END,
    EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'vtc_card'),
    'FICHIERS';
    
  RETURN QUERY SELECT 'Document assurance', 
    CASE WHEN EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'insurance') THEN 'UPLOADÉ' ELSE 'MANQUANT' END,
    EXISTS(SELECT 1 FROM driver_documents WHERE driver_id = driver_record.id AND document_type = 'insurance'),
    'FICHIERS';
END;
$$ LANGUAGE plpgsql;

-- 🧪 DIAGNOSTIC ET ADMINISTRATION

-- 📋 FONCTION : Diagnostic complet de profil driver avec gestion des permissions
CREATE OR REPLACE FUNCTION get_driver_completeness_details(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  section text,
  info text,
  details jsonb
) AS $$
DECLARE
  target_id uuid;
  is_authorized boolean := false;
BEGIN
  -- Déterminer l'utilisateur à analyser
  IF target_user_id IS NULL THEN
    target_id := auth.uid(); -- Analyse de son propre profil
    is_authorized := true;
  ELSE
    target_id := target_user_id;
    -- Utiliser les nouvelles fonctions nettoyées qui vérifient les bons rôles JWT
    is_authorized := (
      is_admin() OR is_super_admin() OR auth.uid() = target_user_id
    );
  END IF;
  
  IF NOT is_authorized THEN
    RETURN QUERY SELECT 'ERREUR'::text, 'Accès non autorisé'::text, 
      jsonb_build_object('error', 'Permission refusée');
    RETURN;
  END IF;
  
  -- Vérifier que le driver existe
  IF NOT EXISTS(SELECT 1 FROM drivers WHERE user_id = target_id) THEN
    RETURN QUERY SELECT 'ERREUR'::text, 'Driver introuvable'::text, 
      jsonb_build_object('user_id', target_id);
    RETURN;
  END IF;
  
  -- 1. Informations générales
  RETURN QUERY 
  SELECT 'INFO'::text, 'Utilisateur analysé'::text, 
    jsonb_build_object(
      'user_id', target_id,
      'analyzed_by', auth.uid(),
      'is_self_analysis', (auth.uid() = target_id)
    );
  
  -- 2. Résultat de complétude
  RETURN QUERY 
  SELECT 'COMPLETUDE'::text, 'Résultat principal'::text,
    row_to_json(comp)::jsonb
  FROM check_driver_profile_completeness(target_id) comp;
  
  -- 3. Détail par champ
  RETURN QUERY 
  SELECT 'DÉTAIL'::text, 'Vérification par champ'::text,
    jsonb_agg(
      jsonb_build_object(
        'champ', debug.check_name,
        'valeur', debug.field_value,
        'valide', debug.is_valid,
        'catégorie', debug.field_category
      )
    )
  FROM debug_driver_completeness(target_id) debug;
  
  -- 4. Documents uploadés
  RETURN QUERY 
  SELECT 'DOCUMENTS'::text, 'Fichiers uploadés'::text,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'type', dd.document_type,
        'nom', dd.file_name,
        'taille', dd.file_size,
        'date', dd.uploaded_at
      )
    ), '[]'::jsonb)
  FROM drivers d
  LEFT JOIN driver_documents dd ON d.id = dd.driver_id
  WHERE d.user_id = target_id AND dd.id IS NOT NULL;
  
  -- 5. Véhicules
  RETURN QUERY 
  SELECT 'VÉHICULES'::text, 'Véhicules enregistrés'::text,
    jsonb_build_object(
      'count', COUNT(*),
      'vehicles', COALESCE(jsonb_agg(
        jsonb_build_object(
          'marque', dv.brand,
          'modèle', dv.model,
          'immatriculation', dv.license_plate
        )
      ), '[]'::jsonb)
    )
  FROM drivers d
  LEFT JOIN driver_vehicles dv ON d.id = dv.driver_id
  WHERE d.user_id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- � EXEMPLES D'UTILISATION SÉCURISÉS

/*
-- Pour un driver : tester son propre profil
SELECT * FROM test_driver_completeness_full();

-- Pour un admin : tester n'importe quel driver  
SELECT * FROM test_driver_completeness_full('user-id-du-driver');

-- Test rapide de complétude seulement
SELECT * FROM check_driver_profile_completeness(auth.uid());

-- Rapport admin (seulement pour admin/superadmin)
SELECT * FROM get_incomplete_drivers_report();
*/

SELECT * FROM get_incomplete_drivers_report() LIMIT 5;
SELECT * FROM get_drivers_completeness_stats();

-- ✅ SYSTÈME DE VÉRIFICATION PROFIL DRIVER - PRODUCTION
SELECT '
🎯 SYSTÈME DE VÉRIFICATION PROFIL DRIVER - PRODUCTION

FONCTIONS PRINCIPALES :
1. check_driver_profile_completeness(uuid) - Vérification complétude
2. update_driver_status_auto(uuid) - Gestion automatique statuts  
3. get_incomplete_drivers_report() - Rapport admin uniquement
4. get_drivers_completeness_stats() - Statistiques globales
5. get_driver_completeness_details(uuid) - Diagnostic détaillé avec permissions

SÉCURITÉ :
- Drivers peuvent vérifier leur propre profil
- Admins/Super-admins peuvent vérifier tous les profils (fonctions nettoyées)
- Fonctions avec SECURITY DEFINER et vérification des rôles JWT cohérents

UTILISATION EN PRODUCTION :
-- Pour un driver (son propre profil) :
SELECT * FROM check_driver_profile_completeness(auth.uid());
SELECT * FROM get_driver_completeness_details();

-- Pour un admin (n''importe quel profil) :
SELECT * FROM get_driver_completeness_details(''user-id-target'');
SELECT * FROM get_incomplete_drivers_report();

16 CHAMPS OBLIGATOIRES VÉRIFIÉS
WORKFLOW : incomplete → pending_validation → active
' as info;

-- 🚀 POLITIQUES RLS POUR SÉCURISER L''ACCÈS

DROP POLICY IF EXISTS "Drivers can check own completeness" ON drivers;
-- Politique pour que les drivers puissent voir leur propre complétude
CREATE POLICY "Drivers can check own completeness" ON drivers
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les admins puissent voir tous les drivers
DROP POLICY IF EXISTS "Admins can view all drivers" ON drivers;

CREATE POLICY "Admins can view all drivers" ON drivers
FOR SELECT USING (
  is_admin() OR is_super_admin()
);

-- Note: Ces politiques s'ajoutent aux politiques existantes
-- Vérifiez qu'elles ne créent pas de conflits avec vos politiques actuelles
