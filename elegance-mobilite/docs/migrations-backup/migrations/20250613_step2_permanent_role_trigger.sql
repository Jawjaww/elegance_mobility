-- Étape 2 : Trigger permanent pour assigner automatiquement les rôles
-- Date: 2025-06-13

-- Fonction qui assigne le rôle app_driver par défaut aux nouveaux utilisateurs
-- (nous gérerons les autres rôles via l'interface admin)
CREATE OR REPLACE FUNCTION public.assign_default_app_driver_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Pour tous les nouveaux utilisateurs créés via l'inscription chauffeur,
  -- assigner le rôle app_driver par défaut
  -- (Les autres rôles seront assignés manuellement par les admins)
  
  IF NEW.raw_app_meta_data IS NULL OR NOT (NEW.raw_app_meta_data ? 'role') THEN
    -- Si aucun rôle n'est défini, et que c'est une inscription chauffeur
    IF NEW.raw_user_meta_data ? 'portal_type' AND NEW.raw_user_meta_data->>'portal_type' = 'driver' THEN
      NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_driver"}'::jsonb;
    ELSE
      -- Par défaut pour les autres inscriptions
      NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_customer"}'::jsonb;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour les nouveaux utilisateurs uniquement
DROP TRIGGER IF EXISTS assign_app_driver_role_trigger ON auth.users;
CREATE TRIGGER assign_app_driver_role_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_app_driver_role();

COMMENT ON FUNCTION public.assign_default_app_driver_role() IS 
'Trigger qui assigne automatiquement le bon rôle dans app_metadata lors de la création d''un compte.
- portal_type=driver → role=app_driver
- autres → role=app_customer
Le rôle reste uniquement dans app_metadata (meilleures pratiques Supabase).';
