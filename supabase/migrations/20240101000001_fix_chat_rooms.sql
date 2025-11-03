-- Fix chat rooms foreign key constraint issue
-- Ensure there's always a default chat room available

-- Insert a default general chat room if it doesn't exist
INSERT INTO chat_rooms (id, name, type, is_general, created_at, updated_at)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'General Chat',
  'group',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions for chat_rooms table
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_rooms TO authenticated;
GRANT SELECT ON chat_rooms TO anon;

-- Create RLS policies for chat_rooms if they don't exist
DO $$
BEGIN
  -- Policy for authenticated users to view all chat rooms
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_rooms' 
    AND policyname = 'Users can view chat rooms'
  ) THEN
    CREATE POLICY "Users can view chat rooms" ON chat_rooms
      FOR SELECT USING (true);
  END IF;

  -- Policy for authenticated users to create chat rooms
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_rooms' 
    AND policyname = 'Users can create chat rooms'
  ) THEN
    CREATE POLICY "Users can create chat rooms" ON chat_rooms
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  -- Policy for authenticated users to update their own chat rooms
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_rooms' 
    AND policyname = 'Users can update their chat rooms'
  ) THEN
    CREATE POLICY "Users can update their chat rooms" ON chat_rooms
      FOR UPDATE USING (created_by = auth.uid() OR user_id = auth.uid());
  END IF;
END
$$;