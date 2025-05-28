-- Drop existing policies
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON auth.users;
DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les profils" ON auth.users;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur email" ON auth.users;
DROP POLICY IF EXISTS "Customers can cancel their own data" ON auth.users;
DROP POLICY IF EXISTS "Service role can manage users" ON auth.users;
DROP POLICY IF EXISTS "Drivers peuvent créer leur compte" ON auth.users;
DROP POLICY IF EXISTS "Super admins can access all data" ON auth.users;
DROP POLICY IF EXISTS "Admins can access their own data" ON auth.users;
DROP POLICY IF EXISTS "Customers can access their own data" ON auth.users;
DROP POLICY IF EXISTS "Drivers can access their own data" ON auth.users;

-- Create new policies
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
ON auth.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Les administrateurs peuvent voir tous les profils"
ON auth.users
FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'raw_app_meta_data' ->> 'role') IN ('app_admin', 'app_super_admin'));

CREATE POLICY "Les utilisateurs peuvent modifier leur email"
ON auth.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND (
        email_change IS NULL
        OR trim(email_change) = ''
        OR NULLIF(email_change_confirm_status, 0) IS NULL
    )
);

CREATE POLICY "Customers can cancel their own data"
ON auth.users
FOR UPDATE
TO authenticated
USING ((email)::text = public.get_safe_email())
WITH CHECK ((email)::text = public.get_safe_email());

CREATE POLICY "Service role can manage users"
ON auth.users
FOR ALL
TO authenticated
USING (
    ((auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'service_role' AND (email)::text <> 'jawad.bentaleb@gmail.com')
    OR (auth.uid() = id)
);

CREATE POLICY "Drivers peuvent créer leur compte"
ON auth.users
FOR INSERT
TO authenticated
WITH CHECK ((email)::text = public.get_safe_email());

CREATE POLICY "Super admins can access all data"
ON auth.users
FOR ALL
TO authenticated
USING ((auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'app_super_admin');

CREATE POLICY "Admins can access leur propre data"
ON auth.users
FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'app_admin'
    AND (email)::text = public.get_safe_email()
);

CREATE POLICY "Customers can access their own data"
ON auth.users
FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'app_customer'
    AND (email)::text = public.get_safe_email()
);

CREATE POLICY "Drivers can access their own data"
ON auth.users
FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'app_driver'
    AND (email)::text = public.get_safe_email()
);