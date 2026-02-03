-- ============================================================================
-- MIGRATION: Standardisation de la gestion des rôles
-- But: Unifier la méthode de stockage et vérification des rôles
-- Source de vérité: auth.users.raw_app_meta_data->>'role'
-- ============================================================================

-- ============================================================================
-- 1. SUPPRESSION DES FONCTIONS DUPLIQUEES/OBSOLETES
-- ============================================================================

DROP FUNCTION IF EXISTS public.check_is_admin();
DROP FUNCTION IF EXISTS public.check_is_super_admin();
DROP FUNCTION IF EXISTS public.is_driver();

-- ============================================================================
-- 2. FONCTIONS STANDARDISEES DE VERIFICATION DE ROLE
-- Toutes utilisent auth.users.raw_app_meta_data->>'role' comme source
-- ============================================================================

-- Vérifie si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      raw_app_meta_data->>'role',
      raw_user_meta_data->>'role'
    ) = 'app_admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Vérifie si l'utilisateur est super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      raw_app_meta_data->>'role',
      raw_user_meta_data->>'role'
    ) = 'app_super_admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Vérifie si l'utilisateur est chauffeur
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      raw_app_meta_data->>'role',
      raw_user_meta_data->>'role'
    ) = 'app_driver'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Vérifie si l'utilisateur est client
CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      raw_app_meta_data->>'role',
      raw_user_meta_data->>'role'
    ) = 'app_customer'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Récupère le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      raw_app_meta_data->>'role',
      raw_user_meta_data->>'role',
      'app_customer' -- valeur par défaut
    )
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Vérifie si l'utilisateur a un des rôles donnés
CREATE OR REPLACE FUNCTION public.has_any_role(allowed_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT COALESCE(raw_app_meta_data->>'role', raw_user_meta_data->>'role')
  INTO user_role
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN user_role = ANY(allowed_roles);
END;
$$;

-- ============================================================================
-- 3. MISE A JOUR DU TRIGGER handle_new_user
-- ============================================================================

-- Recrée la fonction avec la logique standardisée
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
BEGIN
  -- Récupère le rôle depuis les métadonnées
  user_role := COALESCE(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'app_customer' -- défaut
  );

  -- Crée l'utilisateur dans public.users
  INSERT INTO public.users (
    id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Crée le profil dans user_profiles avec le rôle
  INSERT INTO public.user_profiles (
    user_id,
    app_metadata,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    jsonb_build_object('role', user_role),
    user_role,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    app_metadata = jsonb_build_object('role', user_role),
    role = user_role,
    updated_at = NOW();

  -- Si c'est un driver, crée le profil driver
  IF user_role = 'app_driver' THEN
    INSERT INTO public.drivers (
      user_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      'incomplete',
      NOW(),
      NOW()
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. MISE A JOUR DES POLITIQUES RLS EXISTANTES
-- ============================================================================

-- Fonction helper pour les politiques RLS
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    raw_app_meta_data->>'role',
    raw_user_meta_data->>'role',
    'app_customer'
  )
  FROM auth.users
  WHERE id = auth.uid();
$$;

-- ============================================================================
-- 5. SYNCHRONISATION DES ROLES EXISTANTS
-- ============================================================================

-- Met à jour user_profiles.role depuis auth.users pour tous les utilisateurs
UPDATE public.user_profiles up
SET 
  role = COALESCE(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role', 'app_customer'),
  app_metadata = jsonb_build_object('role', COALESCE(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role', 'app_customer'))
FROM auth.users u
WHERE up.user_id = u.id;

-- ============================================================================
-- 6. COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.is_admin() IS 'Vérifie si l''utilisateur courant a le role app_admin (depuis auth.users.raw_app_meta_data)';
COMMENT ON FUNCTION public.is_super_admin() IS 'Vérifie si l''utilisateur courant a le role app_super_admin (depuis auth.users.raw_app_meta_data)';
COMMENT ON FUNCTION public.is_driver() IS 'Vérifie si l''utilisateur courant a le role app_driver (depuis auth.users.raw_app_meta_data)';
COMMENT ON FUNCTION public.is_customer() IS 'Vérifie si l''utilisateur courant a le role app_customer (depuis auth.users.raw_app_meta_data)';
COMMENT ON FUNCTION public.get_user_role() IS 'Récupère le role de l''utilisateur courant (depuis auth.users.raw_app_meta_data)';
COMMENT ON FUNCTION public.has_any_role(text[]) IS 'Vérifie si l''utilisateur courant a un des rôles fournis';

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

SELECT 'Standardisation des rôles terminée' as status;
SELECT 
  'Fonctions créées: is_admin, is_super_admin, is_driver, is_customer, get_user_role, has_any_role' as functions;
