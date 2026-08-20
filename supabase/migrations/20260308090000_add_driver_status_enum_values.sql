-- Add driver_status enum values required by unify_driver_status.
-- Must run in its own migration/transaction before those values are used.

ALTER TYPE public.driver_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.driver_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.driver_status ADD VALUE IF NOT EXISTS 'pending_review';
