-- 🚀 CRÉATION DE DRIVERS RÉELS AVEC VRAIS UUID
-- Supprime toutes les données de test et crée des drivers réels pour les tests

-- =================================================================
-- ÉTAPE 1: NETTOYER LES DONNÉES DE TEST
-- =================================================================

-- Supprimer les drivers de test avec des IDs non-UUID
DELETE FROM drivers WHERE id::text LIKE 'driver-%' OR id::text LIKE 'test-%';

-- =================================================================
-- ÉTAPE 2: VÉRIFIER LES DRIVERS EXISTANTS
-- =================================================================

-- Voir les drivers existants
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
ORDER BY d.created_at DESC;
DO $$
DECLARE
    test_user_id UUID;
    test_driver_id UUID;
BEGIN
    -- Utiliser l'utilisateur existant ou créer un test
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'be.j@icloud.com'
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        -- Si pas d'utilisateur, utiliser un UUID de test
        test_user_id := 'dc62bd52-0ed7-495b-9055-22635d6c5e74'::UUID;
    END IF;
    
    -- Vérifier si le driver existe déjà
    SELECT id INTO test_driver_id
    FROM drivers 
    WHERE user_id = test_user_id;
    
    IF test_driver_id IS NULL THEN
        -- Créer un nouveau driver complet
        INSERT INTO drivers (
            user_id,
            first_name,
            last_name,
            phone,
            status,
            company_name,
            company_phone,
            employee_name,
            employee_phone,
            vtc_card_number,
            vtc_card_expiry_date,
            driving_license_number,
            driving_license_expiry_date,
            insurance_number,
            insurance_expiry_date,
            rating,
            total_rides,
            languages_spoken,
            preferred_zones
        ) VALUES (
            test_user_id,
            'Jean',
            'Dupont',
            '0612345678',
            'pending_validation',
            'Transport VTC Premium',
            '0145678900',
            'Jean Dupont',
            '0612345678',
            'VTC789456123',
            '2026-12-31',
            'DL123456789',
            '2027-06-30',
            'INS987654321',
            '2026-12-31',
            4.8,
            42,
            ARRAY['français', 'anglais'],
            ARRAY['Paris', 'Banlieue', 'CDG', 'Orly']
        ) RETURNING id INTO test_driver_id;
        
        RAISE NOTICE '✅ Driver de test créé avec ID: %', test_driver_id;
    ELSE
        -- Mettre à jour le driver existant pour être complet
        UPDATE drivers SET
            first_name = COALESCE(first_name, 'Jean'),
            last_name = COALESCE(last_name, 'Dupont'),
            phone = COALESCE(phone, '0612345678'),
            company_name = COALESCE(company_name, 'Transport VTC Premium'),
            company_phone = COALESCE(company_phone, '0145678900'),
            employee_name = COALESCE(employee_name, 'Jean Dupont'),
            employee_phone = COALESCE(employee_phone, '0612345678'),
            vtc_card_number = COALESCE(vtc_card_number, 'VTC789456123'),
            vtc_card_expiry_date = COALESCE(vtc_card_expiry_date, '2026-12-31'),
            driving_license_number = COALESCE(driving_license_number, 'DL123456789'),
            driving_license_expiry_date = COALESCE(driving_license_expiry_date, '2027-06-30'),
            insurance_number = COALESCE(insurance_number, 'INS987654321'),
            insurance_expiry_date = COALESCE(insurance_expiry_date, '2026-12-31'),
            rating = COALESCE(rating, 4.8),
            total_rides = COALESCE(total_rides, 42),
            languages_spoken = COALESCE(languages_spoken, ARRAY['français', 'anglais']),
            preferred_zones = COALESCE(preferred_zones, ARRAY['Paris', 'Banlieue', 'CDG', 'Orly']),
            updated_at = NOW()
        WHERE id = test_driver_id;
        
        RAISE NOTICE '✅ Driver existant mis à jour avec ID: %', test_driver_id;
    END IF;
END $$;

-- =================================================================
-- ÉTAPE 3: CRÉER UN DEUXIÈME DRIVER ACTIF POUR TESTER
-- =================================================================

-- Insérer un deuxième driver déjà validé
INSERT INTO drivers (
    user_id,
    first_name,
    last_name,
    phone,
    status,
    company_name,
    company_phone,
    employee_name,
    employee_phone,
    vtc_card_number,
    vtc_card_expiry_date,
    driving_license_number,
    driving_license_expiry_date,
    insurance_number,
    insurance_expiry_date,
    rating,
    total_rides,
    languages_spoken,
    preferred_zones
) VALUES (
    gen_random_uuid(),
    'Marie',
    'Martin',
    '0698765432',
    'active',
    'Elite Transport',
    '0187654321',
    'Marie Martin',
    '0698765432',
    'VTC456789012',
    '2026-08-15',
    'DL987654321',
    '2028-03-20',
    'INS123456789',
    '2027-01-10',
    4.9,
    156,
    ARRAY['français', 'anglais', 'espagnol'],
    ARRAY['Paris', 'Versailles', 'Saint-Germain']
) ON CONFLICT (user_id) DO NOTHING;

-- =================================================================
-- ÉTAPE 4: AFFICHER LES DRIVERS CRÉÉS
-- =================================================================

-- Afficher tous les drivers avec leurs vrais UUIDs
SELECT 
    d.id,
    d.user_id,
    d.first_name,
    d.last_name,
    d.status,
    d.phone,
    d.company_name,
    u.email
FROM drivers d
LEFT JOIN auth.users u ON d.user_id = u.id
ORDER BY d.created_at DESC;

-- =================================================================
-- MESSAGE FINAL
-- =================================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 DRIVERS DE TEST CRÉÉS!';
  RAISE NOTICE '✅ Tous les drivers ont maintenant de vrais UUIDs';
  RAISE NOTICE '✅ Données complètes pour tester l''interface';
  RAISE NOTICE '📋 Copiez les IDs ci-dessus pour tester:';
  RAISE NOTICE '   - /backoffice-portal/chauffeurs/[UUID-RÉEL]';
  RAISE NOTICE '🚀 L''interface devrait maintenant fonctionner parfaitement!';
END $$;
