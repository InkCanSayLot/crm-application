-- Add bio column to users table (final missing column)
ALTER TABLE public.users 
ADD COLUMN bio TEXT;

-- Add comment for the new column
COMMENT ON COLUMN public.users.bio IS 'User biography/description';