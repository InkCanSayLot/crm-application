-- Fix duplicate user relationships in chat_messages table
-- Remove the redundant user_id column since sender_id already serves this purpose

-- First, drop the RLS policies that depend on user_id
DROP POLICY IF EXISTS "Team can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Team can delete own messages" ON chat_messages;

-- Drop the foreign key constraint
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- Drop the redundant user_id column
ALTER TABLE chat_messages DROP COLUMN IF EXISTS user_id;

-- Recreate the RLS policies using sender_id instead
CREATE POLICY "Team can update own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Team can delete own messages" ON chat_messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Ensure sender_id is properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;