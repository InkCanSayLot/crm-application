-- Check current state and fix users table
-- First check what's in auth.users
SELECT 'Auth users count:' as info, count(*) as count FROM auth.users;
SELECT 'Auth users:' as info, id, email FROM auth.users LIMIT 10;

-- Check what's in public.users  
SELECT 'Public users count:' as info, count(*) as count FROM public.users;
SELECT 'Public users:' as info, id, email, name, role FROM public.users LIMIT 10;

-- Insert into public.users for any auth.users that don't exist in public.users
INSERT INTO public.users (
    id, 
    email, 
    name, 
    full_name, 
    role, 
    is_online, 
    last_seen, 
    created_at, 
    updated_at,
    avatar_url,
    phone,
    location,
    company,
    bio
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as name,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    'Team Member' as role,
    false as is_online,
    now() as last_seen,
    au.created_at,
    au.updated_at,
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' as avatar_url,
    '' as phone,
    '' as location,
    'EmptyAd Inc.' as company,
    'Team member at EmptyAd Inc.' as bio
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
AND au.email IS NOT NULL;

-- Show final result
SELECT 'Final public users:' as info, id, email, name, full_name, role, is_online FROM public.users ORDER BY email;