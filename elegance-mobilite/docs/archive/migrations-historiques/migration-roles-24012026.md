Script 0 — Audit : combien d'utilisateurs ont un rôle dans chaque source Objectif : estimer l'état avant migration. SQL : -- Count roles found in various places SELECT 'user_profiles.app_metadata->role' AS source, COUNT() AS count FROM public.user_profiles WHERE app_metadata IS NOT NULL AND (app_metadata->>'role') IS NOT NULL UNION ALL SELECT 'auth.users.app_metadata->role' AS source, COUNT() AS count FROM auth.users WHERE app_metadata IS NOT NULL AND (app_metadata->>'role') IS NOT NULL UNION ALL SELECT 'auth.users.raw_app_meta_data->role' AS source, COUNT() AS count FROM auth.users WHERE raw_app_meta_data IS NOT NULL AND (raw_app_meta_data->>'role') IS NOT NULL UNION ALL SELECT 'auth.users.user_metadata->role' AS source, COUNT() AS count FROM auth.users WHERE user_metadata IS NOT NULL AND (user_metadata->>'role') IS NOT NULL UNION ALL SELECT 'auth.users.role (top-level)' AS source, COUNT() AS count FROM auth.users WHERE role IS NOT NULL;

Validation : exécutez en staging et vérifiez les totaux pour savoir d'où proviennent les rôles majoritairement.

Script 1 — Ajouter colonne role (nullable pour migration sûre) Objectif : préparer la colonne sans casser l'existant. SQL : ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role text;

Validation : vérifiez la présence de la colonne ; elle est NULL par défaut et n'affecte rien.

Script 2 — Migration (single UPDATE) — priorité et normalisation Objectif : remplir user_profiles.role en utilisant les sources dans l'ordre de priorité ; tout en lowercase ; fallback 'user'. Remarques : On écrit uniquement si role est NULL pour éviter d'écraser une valeur manuelle déjà définie. SQL : WITH src AS ( SELECT up.id AS profile_id, COALESCE( NULLIF(lower((up.app_metadata ->> 'role')::text), ''), NULLIF(lower((au.app_metadata ->> 'role')::text), ''), NULLIF(lower((au.raw_app_meta_data ->> 'role')::text), ''), NULLIF(lower((au.user_metadata ->> 'role')::text), ''), NULLIF(lower(au.role::text), '') ) AS derived_role FROM public.user_profiles up LEFT JOIN auth.users au ON au.id = up.user_id ) UPDATE public.user_profiles up SET role = COALESCE(src.derived_role, 'user') FROM src WHERE up.id = src.profile_id AND up.role IS NULL;

Validation : exécutez un SELECT COUNT(_) FROM public.user_profiles WHERE role IS NULL après ; idéalement 0 (sauf si profils sans auth link). Vérifiez quelques exemples SELECT _ FROM public.user_profiles up JOIN auth.users au ON au.id = up.user_id WHERE up.role IS NOT NULL LIMIT 20;

Script 3 — Audit post-migration : répartition des rôles Objectif : voir quelles valeurs on a après la migration. SQL : SELECT role, COUNT() AS cnt FROM public.user_profiles GROUP BY role ORDER BY cnt DESC;

Validation : identifiez les valeurs inattendues (typos, pluriels, etc.). Si vous voyez des valeurs bizarres, corrigez avant lock.

Script 4 — Nettoyage / normalisation supplémentaire (optionnel) Objectif : corriger patterns connus (exemples). Adaptez selon résultats du Script 3. Exemples : -- Exemple : normaliser 'adminn' -> 'admin' ou 'super-admin' -> 'admin' UPDATE public.user_profiles SET role = 'admin' WHERE role IN ('adminn', 'super-admin', 'administrator');

-- Exemple : remplacer valeurs vides par 'user' UPDATE public.user_profiles SET role = 'user' WHERE role IS NULL OR trim(role) = '';

Validation : rerun Script 3 pour voir l'effet.

Script 5 — Ajouter index sur role Objectif : améliorer les performances des requêtes/ RLS qui filtrent par role. SQL : CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role);

Validation : index crée sans blocages notables sur petites tables ; sur très grosses tables testez en maintenance window.

Script 6 — Optionnel : verrouiller la colonne (NOT NULL) et ajouter ENUM/CHECK Choix 1 — Simple CHECK (si vous voulez une liste de rôles contrôlée mais souple)

Définissez la liste basée sur vos besoins (exemple ci-dessous). SQL (CHECK) : ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE public.user_profiles ALTER COLUMN role SET NOT NULL;

-- Add check constraint with allowed list ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('user','admin','manager','support','driver','company'));

Remplacez la liste par vos rôles réels. Si un rôle actuel n'est pas dans la liste, l'ajout échouera — validez avec Script 3 avant.

Choix 2 — ENUM (plus strict, nécessite création du type) SQL (ENUM) : -- Create enum type DO
B
E
G
I
N
I
F
N
O
T
E
X
I
S
T
S
(
S
E
L
E
C
T
1
F
R
O
M
p
g
t
y
p
e
W
H
E
R
E
t
y
p
n
a
m
e
=
′
u
s
e
r
r
o
l
e
e
n
u
m
′
)
T
H
E
N
C
R
E
A
T
E
T
Y
P
E
u
s
e
r
r
o
l
e
e
n
u
m
A
S
E
N
U
M
(
′
u
s
e
r
′
,
′
a
d
m
i
n
′
,
′
m
a
n
a
g
e
r
′
,
′
s
u
p
p
o
r
t
′
,
′
d
r
i
v
e
r
′
,
′
c
o
m
p
a
n
y
′
)
;
E
N
D
I
F
;
E
N
D
BEGINIFNOTEXISTS(SELECT1FROMpg
t
​
ypeWHEREtypname=
′
user
r
​
ole
e
​
num
′
)THENCREATETYPEuser
r
​
ole
e
​
numASENUM(
′
user
′
,
′
admin
′
,
′
manager
′
,
′
support
′
,
′
driver
′
,
′
company
′
);ENDIF;END;

-- Add column of enum type (safe path): ALTER TABLE public.user_profiles ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum;

-- Then set default and NOT NULL if desired ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT 'user'; ALTER TABLE public.user_profiles ALTER COLUMN role SET NOT NULL;

Important : la conversion en ENUM échouera si des valeurs non listées existent — validez avec Script 3.

Validation : si vous migrez à ENUM, testez en staging.

Script 7 — Optionnel : fonction trigger pour synchroniser auth.users.app_metadata.role Objectif : quand on change user_profiles.role, mettre à jour auth.users.app_metadata->'role' pour garder les JWT claims cohérents (utile si vous générez des tokens basés sur app_metadata). Remarque importante : la table auth.users est gérée par Supabase Auth et l'UPDATE direct sur auth.users requiert la clé service_role (permissions élevées). Cette fonction est SECURITY DEFINER and will perform the update on auth.users — vous devez exécuter la création avec un rôle admin et vérifier les permissions.

SQL (function + trigger) : -- Create helper function to update auth.users.app_metadata.role CREATE OR REPLACE FUNCTION public.sync_role_to_auth_users() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN PERFORM jsonb_set( (SELECT app_metadata FROM auth.users WHERE id = NEW.user_id), '{role}', to_jsonb(NEW.role::text), true ); -- Actually perform update to auth.users UPDATE auth.users SET app_metadata = jsonb_set(COALESCE(app_metadata, '{}'::jsonb), '{role}', to_jsonb(NEW.role::text), true) WHERE id = NEW.user_id; RETURN NEW; EXCEPTION WHEN others THEN -- Fail silently to avoid breaking app operations; log if you have logging mechanism RETURN NEW; END;

-- Create trigger on user_profiles after update of role CREATE TRIGGER trg_sync_role_to_auth_users AFTER UPDATE OF role ON public.user_profiles FOR EACH ROW WHEN (OLD.role IS DISTINCT FROM NEW.role) EXECUTE FUNCTION public.sync_role_to_auth_users();

Important: Because it's SECURITY DEFINER, ensure the function owner is a user with rights to update auth.users (a supabase_admin/service_role). You may also prefer to run a one-off UPDATE on auth.users using service_role instead of enabling a trigger if you prefer manual control.

Validation : test by updating a row in user_profiles and check auth.users.app_metadata for the change (must be executed with sufficient rights).

Script 8 — Rollback snippets Objectif : actions rapides pour annuler si nécessaire.

Supprimer la colonne role : ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS role;

Supprimer trigger + function : DROP TRIGGER IF EXISTS trg_sync_role_to_auth_users ON public.user_profiles; DROP FUNCTION IF EXISTS public.sync_role_to_auth_users();

Supprimer index : DROP INDEX IF EXISTS idx_user_profiles_role;

Supprimer CHECK : ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

Revenir sur ENUM type (si créé) : ALTER TABLE public.user_profiles ALTER COLUMN role TYPE text USING role::text; DROP TYPE IF EXISTS user_role_enum;

Validation : testez rollback en staging.

Checklist simple (staging) — à suivre avant production

Exécutez Script 0 pour auditer ; notez les valeurs.
Exécutez Script 1 pour ajouter la colonne.
Exécutez Script 2 pour migration.
Exécutez Script 3 pour vérifier la répartition ; corrigez anomalies avec Script 4 si besoin.
Déployez index (Script 5).
Mettez à jour un environnement de test de l'app pour qu'il lise user_profiles.role (ne supprimez pas la lecture des app_metadata encore).
Si tout ok, appliquez le choix de verrouillage (Script 6) en choisissant CHECK ou ENUM.
Si vous voulez synchroniser les claims JWT, activez le trigger (Script 7) ou lancez un one-off UPDATE auth.users via service_role.
Sur production : surveillez logs et erreurs auth. Rollback si besoin.
Remarques finales et recommandations simples

Ne supprimez jamais app_metadata tout de suite.
Faites une passe manuelle de normalisation si Script 3 révèle des valeurs bizarres.
Pour la synchronisation de auth.users, je recommande d'abord d'exécuter une mise à jour one-shot via service_role (audit + update) plutôt que d'activer un trigger automatiquement, pour garder le contrôle.
Testez bien RLS et JWT claims après migration (les tokens existants peuvent conserver des anciennes claims jusqu'à regeneration).
