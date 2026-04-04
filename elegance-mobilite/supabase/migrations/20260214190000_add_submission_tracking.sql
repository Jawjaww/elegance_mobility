-- Add submission tracking fields to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS submission_status TEXT DEFAULT 'draft'::TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Add check constraint for submission_status
ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_submission_status_check 
CHECK (submission_status IN ('draft', 'pending_review', 'approved', 'rejected'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_drivers_submission_status ON public.drivers(submission_status);
