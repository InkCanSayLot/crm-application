-- Fix RLS policies for chat_messages table to allow proper message sending

-- Drop existing policy
DROP POLICY IF EXISTS "chat_messages_policy" ON public.chat_messages;

-- Create separate policies for different operations
-- Policy for SELECT: Users can see messages in rooms they participate in
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = chat_messages.room_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Policy for INSERT: Users can send messages to rooms they participate in
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = chat_messages.room_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Policy for UPDATE: Users can update their own messages
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages
  FOR UPDATE USING (
    auth.uid() = sender_id
  ) WITH CHECK (
    auth.uid() = sender_id
  );

-- Policy for DELETE: Users can delete their own messages
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages
  FOR DELETE USING (
    auth.uid() = sender_id
  );