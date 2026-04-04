-- Migration: Fix admin access to driver_documents
-- Purpose: Ensure admins can read all driver documents regardless of ownership
-- Created: 2026-04-04

-- Drop existing policies
DROP POLICY IF EXISTS "drivers_view_own_documents" ON public.driver_documents;
DROP POLICY IF EXISTS "drivers_insert_own_documents" ON public.driver_documents;
DROP POLICY IF EXISTS "drivers_update_own_documents" ON public.driver_documents;
DROP POLICY IF EXISTS "drivers_delete_own_documents" ON public.driver_documents;
DROP POLICY IF EXISTS "admin_all_access_driver_documents" ON public.driver_documents;

-- Policy: Admins can do everything
CREATE POLICY "admin_all_access_driver_documents" ON public.driver_documents
    FOR ALL
    TO authenticated
    USING (
        public.is_admin() OR public.is_super_admin()
    )
    WITH CHECK (
        public.is_admin() OR public.is_super_admin()
    );

-- Policy: Drivers can view their own documents
CREATE POLICY "drivers_view_own_documents" ON public.driver_documents
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Policy: Drivers can insert their own documents
CREATE POLICY "drivers_insert_own_documents" ON public.driver_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
    );

-- Policy: Drivers can update their own documents
CREATE POLICY "drivers_update_own_documents" ON public.driver_documents
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
        OR public.is_admin() OR public.is_super_admin()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
        OR public.is_admin() OR public.is_super_admin()
    );

-- Policy: Drivers can delete their own documents
CREATE POLICY "drivers_delete_own_documents" ON public.driver_documents
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = driver_documents.driver_id
            AND d.user_id = auth.uid()
        )
        OR public.is_admin() OR public.is_super_admin()
    );
