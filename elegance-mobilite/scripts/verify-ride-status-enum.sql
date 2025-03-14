-- Script pour vérifier les valeurs de l'enum ride_status

-- Afficher les valeurs actuelles de l'enum
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM 
  pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
WHERE 
  t.typname = 'ride_status'
ORDER BY 
  e.enumsortorder;

-- Vérifier les statuts utilisés dans la table rides
SELECT 
  status, 
  COUNT(*) AS count
FROM 
  rides
GROUP BY 
  status
ORDER BY 
  count DESC;

-- Vérifier s'il y a des trajets avec des statuts potentiellement problématiques
SELECT 
  id, 
  status, 
  pickup_time
FROM 
  rides
WHERE 
  status NOT IN ('unassigned', 'pending', 'scheduled', 'in-progress', 'completed', 'canceled')
LIMIT 10;
