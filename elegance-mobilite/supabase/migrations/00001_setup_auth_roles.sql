-- Activation RLS
alter table public.rides enable row level security;

-- Création des rôles de base
do $$
begin
  if not exists (select from pg_roles where rolname = 'app_customer') then
    create role app_customer;
  end if;
  if not exists (select from pg_roles where rolname = 'app_driver') then
    create role app_driver;
  end if;
end $$;

-- Fonction pour gérer les nouveaux utilisateurs
create or replace function public.handle_new_signup()
returns trigger as $$
declare
  signup_url text;
begin
  -- Récupérer l'URL d'inscription depuis les métadonnées
  signup_url := current_setting('request.url', true);
  
  -- Attribuer le rôle en fonction de l'URL d'inscription
  if signup_url like '%/driver/signup%' then
    new.raw_app_meta_data := 
      jsonb_set(
        coalesce(new.raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"app_driver"'
      );
  else
    new.raw_app_meta_data := 
      jsonb_set(
        coalesce(new.raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"app_customer"'
      );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger pour les nouveaux utilisateurs
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  before insert on auth.users
  for each row
  execute procedure public.handle_new_signup();

-- Politiques RLS pour les réservations
create policy "Customers can view their own rides"
on public.rides for all
using (
  (auth.jwt() ->> 'role')::text = 'app_customer'
  and
  user_id = auth.uid()
);

create policy "Drivers can view assigned rides"
on public.rides for all
using (
  (auth.jwt() ->> 'role')::text = 'app_driver'
  and
  driver_id = auth.uid()
);