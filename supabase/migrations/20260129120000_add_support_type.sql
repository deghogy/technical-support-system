-- Add support_type column to site_visit_requests table
-- Migration: Add support type field for remote/onsite support options

-- Add the column with a default value for existing records
ALTER TABLE site_visit_requests
ADD COLUMN IF NOT EXISTS support_type VARCHAR(10) NOT NULL DEFAULT 'onsite';

-- Add check constraint to ensure only valid values
ALTER TABLE site_visit_requests
DROP CONSTRAINT IF EXISTS check_support_type;

ALTER TABLE site_visit_requests
ADD CONSTRAINT check_support_type
CHECK (support_type IN ('remote', 'onsite'));

-- Create index for filtering by support type
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_support_type
ON site_visit_requests(support_type);

-- Update existing records that have null support_type (if any)
UPDATE site_visit_requests
SET support_type = 'onsite'
WHERE support_type IS NULL;
