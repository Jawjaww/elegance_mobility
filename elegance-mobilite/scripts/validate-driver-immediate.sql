-- 🚀 VALIDATION IMMÉDIATE DU DRIVER POUR TESTS
-- Permet au driver de fonctionner immédiatement

-- Vérifier le statut actuel du driver
SELECT 
  d.id,
  d.first_name,
  d.last_name,
  d.status,
  au.email
FROM drivers d
LEFT JOIN auth.users au ON au.id = d.user_id
WHERE d.user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';

-- 🚀 VALIDER LE DRIVER (SOLUTION IMMÉDIATE)
UPDATE drivers 
SET 
  status = 'active',
  updated_at = NOW()
WHERE user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';

-- Vérifier que la validation a fonctionné
SELECT 
  d.id,
  d.first_name,
  d.last_name,
  d.status as "nouveau_status",
  au.email
FROM drivers d
LEFT JOIN auth.users au ON au.id = d.user_id
WHERE d.user_id = 'dc62bd52-0ed7-495b-9055-22635d6c5e74';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '🎯 DRIVER VALIDÉ!';
  RAISE NOTICE '✅ Statut changé de pending_validation → active';
  RAISE NOTICE '🚀 Le driver peut maintenant accepter des courses';
  RAISE NOTICE '📱 Actualisez Firefox et testez l''acceptation de courses';
END $$;
