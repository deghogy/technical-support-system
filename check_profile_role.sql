-- Check current role constraint on profiles table
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND contype = 'c';

-- Check existing roles in profiles
SELECT DISTINCT role FROM profiles;

-- If there's a CHECK constraint limiting roles, drop it:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Then add new constraint allowing 'customer':
-- ALTER TABLE profiles
-- ADD CONSTRAINT profiles_role_check
-- CHECK (role IN ('admin', 'approver', 'customer'));

-- OR if no constraint exists, just ensure the column supports the values
-- (TEXT columns accept any value by default)
