-- SECURITY FIX: Remove vulnerable admin role auto-assignment trigger
-- This trigger trusts client-supplied metadata without verification,
-- allowing attackers to bypass admin key validation by directly calling signup API

-- Drop the vulnerable trigger that automatically assigns admin role
DROP TRIGGER IF EXISTS on_auth_user_created_admin_role ON auth.users;

-- Drop the vulnerable function
DROP FUNCTION IF EXISTS public.handle_admin_role();

-- SECURITY: Admin roles should now be assigned manually by existing admins
-- through the admin panel using the user_roles table with proper RLS policies