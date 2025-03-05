-- Création du rôle admin s'il n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin LOGIN;
  END IF;
END $$;

-- Donner les privilèges nécessaires au rôle admin
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- Créer des politiques simples pour l'accès admin
CREATE POLICY "Enable admin access" ON public.rides
    FOR ALL
    TO admin
    USING (true)
    WITH CHECK (true);

-- Appliquer le rôle aux utilisateurs admin existants
DO $$
DECLARE
    admin_user RECORD;
BEGIN
    FOR admin_user IN (
        SELECT email 
        FROM auth.users 
        WHERE raw_app_meta_data->>'role' = 'admin'
    ) LOOP
        EXECUTE format('GRANT admin TO %I', admin_user.email);
    END LOOP;
END $$;

-- Activer RLS sur les tables
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
