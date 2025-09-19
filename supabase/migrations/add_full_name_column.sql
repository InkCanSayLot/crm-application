-- Add full_name column to users table and populate with existing name data
ALTER TABLE users ADD COLUMN full_name VARCHAR;

-- Copy existing name data to full_name
UPDATE users SET full_name = name WHERE full_name IS NULL;

-- Make full_name not null after populating
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- Grant permissions for the updated table
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;