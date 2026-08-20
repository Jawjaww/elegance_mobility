-- Create storage policies for driver-documents bucket
-- These policies allow drivers to upload to their own folders.
-- On local Supabase, postgres may not own storage.objects; skip gracefully.

DO $$
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "drivers_upload_own_docs" ON storage.objects;
  DROP POLICY IF EXISTS "drivers_view_own_docs" ON storage.objects;
  DROP POLICY IF EXISTS "drivers_delete_own_docs" ON storage.objects;
  DROP POLICY IF EXISTS "drivers_update_own_docs" ON storage.objects;
  DROP POLICY IF EXISTS "admin_all_access_docs" ON storage.objects;

  -- Policy: Drivers can upload to their own folder (driver_id/document_type/...)
  CREATE POLICY "drivers_upload_own_docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'driver-documents' AND
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE drivers.user_id = auth.uid()
      AND split_part(name, '/', 1) = drivers.id::text
    )
  );

  -- Policy: Drivers can view their own documents
  CREATE POLICY "drivers_view_own_docs" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'driver-documents' AND
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE drivers.user_id = auth.uid()
      AND split_part(name, '/', 1) = drivers.id::text
    )
  );

  -- Policy: Drivers can delete their own documents
  CREATE POLICY "drivers_delete_own_docs" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'driver-documents' AND
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE drivers.user_id = auth.uid()
      AND split_part(name, '/', 1) = drivers.id::text
    )
  );

  -- Policy: Drivers can update their own documents
  CREATE POLICY "drivers_update_own_docs" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'driver-documents' AND
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE drivers.user_id = auth.uid()
      AND split_part(name, '/', 1) = drivers.id::text
    )
  );

  -- Policy: Admins have full access
  CREATE POLICY "admin_all_access_docs" ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'driver-documents' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_app_meta_data->>'role' = 'app_super_admin' OR
        auth.users.raw_app_meta_data->>'role' = 'app_admin'
      )
    )
  );
EXCEPTION
  WHEN insufficient_privilege OR SQLSTATE '42501' THEN
    RAISE NOTICE 'Skipping storage.objects policies (insufficient privilege): %', SQLERRM;
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping storage.objects policies: %', SQLERRM;
END $$;
