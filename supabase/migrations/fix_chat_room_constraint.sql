-- Fix chat room foreign key constraint error
-- Ensure general chat room exists and fix any orphaned messages

-- First, create the general chat room if it doesn't exist
INSERT INTO chat_rooms (id, name, type, is_general, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'General Chat',
  'group',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_general = EXCLUDED.is_general,
  updated_at = NOW();

-- Delete any orphaned chat messages that reference non-existent rooms
DELETE FROM chat_messages 
WHERE room_id IS NOT NULL 
AND room_id NOT IN (SELECT id FROM chat_rooms);

-- Update any messages with NULL room_id to use the general chat room
UPDATE chat_messages 
SET room_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE room_id IS NULL;

-- Ensure the foreign key constraint is properly enforced
ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_room_id_fkey;

ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_rooms TO authenticated;
GRANT SELECT ON chat_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT ON chat_messages TO anon;