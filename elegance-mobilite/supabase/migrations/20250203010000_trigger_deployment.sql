-- Migration de déclenchement pour forcer le déploiement GitOps
-- Cette migration applique toutes les migrations en attente

SELECT 'Déploiement des migrations VTC' as status;

-- Vérifier que les tables manquantes seront créées
SELECT COUNT(*) as tables_before 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
