-- Vérifier d'abord si l'utilisateur existe dans auth.users
DO $$
DECLARE
    admin_user RECORD;
BEGIN
    FOR admin_user IN (
        SELECT *
        FROM auth.users
        WHERE raw_app_meta_data->>'role' = 'admin'
    ) LOOP
        -- Mettre à jour les métadonnées si nécessaire
        UPDATE auth.users
        SET raw_app_meta_data = jsonb_set(
            raw_app_meta_data,
            '{role}',
            '"admin"'
        ),
        raw_user_meta_data = jsonb_set(
            raw_user_meta_data,
            '{is_super_admin}',
            'true'
        )
        WHERE id = admin_user.id;
        
        -- S'assurer que l'utilisateur a le rôle PostgreSQL
        EXECUTE format(
            'GRANT admin TO %I',
            admin_user.email
        );
    END LOOP;
END $$;

-- Mettre à jour les politiques de sécurité pour utiliser is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claim.role', true) = 'admin'
        OR (nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role')::text = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les politiques pour les courses
DROP POLICY IF EXISTS "Enable admin access" ON public.rides;
CREATE POLICY "Enable admin full access" ON public.rides
    TO admin
    USING (is_admin())
    WITH CHECK (is_admin());

-- Vérifier la configuration RLS
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Accorder les privilèges nécessaires
GRANT ALL ON TABLE public.rides TO admin;
GRANT USAGE ON SCHEMA public TO admin;
GRANT USAGE ON SCHEMA auth TO admin;

-- S'assurer que la fonction is_admin est accessible
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO admin;
