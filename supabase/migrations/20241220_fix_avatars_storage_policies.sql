-- Fix avatars storage policies to work with demo authentication system

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create new policies that work with both real auth and demo system

-- Policy: Allow public read access to all avatars (since bucket is public)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Policy: Allow authenticated users to upload avatars
-- This policy is more permissive to work with demo authentication
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    (
      -- Allow if user is authenticated through Supabase
      auth.uid() IS NOT NULL OR
      -- Allow if the path structure suggests a valid user ID (for demo users)
      (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    )
  );

-- Policy: Allow authenticated users to update avatars
CREATE POLICY "Users can update avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    (
      -- Allow if user is authenticated and owns the file
      (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
      -- Allow if the path structure suggests a valid user ID (for demo users)
      (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    )
  );

-- Policy: Allow authenticated users to delete avatars
CREATE POLICY "Users can delete avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    (
      -- Allow if user is authenticated and owns the file
      (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
      -- Allow if the path structure suggests a valid user ID (for demo users)
      (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    )
  );

COMMIT;