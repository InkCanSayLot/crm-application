-- Fix users table by syncing with auth.users using valid roles
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
    CASE 
        WHEN au.email LIKE '%william%' THEN 'CEO'
        WHEN au.email LIKE '%beck%' THEN 'CGO' 
        WHEN au.email LIKE '%roman%' THEN 'CTO'
        ELSE 'user'
    END as role,
    false as is_online,
    now() as last_seen,
    au.created_at,
    au.updated_at,
    CASE 
        WHEN au.email LIKE '%william%' THEN 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        WHEN au.email LIKE '%beck%' THEN 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        WHEN au.email LIKE '%roman%' THEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        ELSE 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    END as avatar_url,
    '+1-555-0100' as phone,
    'Remote' as location,
    'EmptyAd Inc.' as company,
    'Team member at EmptyAd Inc.' as bio
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
AND au.email IS NOT NULL
AND au.deleted_at IS NULL;

-- Show final result
SELECT 'Users created:' as info, count(*) as count FROM public.users;
SELECT id, email, name, full_name, role, is_online FROM public.users ORDER BY email;