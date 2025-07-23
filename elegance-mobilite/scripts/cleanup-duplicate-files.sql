-- Script pour nettoyer les fichiers dupliqués dans driver-documents
-- Garde seulement le fichier le plus récent par type de document et par utilisateur

-- 1. Identifier les doublons
WITH file_analysis AS (
  SELECT 
    name,
    created_at,
    -- Extraire l'UUID utilisateur et le type de document
    SPLIT_PART(name, '/', 1) as user_id,
    SPLIT_PART(SPLIT_PART(name, '/', 2), '_', 1) as document_type,
    -- Ranger par date de création (plus récent = rang 1)
    ROW_NUMBER() OVER (
      PARTITION BY SPLIT_PART(name, '/', 1), SPLIT_PART(SPLIT_PART(name, '/', 2), '_', 1)
      ORDER BY created_at DESC
    ) as rank
  FROM storage.objects 
  WHERE bucket_id = 'driver-documents'
)

-- 2. Afficher les fichiers à supprimer (tous sauf le plus récent)
SELECT 
  name as "Fichier à supprimer",
  user_id as "Utilisateur",
  document_type as "Type de document",
  created_at as "Date de création",
  rank as "Rang"
FROM file_analysis 
WHERE rank > 1
ORDER BY user_id, document_type, created_at DESC;

-- 3. Pour supprimer les doublons (décommenter après vérification)
/*
DELETE FROM storage.objects 
WHERE bucket_id = 'driver-documents' 
AND name IN (
  SELECT name 
  FROM (
    SELECT 
      name,
      ROW_NUMBER() OVER (
        PARTITION BY SPLIT_PART(name, '/', 1), SPLIT_PART(SPLIT_PART(name, '/', 2), '_', 1)
        ORDER BY created_at DESC
      ) as rank
    FROM storage.objects 
    WHERE bucket_id = 'driver-documents'
  ) ranked_files
  WHERE rank > 1
);
*/
