-- Script de test pour vérifier la subscription driver
-- Insère une course en pending puis la nettoie

-- Créer une course test (à exécuter manuellement dans Supabase Studio)
INSERT INTO rides (
  pickup_address,
  pickup_lat,
  pickup_lon,
  dropoff_address,
  dropoff_lat,
  dropoff_lon,
  pickup_time,
  vehicle_type,
  status,
  estimated_price,
  distance,
  duration,
  user_id
) VALUES (
  '12 Rue de la Paix, Paris',
  48.8689,
  2.3310,
  'Place de la Concorde, Paris',
  48.8656,
  2.3212,
  NOW() + INTERVAL '10 minutes',
  'STANDARD',
  'pending',
  25.50,
  2500,
  600,
  NULL  -- Pas d'user_id pour simuler une course anonyme
);

-- Pour vérifier que la course existe:
-- SELECT * FROM rides WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1;

-- Pour supprimer la course test:
-- DELETE FROM rides WHERE status = 'pending' AND user_id IS NULL;
