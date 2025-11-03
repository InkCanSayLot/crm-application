-- Remove problematic Unsplash URLs that cause CORB errors
-- Set avatar_url to NULL for users with Unsplash URLs so they fall back to initials

UPDATE public.users 
SET avatar_url = NULL 
WHERE avatar_url LIKE '%unsplash.com%' 
   OR avatar_url LIKE '%images.unsplash.com%'
   OR avatar_url LIKE '%source.unsplash.com%';

-- Verify the update
SELECT id, email, full_name, avatar_url FROM public.users;