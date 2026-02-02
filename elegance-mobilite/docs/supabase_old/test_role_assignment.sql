-- Script de test pour valider l'assignation des rôles
-- Exécuter après avoir appliqué la migration 20250613_fix_role_assignment.sql

-- 1. Vérifier que le trigger existe et est actif
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
  AND tgname = 'assign_user_role_trigger';

-- 2. Vérifier la fonction du trigger
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'assign_user_role_on_signup';

-- 3. Test manuel d'insertion (à adapter selon vos besoins)
-- ATTENTION: Ne pas exécuter en production, juste pour tester la logique

/*
-- Test 1: Utilisateur driver
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, created_at, updated_at, confirmed_at,
  raw_user_meta_data, raw_app_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test-driver@example.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  now(),
  '{"portal_type": "driver", "first_name": "Test", "last_name": "Driver"}'::jsonb,
  '{}'::jsonb
);

-- Test 2: Utilisateur customer
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, created_at, updated_at, confirmed_at,
  raw_user_meta_data, raw_app_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test-customer@example.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  now(),
  '{"portal_type": "customer", "first_name": "Test", "last_name": "Customer"}'::jsonb,
  '{}'::jsonb
);
*/

-- 4. Vérifier les rôles assignés aux utilisateurs de test
SELECT 
  email,
  raw_user_meta_data->>'portal_type' as portal_type,
  raw_app_meta_data->>'role' as assigned_role,
  created_at
FROM auth.users 
WHERE email LIKE 'test-%@example.com'
ORDER BY created_at DESC;

-- 5. Statistiques des rôles dans la base
SELECT 
  raw_app_meta_data->>'role' as role,
  COUNT(*) as count
FROM auth.users 
WHERE raw_app_meta_data->>'role' IS NOT NULL
GROUP BY raw_app_meta_data->>'role'
ORDER BY count DESC;
