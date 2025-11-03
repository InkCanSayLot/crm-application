-- Create the general chat room that the frontend expects
INSERT INTO chat_rooms (id, name, type, is_general, created_at, updated_at)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'General Chat',
  'group',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add all existing users as participants in the general chat room
INSERT INTO chat_participants (room_id, user_id, joined_at)
SELECT 
  '00000000-0000-4000-8000-000000000001',
  id,
  NOW()
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM chat_participants 
  WHERE room_id = '00000000-0000-4000-8000-000000000001' 
  AND user_id = users.id
);

-- Create a function to automatically add new users to the general chat room
CREATE OR REPLACE FUNCTION add_user_to_general_chat()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the new user to the general chat room
  INSERT INTO chat_participants (room_id, user_id, joined_at)
  VALUES ('00000000-0000-4000-8000-000000000001', NEW.id, NOW())
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add new users to general chat
DROP TRIGGER IF EXISTS trigger_add_user_to_general_chat ON users;
CREATE TRIGGER trigger_add_user_to_general_chat
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_general_chat();

-- Grant permissions for the general chat room
GRANT SELECT, INSERT, UPDATE ON chat_rooms TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_participants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO anon, authenticated;