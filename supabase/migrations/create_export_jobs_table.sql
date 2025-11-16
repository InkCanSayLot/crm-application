-- Create export_jobs table for tracking report exports

CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    format VARCHAR(20) DEFAULT 'json' CHECK (format IN ('json', 'csv', 'pdf')),
    data JSONB,
    file_url TEXT,
    error_message TEXT,
    created_by UUID REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_export_jobs_created_by ON export_jobs(created_by);
CREATE INDEX idx_export_jobs_report_type ON export_jobs(report_type);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_created_at ON export_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own export jobs" ON export_jobs FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Users can create export jobs" ON export_jobs FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their own export jobs" ON export_jobs FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Grant permissions
GRANT SELECT ON export_jobs TO anon;
GRANT ALL PRIVILEGES ON export_jobs TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE export_jobs IS 'Tracks report export jobs and their status';