-- SOLUTION FINALE - CRÉATION AUTOMATIQUE DRIVERS
-- Script à exécuter dans l'interface Supabase SQL Editor

-- 🔧 ÉTAPE 1 : Modifier la table drivers pour permettre l'insertion minimale
ALTER TABLE public.drivers 
  ALTER COLUMN company_name DROP NOT NULL,
  ALTER COLUMN company_phone DROP NOT NULL,
  ALTER COLUMN driving_license_expiry_date DROP NOT NULL,
  ALTER COLUMN driving_license_number DROP NOT NULL,
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN vtc_card_expiry_date DROP NOT NULL,
  ALTER COLUMN vtc_card_number DROP NOT NULL;

-- 🎯 ÉTAPE 2 : Créer le trigger final et robuste
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer l'utilisateur dans public.users
  INSERT INTO public.users (
    id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Si c'est un driver (role est dans raw_user_meta_data), créer le profil driver
  IF (NEW.raw_user_meta_data->>'role') = 'driver' THEN
    INSERT INTO public.drivers (
      user_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      'pending_validation',
      NOW(),
      NOW()
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔥 ÉTAPE 3 : Activer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ✅ ÉTAPE 4 : Vérification finale
DO $$
BEGIN
  RAISE NOTICE '🎉 CONFIGURATION TERMINÉE!';
  RAISE NOTICE '✅ Trigger activé pour création automatique des drivers';
  RAISE NOTICE '✅ Champs drivers rendus optionnels pour insertion minimale';
  RAISE NOTICE '🚀 Le frontend peut maintenant créer des drivers automatiquement!';
END $$;
