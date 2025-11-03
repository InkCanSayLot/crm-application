-- Add location column to users table
ALTER TABLE public.users 
ADD COLUMN location VARCHAR(255);

-- Add comment for the new column
COMMENT ON COLUMN public.users.location IS 'User location/address';