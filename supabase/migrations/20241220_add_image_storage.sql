-- Add image storage capabilities to the CRM system

-- Create file_attachments table for storing file metadata
CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR,
    uploaded_by UUID REFERENCES users(id),
    entity_type VARCHAR NOT NULL CHECK (entity_type IN ('client', 'user', 'task', 'interaction', 'meeting_note')),
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add profile image columns to existing tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add attachment support to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false;

-- Add attachment support to interactions
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false;

-- Add attachment support to meeting notes
ALTER TABLE meeting_notes ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false;

-- Enable RLS on file_attachments table
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_attachments
CREATE POLICY "Users can view their own file attachments" ON file_attachments
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can insert their own file attachments" ON file_attachments
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own file attachments" ON file_attachments
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own file attachments" ON file_attachments
    FOR DELETE USING (uploaded_by = auth.uid());

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON file_attachments TO authenticated;
GRANT ALL PRIVILEGES ON file_attachments TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON file_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON file_attachments(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for file_attachments
CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for file uploads (this will be handled by Supabase Storage)
-- The bucket will be created programmatically in the application code

COMMIT;