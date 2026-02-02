-- ============================================
-- Check customer_quotas table structure
-- ============================================

-- First, let's see what columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customer_quotas'
ORDER BY ordinal_position;

-- Most likely the column is named 'customer_email' not 'email'
-- Run this to insert the quota with the correct column name:

-- If the column is 'customer_email':
INSERT INTO customer_quotas (customer_email, total_hours, used_hours)
VALUES ('test@yasulor-boccard.id', 40, 0)
ON CONFLICT (customer_email) DO UPDATE SET total_hours = 40, used_hours = 0;

-- Alternative: If the column is just 'email' (you said it doesn't exist)
-- Then we need to add it or use whatever column exists
