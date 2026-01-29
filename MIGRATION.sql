-- SUPABASE MIGRATION SQL
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xcuqyeqzldkvcuerqwpf/sql/new

-- ============================================
-- Migration 1: Add support_type column
-- ============================================

-- Add support_type column with default value for existing records
ALTER TABLE site_visit_requests
ADD COLUMN IF NOT EXISTS support_type VARCHAR(10) NOT NULL DEFAULT 'onsite';

-- Add check constraint to ensure only valid values
ALTER TABLE site_visit_requests
DROP CONSTRAINT IF EXISTS check_support_type;

ALTER TABLE site_visit_requests
ADD CONSTRAINT check_support_type
CHECK (support_type IN ('remote', 'onsite'));

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_site_visit_requests_support_type
ON site_visit_requests(support_type);

-- ============================================
-- Migration 2: Make estimated_hours nullable
-- ============================================

-- Remove NOT NULL constraint from estimated_hours
ALTER TABLE site_visit_requests
ALTER COLUMN estimated_hours DROP NOT NULL;

-- ============================================
-- Verification
-- ============================================

-- Check the current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'site_visit_requests'
ORDER BY ordinal_position;
