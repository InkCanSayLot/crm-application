-- Fix RLS policies to properly handle null auth.uid() values
-- This prevents the "invalid input syntax for type uuid: '1'" error

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new policies that properly handle null auth.uid()
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = id::text
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = id::text
  );

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = id::text
  );

-- Also fix journal entries policy if it exists
DROP POLICY IF EXISTS "Users can manage their own journal entries" ON journal_entries;

CREATE POLICY "Users can manage their own journal entries" ON journal_entries
  FOR ALL TO authenticated USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = user_id::text
  );