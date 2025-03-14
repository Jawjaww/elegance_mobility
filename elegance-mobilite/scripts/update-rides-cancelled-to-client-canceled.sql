-- Script pour migrer tous les statuts 'cancelled' vers 'client-canceled'

BEGIN;

-- Vérifier le statut des rides avant la mise à jour
SELECT status, COUNT(*) 
FROM rides 
GROUP BY status 
ORDER BY COUNT(*) DESC;

-- Mettre à jour tous les rides ayant le statut 'cancelled'
UPDATE rides
SET status = 'client-canceled'
WHERE status = 'cancelled';

-- Vérifier le résultat après mise à jour
SELECT status, COUNT(*) 
FROM rides 
GROUP BY status 
ORDER BY COUNT(*) DESC;

COMMIT;
