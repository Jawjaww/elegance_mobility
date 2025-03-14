-- Script pour migrer les statuts 'cancelled' vers 'client-canceled' en plusieurs transactions

-- Étape 1: Vérifier les statuts actuels
SELECT status, COUNT(*) 
FROM rides 
GROUP BY status 
ORDER BY COUNT(*) DESC;

-- Étape 2: Mettre à jour tous les rides ayant le statut 'cancelled' vers 'client-canceled'
-- Cette opération est sûre car 'client-canceled' existe déjà dans l'enum
UPDATE rides
SET status = 'client-canceled'
WHERE status = 'cancelled';

-- Étape 3: Vérifier le résultat après mise à jour
SELECT status, COUNT(*) 
FROM rides 
GROUP BY status 
ORDER BY COUNT(*) DESC;

-- Note: Nous ne supprimons pas 'cancelled' de l'enum car:
-- 1. PostgreSQL n'a pas de syntaxe standard pour supprimer des valeurs d'enum
-- 2. Supprimer une valeur d'enum nécessiterait de recréer tout le type
-- 3. La suppression pourrait causer des problèmes avec du code existant
