# Correction des problèmes d'authentification admin

## 1. Création du rôle admin

```sql
-- Vérifier si le rôle existe déjà
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Donner les privilèges nécessaires
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- Permettre la connexion
ALTER ROLE admin LOGIN;
```

## 2. Mise à jour des politiques

```sql
-- Mettre à jour les politiques pour utiliser le rôle admin
CREATE POLICY "Allow full access for admin users" ON "public"."rides"
FOR ALL USING (
  (auth.jwt() ->> 'role')::text = 'admin'
) WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Répéter pour les autres tables selon besoin
```

## 3. Mise à jour du trigger pour le rôle admin

```sql
CREATE OR REPLACE FUNCTION public.handle_auth_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si l'utilisateur est un admin
  IF NEW.raw_app_meta_data->>'role' = 'admin' THEN
    -- Donner le rôle admin à l'utilisateur
    EXECUTE format('GRANT admin TO %I', NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger s'il n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_updated'
  ) THEN
    CREATE TRIGGER on_auth_user_updated
      AFTER UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_auth_user_update();
  END IF;
END
$$;
```

## 4. Appliquer le rôle aux admins existants

```sql
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
END
$$;
```

## Vérification

Après avoir exécuté ces commandes, vérifiez que :

1. Le rôle admin existe :
```sql
SELECT * FROM pg_roles WHERE rolname = 'admin';
```

2. Les utilisateurs admin ont le rôle :
```sql
SELECT r.rolname, m.member, m.admin_option
FROM pg_auth_members m
JOIN pg_roles r ON m.roleid = r.oid
JOIN pg_roles u ON m.member = u.oid
WHERE r.rolname = 'admin';
```

3. Les politiques sont correctement configurées :
```sql
SELECT * FROM pg_policies WHERE tablename = 'rides';
