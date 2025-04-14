-- Activer RLS sur la table rides
alter table rides enable row level security;

-- Créer les rôles utilisateurs s'ils n'existent pas
do $$ 
begin
  if not exists (select from pg_roles where rolname = 'app_customer') then
    create role app_customer;
  end if;
  if not exists (select from pg_roles where rolname = 'app_driver') then
    create role app_driver;
  end if;
  if not exists (select from pg_roles where rolname = 'app_admin') then
    create role app_admin;
  end if;
  if not exists (select from pg_roles where rolname = 'app_super_admin') then
    create role app_super_admin;
  end if;
end $$;

-- Donner les permissions sur la table rides aux différents rôles
grant select, insert, update on rides to app_customer;
grant select, update on rides to app_driver;
grant all on rides to app_admin;
grant all on rides to app_super_admin;

-- Assigner le rôle app_customer par défaut aux nouveaux utilisateurs
alter role authenticator inherit app_customer;

-- Créer une fonction pour attribuer le bon rôle à l'utilisateur
create or replace function auth.get_role()
returns text as $$
begin
  -- Retourne le rôle PostgreSQL depuis auth.users
  return (select role from auth.users where id = auth.uid());
end;
$$ language plpgsql security definer;