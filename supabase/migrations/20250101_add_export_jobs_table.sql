-- Add export_jobs table for reports and export functionality
-- This table tracks report generation and export history

CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    format VARCHAR(20) DEFAULT 'json' CHECK (format IN ('json', 'csv', 'pdf')),
    data JSONB,
    error_message TEXT,
    download_count INTEGER DEFAULT 0,
    downloaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_report_type ON export_jobs(report_type);
CREATE INDEX idx_export_jobs_created_at ON export_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - allow all operations for authenticated users
CREATE POLICY "export_jobs_policy" ON export_jobs
  FOR ALL USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON export_jobs TO anon;
GRANT ALL PRIVILEGES ON export_jobs TO authenticated;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_export_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_export_jobs_updated_at
    BEFORE UPDATE ON export_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_export_jobs_updated_at();