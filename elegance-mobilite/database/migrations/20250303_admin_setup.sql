-- Configuration complète du rôle admin et des politiques de sécurité
BEGIN;

-- Supprimer l'ancien rôle admin s'il existe
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
        DROP ROLE admin;
    END IF;
END $$;

-- Créer le nouveau rôle admin avec les permissions
CREATE ROLE admin WITH NOLOGIN;

-- Accorder les privilèges nécessaires
GRANT USAGE ON SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT USAGE ON SCHEMA auth TO admin;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO admin;

-- Configuration des privilèges par défaut
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON SEQUENCES TO admin;

-- Fonction pour vérifier le statut admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claim.role', true) = 'admin'
        OR (nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role')::text = 'admin'
        OR (nullif(current_setting('request.jwt.claims', true), '')::jsonb->'user_metadata'->>'is_super_admin')::boolean = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour accorder le rôle admin
CREATE OR REPLACE FUNCTION public.grant_admin_role(admin_email TEXT)
RETURNS void AS $$
DECLARE
    role_name TEXT;
BEGIN
    -- Vérifier si l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;

    -- Créer un rôle PostgreSQL pour l'utilisateur s'il n'existe pas
    role_name := 'user_' || regexp_replace(lower(admin_email), '[^a-z0-9]', '_', 'g');
    
    EXECUTE format('
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = %L) THEN
                CREATE ROLE %I LOGIN INHERIT;
            END IF;
        END $$;
    ', role_name, role_name);

    -- Accorder le rôle admin au rôle de l'utilisateur
    EXECUTE format('GRANT admin TO %I', role_name);

    -- Mettre à jour les métadonnées
    UPDATE auth.users
    SET 
        raw_app_meta_data = jsonb_set(
            COALESCE(raw_app_meta_data, '{}'::jsonb),
            '{role}',
            '"admin"'
        ),
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{is_super_admin}',
            'true'
        )
    WHERE email = admin_email;

    -- Log l'opération
    RAISE NOTICE 'Created role % for admin %', role_name, admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurer les permissions sur les fonctions
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO admin;
REVOKE ALL ON FUNCTION public.grant_admin_role(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.grant_admin_role(TEXT) TO service_role;

-- Configurer RLS sur les tables principales
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Créer les politiques pour les admins
DROP POLICY IF EXISTS "Admin full access on rides" ON public.rides;
CREATE POLICY "Admin full access on rides" ON public.rides
    TO admin
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin full access on drivers" ON public.drivers;
CREATE POLICY "Admin full access on drivers" ON public.drivers
    TO admin
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin full access on vehicles" ON public.vehicles;
CREATE POLICY "Admin full access on vehicles" ON public.vehicles
    TO admin
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Appliquer le rôle aux admins existants
DO $$
DECLARE
    admin_user RECORD;
BEGIN
    FOR admin_user IN (
        SELECT email 
        FROM auth.users 
        WHERE raw_app_meta_data->>'role' = 'admin'
    ) LOOP
        PERFORM public.grant_admin_role(admin_user.email);
    END LOOP;
END $$;

COMMIT;
