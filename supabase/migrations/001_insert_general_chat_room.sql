-- Insert the general chat room to fix foreign key constraint error
INSERT INTO chat_rooms (id, name, type, is_general, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'General Chat',
  'group',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions for the chat_rooms table
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_rooms TO authenticated;
GRANT SELECT ON chat_rooms TO anon;

-- Grant permissions for the chat_messages table
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT ON chat_messages TO anon;