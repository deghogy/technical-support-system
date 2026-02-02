-- ============================================
-- Create Customer: Tito Wiguna / Yasulor
-- Email: test@yasulor-boccard.id
-- Password: yasulor123
-- Location: Yasulor
-- ============================================

-- Step 1: Create the user in auth.users
-- Note: The password will be automatically hashed by Supabase
-- Run this in Supabase Dashboard -> SQL Editor

-- First, create the auth user using Supabase's built-in function
-- Or use the Supabase Dashboard Authentication UI to create user,
-- then run the SQL below to set up the profile, location, and quota

-- If creating via SQL (requires pgcrypto extension):
INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),  -- Generate new UUID
    'authenticated',
    'authenticated',
    'test@yasulor-boccard.id',
    crypt('yasulor123', gen_salt('bf')),  -- Hash the password
    NOW(),  -- Email auto-confirmed
    '{"provider":"email","providers":["email"]}',
    '{"name":"Tito Wiguna"}',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Step 2: Get the user ID (run this separately to get the ID)
-- SELECT id FROM auth.users WHERE email = 'test@yasulor-boccard.id';

-- Step 3: Create the profile (replace <USER_ID> with actual UUID from step 1)
-- INSERT INTO profiles (id, email, role, name)
-- VALUES (
--     '<USER_ID>',
--     'test@yasulor-boccard.id',
--     'customer',
--     'Tito Wiguna'
-- )
-- ON CONFLICT (id) DO UPDATE SET
--     role = 'customer',
--     name = 'Tito Wiguna';

-- Step 4: Create the location (replace <USER_ID> with actual UUID)
-- INSERT INTO customer_locations (customer_id, location_name)
-- VALUES (
--     '<USER_ID>',
--     'Yasulor'
-- )
-- ON CONFLICT DO NOTHING;

-- Step 5: Create quota for the customer
-- INSERT INTO customer_quotas (email, total_hours, used_hours)
-- VALUES (
--     'test@yasulor-boccard.id',
--     40,  -- Give 40 hours as example
--     0
-- )
-- ON CONFLICT (email) DO UPDATE SET
--     total_hours = 40,
--     used_hours = 0;

-- ============================================
-- ALTERNATIVE: Easier Method via Supabase Dashboard
-- ============================================
-- 1. Go to Authentication -> Users
-- 2. Click "Add User"
-- 3. Enter: test@yasulor-boccard.id / yasulor123
-- 4. In User Metadata, add: {"name": "Tito Wiguna"}
-- 5. Copy the user's UUID after creation
-- 6. Then run this SQL with the actual UUID:

-- INSERT INTO profiles (id, email, role, name)
-- VALUES ('USER_UUID_HERE', 'test@yasulor-boccard.id', 'customer', 'Tito Wiguna')
-- ON CONFLICT (id) DO UPDATE SET role = 'customer', name = 'Tito Wiguna';

-- INSERT INTO customer_locations (customer_id, location_name)
-- VALUES ('USER_UUID_HERE', 'Yasulor');

-- INSERT INTO customer_quotas (email, total_hours, used_hours)
-- VALUES ('test@yasulor-boccard.id', 40, 0)
-- ON CONFLICT (email) DO UPDATE SET total_hours = 40, used_hours = 0;
