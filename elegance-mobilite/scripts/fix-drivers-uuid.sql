-- 🎯 SCRIPT SIMPLE POUR CORRIGER LES DONNÉES
-- Supprime les données de test et s'assure qu'on a des UUID réels

-- Supprimer les drivers avec des IDs de test
DELETE FROM drivers WHERE id::text LIKE 'driver-%' OR id::text LIKE 'test-%';

-- S'assurer que jaw ben existe avec un UUID réel
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
    languages_spoken,
    preferred_zones
) VALUES (
    'dc62bd52-0ed7-495b-9055-22635d6c5e74',
    'jaw',
    'ben',
    '0656765678',
    'pending_validation',
    'Transport Express',
    '0123456789',
    'jaw ben',
    '0656765678',
    'VTC123456',
    '2026-12-31',
    'DL789012',
    '2027-06-30',
    'INS345678',
    '2026-12-31',
    ARRAY['français', 'anglais'],
    ARRAY['Paris', 'Banlieue']
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    company_name = EXCLUDED.company_name,
    updated_at = NOW();

-- Afficher les drivers avec leurs vrais UUID
SELECT 
  d.id as "UUID réel",
  d.first_name || ' ' || d.last_name as "Nom",
  d.status,
  d.phone
FROM drivers d
ORDER BY d.created_at DESC;
