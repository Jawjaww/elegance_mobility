-- Solution recommandée : Remplacer l'ancien trigger par le nouveau avec une logique améliorée

-- 1. Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS auto_update_driver_status_trigger ON drivers;

-- 2. Créer la fonction force_update_driver_status pour les mises à jour manuelles
CREATE OR REPLACE FUNCTION force_update_driver_status(driver_user_id UUID)
RETURNS TABLE(
    driver_id UUID,
    old_status driver_status,
    new_status driver_status,
    is_complete BOOLEAN,
    completion_percentage INTEGER
) AS $$
DECLARE
    driver_record RECORD;
    validation_result RECORD;
    calculated_status driver_status;
BEGIN
    -- Récupérer le chauffeur
    SELECT * INTO driver_record 
    FROM drivers 
    WHERE user_id = driver_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Driver not found for user_id: %', driver_user_id;
    END IF;
    
    -- Utiliser la fonction existante check_driver_profile_completeness
    SELECT * INTO validation_result 
    FROM check_driver_profile_completeness(driver_user_id) 
    LIMIT 1;
    
    -- Calculer le nouveau statut selon la logique améliorée
    IF validation_result.is_complete THEN
        -- Si complet, mettre en attente de validation
        IF driver_record.status IN ('incomplete', 'pending_validation') THEN
            calculated_status := 'pending_validation';
        ELSE
            -- Garder le statut existant si déjà actif/inactif/rejeté/suspendu
            calculated_status := driver_record.status;
        END IF;
    ELSE
        -- Si incomplet, marquer comme incomplet sauf si statut protégé
        IF driver_record.status IN ('incomplete', 'pending_validation') THEN
            calculated_status := 'incomplete';
        ELSE
            -- Garder le statut existant pour les statuts protégés
            calculated_status := driver_record.status;
        END IF;
    END IF;
    
    -- Mettre à jour si nécessaire
    IF calculated_status != driver_record.status THEN
        UPDATE drivers 
        SET 
            status = calculated_status,
            updated_at = NOW()
        WHERE user_id = driver_user_id;
        
        RAISE NOTICE 'Driver % status updated: % -> %', 
            driver_record.id, driver_record.status, calculated_status;
    END IF;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
        driver_record.id,
        driver_record.status,
        calculated_status,
        validation_result.is_complete,
        validation_result.completion_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer la fonction de trigger améliorée
CREATE OR REPLACE FUNCTION trigger_update_driver_status()
RETURNS TRIGGER AS $$
DECLARE
    validation_result RECORD;
    new_status driver_status;
BEGIN
    -- Utiliser la fonction existante
    SELECT * INTO validation_result 
    FROM check_driver_profile_completeness(NEW.user_id) 
    LIMIT 1;
    
    -- Logique de statut améliorée
    IF validation_result.is_complete THEN
        -- Si complet et actuellement incomplet ou en attente
        IF OLD.status IN ('incomplete', 'pending_validation') THEN
            new_status := 'pending_validation';
        ELSE
            -- Garder le statut existant pour les autres cas
            new_status := OLD.status;
        END IF;
    ELSE
        -- Si incomplet
        IF OLD.status IN ('pending_validation', 'incomplete') THEN
            new_status := 'incomplete';
        ELSE
            -- Garder le statut existant pour les autres cas
            new_status := OLD.status;
        END IF;
    END IF;
    
    -- Mettre à jour si nécessaire
    IF new_status != OLD.status THEN
        NEW.status := new_status;
        NEW.updated_at := NOW();
        
        RAISE NOTICE 'Trigger: Driver % status % -> % (complete: %)', 
            NEW.id, OLD.status, new_status, validation_result.is_complete;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Créer le nouveau trigger avec une liste précise de colonnes
CREATE TRIGGER trigger_auto_update_driver_status
    BEFORE UPDATE OF 
        first_name, last_name, phone, date_of_birth, 
        address_line1, city, postal_code, company_name,
        vtc_card_number, driving_license_number, insurance_number,
        avatar_url, document_urls
    ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_driver_status();

-- 5. Créer la fonction fix_all_driver_statuses pour les corrections en masse
CREATE OR REPLACE FUNCTION fix_all_driver_statuses()
RETURNS TABLE(
    updated_count INTEGER,
    incomplete_count INTEGER,
    pending_validation_count INTEGER,
    active_count INTEGER,
    inactive_count INTEGER,
    rejected_count INTEGER,
    suspended_count INTEGER
) AS $$
DECLARE
    updated_drivers INTEGER := 0;
    incomplete_drivers INTEGER := 0;
    pending_validation_drivers INTEGER := 0;
    active_drivers INTEGER := 0;
    inactive_drivers INTEGER := 0;
    rejected_drivers INTEGER := 0;
    suspended_drivers INTEGER := 0;
    driver_rec RECORD;
    update_result RECORD;
BEGIN
    -- Parcourir tous les chauffeurs
    FOR driver_rec IN SELECT * FROM drivers
    LOOP
        -- Utiliser la fonction force_update_driver_status pour mettre à jour le statut
        SELECT * INTO update_result 
        FROM force_update_driver_status(driver_rec.user_id);
        
        -- Compter les mises à jour
        IF update_result.old_status != update_result.new_status THEN
            updated_drivers := updated_drivers + 1;
        END IF;
    END LOOP;
    
    -- Compter les chauffeurs par statut après mise à jour
    SELECT COUNT(*) INTO incomplete_drivers FROM drivers WHERE status = 'incomplete';
    SELECT COUNT(*) INTO pending_validation_drivers FROM drivers WHERE status = 'pending_validation';
    SELECT COUNT(*) INTO active_drivers FROM drivers WHERE status = 'active';
    SELECT COUNT(*) INTO inactive_drivers FROM drivers WHERE status = 'inactive';
    SELECT COUNT(*) INTO rejected_drivers FROM drivers WHERE status = 'rejected';
    SELECT COUNT(*) INTO suspended_drivers FROM drivers WHERE status = 'suspended';
    
    -- Retourner les statistiques
    RETURN QUERY SELECT 
        updated_drivers,
        incomplete_drivers,
        pending_validation_drivers,
        active_drivers,
        inactive_drivers,
        rejected_drivers,
        suspended_drivers;
END;
$$ LANGUAGE plpgsql;

-- 6. Permissions
GRANT EXECUTE ON FUNCTION force_update_driver_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_update_driver_status() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_all_driver_statuses() TO authenticated;