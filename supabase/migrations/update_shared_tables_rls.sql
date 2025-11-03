-- Update RLS policies for shared tables to allow global access
-- These tables should be accessible by all authenticated users

-- Clients table - shared CRM data
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

CREATE POLICY "All authenticated users can view clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update clients" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete clients" ON clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Interactions table - shared CRM interactions
DROP POLICY IF EXISTS "Users can view interactions" ON interactions;
DROP POLICY IF EXISTS "Users can insert interactions" ON interactions;
DROP POLICY IF EXISTS "Users can update interactions" ON interactions;
DROP POLICY IF EXISTS "Users can delete interactions" ON interactions;

CREATE POLICY "All authenticated users can view interactions" ON interactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert interactions" ON interactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update interactions" ON interactions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete interactions" ON interactions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Tasks table - shared team tasks
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

CREATE POLICY "All authenticated users can view tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete tasks" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Task groups table - shared task organization
DROP POLICY IF EXISTS "Users can view task_groups" ON task_groups;
DROP POLICY IF EXISTS "Users can insert task_groups" ON task_groups;
DROP POLICY IF EXISTS "Users can update task_groups" ON task_groups;
DROP POLICY IF EXISTS "Users can delete task_groups" ON task_groups;

CREATE POLICY "All authenticated users can view task_groups" ON task_groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert task_groups" ON task_groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update task_groups" ON task_groups
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete task_groups" ON task_groups
    FOR DELETE USING (auth.role() = 'authenticated');

-- Team members table - shared team data
DROP POLICY IF EXISTS "Users can view team_members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team_members" ON team_members;
DROP POLICY IF EXISTS "Users can update team_members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team_members" ON team_members;

CREATE POLICY "All authenticated users can view team_members" ON team_members
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert team_members" ON team_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update team_members" ON team_members
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete team_members" ON team_members
    FOR DELETE USING (auth.role() = 'authenticated');

-- Live chat messages table - for general/public chat only
-- Note: Private messages will be handled separately
DROP POLICY IF EXISTS "Users can view live_chat_messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Users can insert live_chat_messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Users can update live_chat_messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Users can delete live_chat_messages" ON live_chat_messages;

-- For general chat (where recipient_id is NULL), allow all authenticated users
-- For private messages, only sender and recipient can access
CREATE POLICY "Users can view general chat messages" ON live_chat_messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            recipient_id IS NULL OR -- General chat
            sender_id = auth.uid() OR -- Sender can see their messages
            recipient_id = auth.uid() -- Recipient can see messages sent to them
        )
    );

CREATE POLICY "Users can insert live chat messages" ON live_chat_messages
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        sender_id = auth.uid()
    );

CREATE POLICY "Users can update their own messages" ON live_chat_messages
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        sender_id = auth.uid()
    );

CREATE POLICY "Users can delete their own messages" ON live_chat_messages
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        sender_id = auth.uid()
    );

-- Analytics data table - shared business metrics
DROP POLICY IF EXISTS "Users can view analytics_data" ON analytics_data;
DROP POLICY IF EXISTS "Users can insert analytics_data" ON analytics_data;
DROP POLICY IF EXISTS "Users can update analytics_data" ON analytics_data;
DROP POLICY IF EXISTS "Users can delete analytics_data" ON analytics_data;

CREATE POLICY "All authenticated users can view analytics_data" ON analytics_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert analytics_data" ON analytics_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update analytics_data" ON analytics_data
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete analytics_data" ON analytics_data
    FOR DELETE USING (auth.role() = 'authenticated');

-- Dashboard widgets table - shared dashboard configuration
DROP POLICY IF EXISTS "Users can view dashboard_widgets" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can insert dashboard_widgets" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can update dashboard_widgets" ON dashboard_widgets;
DROP POLICY IF EXISTS "Users can delete dashboard_widgets" ON dashboard_widgets;

CREATE POLICY "All authenticated users can view dashboard_widgets" ON dashboard_widgets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert dashboard_widgets" ON dashboard_widgets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update dashboard_widgets" ON dashboard_widgets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete dashboard_widgets" ON dashboard_widgets
    FOR DELETE USING (auth.role() = 'authenticated');