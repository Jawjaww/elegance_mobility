-- Migration Étape 2 : Configuration du trigger pour assigner automatiquement les rôles
-- Date: 2025-06-13
-- Objectif : Créer un trigger qui assigne automatiquement le bon rôle dans app_metadata

-- Fonction PostgreSQL pour assigner le rôle automatiquement lors de la création d'utilisateur
CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si portal_type est défini et forcer l'assignation du rôle
  IF NEW.raw_user_meta_data ? 'portal_type' THEN
    CASE NEW.raw_user_meta_data->>'portal_type'
      WHEN 'driver' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_driver"}'::jsonb;
      WHEN 'customer' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_customer"}'::jsonb;
      WHEN 'admin' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_admin"}'::jsonb;
      ELSE
        RAISE EXCEPTION 'portal_type non reconnu: %', NEW.raw_user_meta_data->>'portal_type';
    END CASE;
  ELSE
    RAISE EXCEPTION 'portal_type est requis lors de l''inscription.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour les nouveaux utilisateurs uniquement
DROP TRIGGER IF EXISTS assign_user_role_trigger ON auth.users;
CREATE TRIGGER assign_user_role_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_role_on_signup();

-- Commentaire sur la stratégie finale
COMMENT ON FUNCTION public.assign_user_role_on_signup() IS 
'Fonction qui assigne automatiquement le rôle dans app_metadata lors de la création d''un utilisateur.
Stratégie finale : 
- app_metadata.role pour le contrôle d''accès (défini automatiquement par ce trigger)
- user_metadata.portal_type pour l''interface utilisateur (défini par le client)
- Pas de duplication des rôles
- Trigger uniquement sur INSERT (nouveaux utilisateurs)';

-- Vérification finale des rôles
SELECT 
  'Utilisateurs avec rôle app_driver' as description,
  COUNT(*) as count
FROM auth.users 
WHERE raw_app_meta_data->>'role' = 'app_driver'

UNION ALL

SELECT 
  'Utilisateurs avec rôle app_customer' as description,
  COUNT(*) as count
FROM auth.users 
WHERE raw_app_meta_data->>'role' = 'app_customer'

UNION ALL

SELECT 
  'Utilisateurs sans rôle défini' as description,
  COUNT(*) as count
FROM auth.users 
WHERE raw_app_meta_data->>'role' IS NULL;
