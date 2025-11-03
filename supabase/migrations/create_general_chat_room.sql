-- Create the general chat room if it doesn't exist
INSERT INTO chat_rooms (id, name, type, created_by, is_general)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'General Chat',
  'group',
  (SELECT id FROM users LIMIT 1), -- Use first user as creator
  true
)
ON CONFLICT (id) DO NOTHING;

-- Ensure all users are participants in the general chat
INSERT INTO chat_participants (room_id, user_id, joined_at)
SELECT 
  '00000000-0000-4000-8000-000000000001',
  id,
  NOW()
FROM users
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Grant permissions for the general chat room
GRANT SELECT, INSERT, UPDATE ON chat_rooms TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_participants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO anon, authenticated;