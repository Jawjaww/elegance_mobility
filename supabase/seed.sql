-- Seed script pour Elegance Mobilité
-- Données de test pour développement local
-- Exécuter avec : psql $DATABASE_URL -f supabase/seed.sql
-- Ou via Supabase CLI : supabase db reset (qui exécute les migrations + seed)

BEGIN;

-- ============================================
-- CRÉATION DES UTILISATEURS AUTH (GoTrue)
-- Utilise pgcrypto pour le hash du mot de passe
-- ============================================

-- Activer pgcrypto pour le hash des mots de passe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Créer les utilisateurs avec mot de passe "password123"
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- User 1: Admin Principal
  v_user_id := '00000000-0000-0000-0000-000000000001';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin1@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_super_admin", "provider": "email", "providers": ["email"]}', '{"first_name": "Admin", "last_name": "Principal"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "admin1@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- User 2: Admin Secondaire
  v_user_id := '00000000-0000-0000-0000-000000000002';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin2@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_admin", "provider": "email", "providers": ["email"]}', '{"first_name": "Admin", "last_name": "Secondaire"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "admin2@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- User 3: Jean Dupont (Driver)
  v_user_id := '00000000-0000-0000-0000-000000000003';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jean.dupont@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_driver", "provider": "email", "providers": ["email"]}', '{"first_name": "Jean", "last_name": "Dupont"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "jean.dupont@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- User 4: Marie Martin (Driver)
  v_user_id := '00000000-0000-0000-0000-000000000004';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marie.martin@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_driver", "provider": "email", "providers": ["email"]}', '{"first_name": "Marie", "last_name": "Martin"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "marie.martin@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- User 5: Pierre Bernard (Driver)
  v_user_id := '00000000-0000-0000-0000-000000000005';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pierre.bernard@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_driver", "provider": "email", "providers": ["email"]}', '{"first_name": "Pierre", "last_name": "Bernard"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "pierre.bernard@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- User 10: Client 1
  v_user_id := '00000000-0000-0000-0000-000000000010';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client1@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_customer", "provider": "email", "providers": ["email"]}', '{"first_name": "Client", "last_name": "Un"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "client1@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- User 11: Client 2
  v_user_id := '00000000-0000-0000-0000-000000000011';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client2@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_customer", "provider": "email", "providers": ["email"]}', '{"first_name": "Client", "last_name": "Deux"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "client2@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- User 12: Client 3
  v_user_id := '00000000-0000-0000-0000-000000000012';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client3@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_customer", "provider": "email", "providers": ["email"]}', '{"first_name": "Client", "last_name": "Trois"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "client3@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- User 13: Client 4
  v_user_id := '00000000-0000-0000-0000-000000000013';
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client4@elegance-mobilite.local', crypt('password123', gen_salt('bf')), NOW(), '{"role": "app_customer", "provider": "email", "providers": ["email"]}', '{"first_name": "Client", "last_name": "Quatre"}', NOW(), NOW(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, format('{"sub": "%s", "email": "client4@elegance-mobilite.local", "email_verified": true}', v_user_id)::jsonb, 'email', v_user_id, NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- CRÉER LES DONNÉES PUBLIQUES
-- ============================================

-- Table users
INSERT INTO public.users (id, first_name, last_name, phone, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Principal', '+33600000001', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Admin', 'Secondaire', '+33600000002', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Jean', 'Dupont', '+33612345678', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Marie', 'Martin', '+33623456789', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Pierre', 'Bernard', '+33634567890', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000010', 'Client', 'Un', '+33610000001', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'Client', 'Deux', '+33610000002', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', 'Client', 'Trois', '+33610000003', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', 'Client', 'Quatre', '+33610000004', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Profils avec rôles
DELETE FROM public.user_profiles WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000011'::uuid,
  '00000000-0000-0000-0000-000000000012'::uuid,
  '00000000-0000-0000-0000-000000000013'::uuid
);
INSERT INTO public.user_profiles (user_id, app_metadata, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '{"role": "app_super_admin"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '{"role": "app_admin"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', '{"role": "app_driver"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', '{"role": "app_driver"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', '{"role": "app_driver"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000010', '{"role": "app_customer"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', '{"role": "app_customer"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', '{"role": "app_customer"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000013', '{"role": "app_customer"}', NOW(), NOW());

-- ============================================
-- 2. CRÉER LES CHAUFFEURS
-- ============================================

INSERT INTO public.drivers (
  id, user_id, first_name, last_name, phone, status, 
  vtc_card_number, vtc_card_expiry_date,
  driving_license_number, driving_license_expiry_date,
  insurance_number, insurance_expiry_date,
  created_at, updated_at
) VALUES 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    'Jean', 'Dupont',
    '+33612345678',
    'active',
    'VTC2024001',
    '2026-12-31',
    'FR123456789',
    '2027-06-15',
    'INS-001-2024',
    '2027-12-31',
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    'Marie', 'Martin',
    '+33623456789',
    'active',
    'VTC2024002',
    '2026-11-30',
    'FR987654321',
    '2027-03-20',
    'INS-002-2024',
    '2027-11-30',
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000005',
    'Pierre', 'Bernard',
    '+33634567890',
    'pending_validation',
    'VTC2024003',
    '2026-10-31',
    'FR456789123',
    '2027-01-10',
    'INS-003-2024',
    '2027-10-31',
    NOW(), NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. CRÉER LES VÉHICULES
-- ============================================

INSERT INTO public.vehicles (
  id, driver_id, vehicle_type, license_plate, 
  make, model, year, seats, is_primary, created_at, updated_at
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM public.drivers WHERE first_name = 'Jean' LIMIT 1),
    'STANDARD',
    'AB-123-CD',
    'Mercedes',
    'Classe E',
    2023,
    4,
    true,
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM public.drivers WHERE first_name = 'Marie' LIMIT 1),
    'PREMIUM',
    'EF-456-GH',
    'BMW',
    'Série 5',
    2022,
    4,
    true,
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM public.drivers WHERE first_name = 'Pierre' LIMIT 1),
    'VAN',
    'IJ-789-KL',
    'Mercedes',
    'V-Class',
    2023,
    7,
    true,
    NOW(), NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CRÉER LES TARIFS
-- ============================================

INSERT INTO public.rates (
  vehicle_type, base_price, price_per_km, min_price, created_at, updated_at
) VALUES 
  ('STANDARD', 25.00, 2.50, 15.00, NOW(), NOW()),
  ('PREMIUM', 45.00, 4.00, 30.00, NOW(), NOW()),
  ('VAN', 60.00, 5.00, 40.00, NOW(), NOW()),
  ('ELECTRIC', 35.00, 3.00, 20.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. CRÉER LES COURSES (RIDES)
-- ============================================

-- Suppression des rides existantes pour éviter les conflits
DELETE FROM public.rides WHERE user_id IN (
  '00000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000011'::uuid,
  '00000000-0000-0000-0000-000000000012'::uuid,
  '00000000-0000-0000-0000-000000000013'::uuid
);

INSERT INTO public.rides (
  id, user_id, driver_id, override_vehicle_id, status,
  pickup_address, pickup_lat, pickup_lon,
  dropoff_address, dropoff_lat, dropoff_lon,
  pickup_time, distance, duration, vehicle_type, options,
  estimated_price, final_price, created_at, updated_at, price, pickup_notes
) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010', (SELECT id FROM public.drivers WHERE first_name = 'Jean' LIMIT 1), NULL, 'completed', 'Aéroport Charles de Gaulle, Terminal 2', 49.0097, 2.5479, 'Tour Eiffel, Paris', 48.8584, 2.2945, NOW() - INTERVAL '2 days', 32.5, 45, 'STANDARD', '{}', 85.00, 85.00, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 85.00, NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000011', (SELECT id FROM public.drivers WHERE first_name = 'Marie' LIMIT 1), NULL, 'in-progress', 'Gare du Nord, Paris', 48.8809, 2.3553, 'Château de Versailles', 48.8049, 2.1204, NOW(), 25.0, 35, 'PREMIUM', '{}', 120.00, 120.00, NOW() - INTERVAL '30 minutes', NOW(), 120.00, NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000012', NULL, NULL, 'pending', 'Aéroport Orly, Terminal Sud', 48.7262, 2.3652, 'Place de la Concorde, Paris', 48.8656, 2.3212, NOW() + INTERVAL '2 hours', 18.5, 30, 'STANDARD', '{}', 65.00, 65.00, NOW() - INTERVAL '1 hour', NOW(), 65.00, NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000013', NULL, NULL, 'pending', 'Gare de Lyon, Paris', 48.8448, 2.3735, 'Disneyland Paris', 48.8724, 2.7758, NOW() + INTERVAL '4 hours', 45.0, 50, 'VAN', '{}', 95.00, 95.00, NOW() - INTERVAL '30 minutes', NOW(), 95.00, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. CRÉER LES OPTIONS
-- ============================================

INSERT INTO public.options (
  id, name, description, price, available, created_at, updated_at
) VALUES 
  (
    gen_random_uuid(),
    'Siège bébé',
    'Siège enfant pour bébé (0-12 mois)',
    5.00,
    true,
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'Rehausseur',
    'Rehausseur pour enfant (1-3 ans)',
    3.00,
    true,
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'Attente aéroport',
    '30 minutes d''attente incluse à l''aéroport',
    15.00,
    true,
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'Boissons premium',
    'Bouteilles d''eau et rafraîchissements',
    8.00,
    true,
    NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'WiFi à bord',
    'Connexion WiFi haut débit dans le véhicule',
    0.00,
    true,
    NOW(), NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. CRÉER DES PROMOTIONS (OPTIONNEL)
-- ============================================

INSERT INTO public.promo_codes (
  id, code, description, promo_type, value, min_ride_value, max_discount, max_uses, uses_per_user,
  start_date, end_date, active, created_at, updated_at
) VALUES 
  (
    gen_random_uuid(),
    'BIENVENUE2026',
    '20% de réduction pour les nouveaux clients',
    'percentage',
    20.00,
    NULL,
    NULL,
    100,
    NULL,
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'VIP10',
    '10€ de réduction sur votre prochaine course',
    'fixed_amount',
    10.00,
    50.00,
    NULL,
    50,
    NULL,
    NOW(),
    NOW() + INTERVAL '60 days',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. LOGS D'AUDIT (EXEMPLES)
-- ============================================

INSERT INTO public.audit_logs (
  event_type, ride_id, service, calculated_price, metadata, created_at
) VALUES 
  (
    'ride_created',
    (SELECT id FROM public.rides WHERE status = 'completed' LIMIT 1),
    'rides',
    85.00,
    '{"source": "mobile_app", "client_type": "individual"}'::jsonb,
    NOW() - INTERVAL '2 days'
  ),
  (
    'ride_completed',
    (SELECT id FROM public.rides WHERE status = 'completed' LIMIT 1),
    'rides',
    85.00,
    '{"payment_method": "card", "rating": 5}'::jsonb,
    NOW() - INTERVAL '2 days' + INTERVAL '1 hour'
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 'Données de seed insérées avec succès' as status;

-- Compteurs
SELECT 
  (SELECT COUNT(*) FROM public.user_profiles) as user_profiles,
  (SELECT COUNT(*) FROM public.drivers) as drivers,
  (SELECT COUNT(*) FROM public.vehicles) as vehicles,
  (SELECT COUNT(*) FROM public.rates) as rates,
  (SELECT COUNT(*) FROM public.rides) as rides,
  (SELECT COUNT(*) FROM public.options) as options,
  (SELECT COUNT(*) FROM public.promo_codes) as promo_codes,
  (SELECT COUNT(*) FROM public.audit_logs) as audit_logs;
