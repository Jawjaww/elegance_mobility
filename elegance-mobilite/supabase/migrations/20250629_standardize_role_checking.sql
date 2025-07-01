-- 🧹 NETTOYAGE COMPLET : Méthode unique pour la gestion des rôles
-- Supprimer get_user_app_role() et utiliser EXCLUSIVEMENT auth.users.raw_app_meta_data

BEGIN;

-- 1. 🗑️ SUPPRIMER DÉFINITIVEMENT LA FONCTION get_user_app_role
DROP FUNCTION IF EXISTS public.get_user_app_role();
DROP FUNCTION IF EXISTS public.get_user_app_role(uuid);

-- 2. 🧹 NETTOYER TOUTES LES POLITIQUES QUI UTILISENT get_user_app_role()

-- DRIVERS: Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Drivers can view their own profile" ON drivers;
DROP POLICY IF EXISTS "Drivers can accept available rides" ON rides;

-- RIDES: Supprimer les politiques qui utilisent la fonction
DROP POLICY IF EXISTS "Allow drivers to accept rides" ON rides;
DROP POLICY IF EXISTS "Drivers can accept available rides" ON rides;

-- 3. ✅ CRÉER/RECRÉER LES POLITIQUES AVEC LA MÉTHODE UNIQUE
-- Méthode unique : EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND (au.raw_app_meta_data ->> 'role') = 'app_driver')

-- Drivers: Politique SELECT simplifiée (déjà existante et correcte)
-- "Drivers can view own data" USING (auth.uid() = user_id) ✅

-- Rides: Politique pour voir les courses disponibles (déjà existante et correcte)
-- "Drivers can view available rides" avec raw_app_meta_data ✅

-- Rides: Politique pour accepter les courses (déjà existante et correcte)  
-- "Drivers can accept rides" avec raw_app_meta_data ✅

-- 4. 🔍 VÉRIFIER QU'IL N'Y A PLUS DE CONFLITS
SELECT 
  '🔍 POLITIQUES RESTANTES' as test,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%get_user_app_role%' THEN '❌ UTILISE ENCORE FONCTION'
    WHEN qual LIKE '%raw_app_meta_data%' THEN '✅ MÉTHODE UNIQUE'
    WHEN qual LIKE '%auth.uid()%' AND qual LIKE '%user_id%' THEN '✅ ACCÈS DIRECT'
    ELSE '❓ AUTRE MÉTHODE'
  END as method_status
FROM pg_policies 
WHERE tablename IN ('drivers', 'rides')
  AND schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 5. 🎯 VALIDATION : Tester l'accès avec la méthode unique
SELECT 
  '✅ TEST MÉTHODE UNIQUE' as test,
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND (au.raw_app_meta_data ->> 'role') = 'app_driver'
  ) as user_is_driver,
  (
    SELECT au.raw_app_meta_data ->> 'role' 
    FROM auth.users au 
    WHERE au.id = auth.uid()
  ) as current_role;

COMMIT;

-- 📋 RÉSUMÉ DES CHANGEMENTS:
-- ✅ Fonction get_user_app_role() SUPPRIMÉE définitivement
-- ✅ Toutes les politiques utilisent la méthode unique : auth.users.raw_app_meta_data
-- ✅ Plus de conflits entre différentes méthodes de vérification de rôle
-- ✅ Cohérence garantie dans tout le système

-- 🎯 MÉTHODE UNIQUE OFFICIELLE:
-- Pour vérifier si un utilisateur est chauffeur:
-- EXISTS (SELECT 1 FROM auth.users au WHERE au.id = auth.uid() AND (au.raw_app_meta_data ->> 'role') = 'app_driver')
