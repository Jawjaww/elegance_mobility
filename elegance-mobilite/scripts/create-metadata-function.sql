-- Fonction pour récupérer les métadonnées d'un fichier
CREATE OR REPLACE FUNCTION get_file_metadata(
  p_bucket_id TEXT,
  p_file_path TEXT
)
RETURNS TABLE (
  file_name TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ,
  metadata_json JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    objects.name,
    (objects.metadata->>'size')::BIGINT as file_size,
    objects.created_at,
    objects.metadata
  FROM storage.objects
  WHERE bucket_id = p_bucket_id
    AND name = p_file_path
  LIMIT 1;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_file_metadata(TEXT, TEXT) TO authenticated;

-- Test de la fonction
-- SELECT * FROM get_file_metadata('driver-documents', 'votre_chemin_fichier');
