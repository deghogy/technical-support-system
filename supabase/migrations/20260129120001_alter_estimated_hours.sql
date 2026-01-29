-- Alter estimated_hours column to allow NULL values
-- Since we're no longer collecting this from the form, it should be optional

ALTER TABLE site_visit_requests
ALTER COLUMN estimated_hours DROP NOT NULL;

-- Update existing records to allow proper NULL handling
-- Note: Existing 0 values can stay as 0, but new records can have NULL
