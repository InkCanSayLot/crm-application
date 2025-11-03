-- Fix RLS policies for chat tables to resolve permission violations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view chat rooms they participate in" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can update chat rooms they created" ON chat_rooms;
DROP POLICY IF EXISTS "Users can delete chat rooms they created" ON chat_rooms;

DROP POLICY IF EXISTS "Users can view their chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chat rooms" ON chat_participants;
DROP POLICY IF EXISTS "Users can leave chat rooms" ON chat_participants;

DROP POLICY IF EXISTS "Users can view messages in rooms they participate in" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to rooms they participate in" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Create RLS policies for chat_rooms
CREATE POLICY "Users can view chat rooms they participate in" ON chat_rooms
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_participants.room_id = chat_rooms.id 
      AND chat_participants.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create chat rooms" ON chat_rooms
  FOR INSERT TO authenticated
  WITH CHECK (created_by::text = auth.uid()::text);

CREATE POLICY "Users can update chat rooms they created" ON chat_rooms
  FOR UPDATE TO authenticated
  USING (created_by::text = auth.uid()::text);

CREATE POLICY "Users can delete chat rooms they created" ON chat_rooms
  FOR DELETE TO authenticated
  USING (created_by::text = auth.uid()::text);

-- Create RLS policies for chat_participants
CREATE POLICY "Users can view their chat participants" ON chat_participants
  FOR SELECT TO authenticated
  USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM chat_participants cp2
      WHERE cp2.room_id = chat_participants.room_id
      AND cp2.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can join chat rooms" ON chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can leave chat rooms" ON chat_participants
  FOR DELETE TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages in rooms they participate in" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_participants.room_id = chat_messages.room_id 
      AND chat_participants.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can send messages to rooms they participate in" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id::text = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE chat_participants.room_id = chat_messages.room_id 
      AND chat_participants.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE TO authenticated
  USING (sender_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE TO authenticated
  USING (sender_id::text = auth.uid()::text);

-- Allow anon users to view public data (for demo purposes)
CREATE POLICY "Allow anon read access to chat rooms" ON chat_rooms
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anon read access to chat participants" ON chat_participants
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow anon read access to chat messages" ON chat_messages
  FOR SELECT TO anon
  USING (true);

-- Allow anon users to create chat rooms and participate (for demo purposes)
CREATE POLICY "Allow anon to create chat rooms" ON chat_rooms
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to join chat rooms" ON chat_participants
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to send messages" ON chat_messages
  FOR INSERT TO anon
  WITH CHECK (true);