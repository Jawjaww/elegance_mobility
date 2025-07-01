-- 🎯 VALIDATION ET CRÉATION DE DONNÉES DE TEST
-- Vérifions d'abord s'il y a des drivers réels, sinon on va valider celui qui existe

-- =================================================================
-- ÉTAPE 1: VÉRIFIER LES DRIVERS EXISTANTS
-- =================================================================

-- Voir tous les drivers avec leurs IDs
SELECT 
  d.id,
  d.user_id,
  d.first_name,
  d.last_name,
  d.status,
  d.created_at,
  u.email
FROM drivers d
LEFT JOIN auth.users u ON d.user_id = u.id
ORDER BY d.created_at DESC;

-- =================================================================
-- ÉTAPE 2: VALIDER LE DRIVER EXISTANT
-- =================================================================

-- Valider le driver existant (jaw ben) s'il est encore en pending_validation
DO $$
DECLARE
    driver_record RECORD;
BEGIN
    -- Récupérer le premier driver en pending_validation
    SELECT * INTO driver_record 
    FROM drivers 
    WHERE status = 'pending_validation' 
    AND user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74'
    LIMIT 1;
    
    IF FOUND THEN
        -- Valider le driver
        UPDATE drivers 
        SET 
          status = 'active',
          updated_at = NOW()
        WHERE id = driver_record.id;
        
        RAISE NOTICE '✅ Driver validé: % % (ID: %)', driver_record.first_name, driver_record.last_name, driver_record.id;
    ELSE
        RAISE NOTICE '⚠️ Aucun driver en pending_validation trouvé pour cet utilisateur';
    END IF;
END $$;

-- =================================================================
-- ÉTAPE 3: AFFICHER LE RÉSULTAT
-- =================================================================

-- Afficher les drivers après validation
SELECT 
  d.id,
  d.user_id,
  d.first_name,
  d.last_name,
  d.status,
  d.phone,
  u.email
FROM drivers d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE d.user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';

-- =================================================================
-- MESSAGE FINAL
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 ACTIONS SUIVANTES:';
  RAISE NOTICE '1. Utilisez l''ID UUID réel du driver (affiché ci-dessus)';
  RAISE NOTICE '2. Naviguez vers /backoffice-portal/chauffeurs';
  RAISE NOTICE '3. Cliquez sur "Voir profil" du vrai driver';
  RAISE NOTICE '4. L''URL devrait être /backoffice-portal/chauffeurs/[UUID-RÉEL]';
END $$;
