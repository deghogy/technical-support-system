-- ============================================
-- Add name column to profiles table
-- ============================================

-- Add name column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing profiles with name from user_metadata
UPDATE profiles
SET name = COALESCE(
  (SELECT raw_user_meta_data->>'name'
   FROM auth.users
   WHERE auth.users.id = profiles.id),
  SPLIT_PART(email, '@', 1)
)
WHERE name IS NULL;

-- ============================================
-- To set a user's name manually, run:
-- UPDATE profiles SET name = 'Tito Wiguna' WHERE email = 'test@yasulor-boccard.id';
-- ============================================
