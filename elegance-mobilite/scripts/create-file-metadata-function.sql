-- Fonction pour récupérer les métadonnées d'un fichier
CREATE OR REPLACE FUNCTION get_file_metadata(file_path TEXT, bucket_name TEXT)
RETURNS TABLE (
  name TEXT,
  size TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.name,
    o.metadata->>'size' as size,
    o.created_at,
    o.metadata
  FROM storage.objects o
  WHERE o.bucket_id = bucket_name
    AND o.name = file_path;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_file_metadata(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_metadata(TEXT, TEXT) TO service_role;
