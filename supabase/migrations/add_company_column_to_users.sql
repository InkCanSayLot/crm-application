-- Add company column to users table
ALTER TABLE public.users 
ADD COLUMN company VARCHAR(255);

-- Add comment for the new column
COMMENT ON COLUMN public.users.company IS 'User company/organization';