-- Fix users table RLS to allow demo authentication
-- Since the app uses demo authentication, we need to allow anon access to users table

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Team can view all user profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create policies that allow both authenticated and anonymous access
-- This is needed because the demo app doesn't use real Supabase auth
CREATE POLICY "Allow all users to view profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to update profiles" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Allow all users to insert profiles" ON users
    FOR INSERT WITH CHECK (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;