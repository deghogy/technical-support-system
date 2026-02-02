-- ============================================
-- Add name column to profiles table
-- ============================================

-- Check if name column exists, add if not
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Now insert the customer
INSERT INTO profiles (id, email, role, name)
VALUES ('2dab7de7-d69a-46d7-a3e1-4e1a9657a902', 'test@yasulor-boccard.id', 'customer', 'Tito Wiguna')
ON CONFLICT (id) DO UPDATE SET role = 'customer', name = 'Tito Wiguna';

-- Insert location
INSERT INTO customer_locations (customer_id, location_name)
VALUES ('2dab7de7-d69a-46d7-a3e1-4e1a9657a902', 'Yasulor');

-- Insert quota
INSERT INTO customer_quotas (email, total_hours, used_hours)
VALUES ('test@yasulor-boccard.id', 40, 0)
ON CONFLICT (email) DO UPDATE SET total_hours = 40, used_hours = 0;
