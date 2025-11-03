-- Create demo users in both auth.users and public.users tables
-- This ensures the foreign key constraint is satisfied

-- First, create users in auth.users table
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'william@emptyad.com',
    '$2a$10$dummy.encrypted.password.hash.for.demo.user.only',
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "William Walsh"}',
    'authenticated',
    'authenticated'
),
(
    '22222222-2222-2222-2222-222222222222',
    'beck@emptyad.com',
    '$2a$10$dummy.encrypted.password.hash.for.demo.user.only',
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Beck Majdell"}',
    'authenticated',
    'authenticated'
),
(
    '33333333-3333-3333-3333-333333333333',
    'roman@emptyad.com',
    '$2a$10$dummy.encrypted.password.hash.for.demo.user.only',
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "M.A. Roman"}',
    'authenticated',
    'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

-- Then, create users in public.users table
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
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'william@emptyad.com',
    'William Walsh',
    'William Walsh',
    'CEO',
    false,
    now(),
    now(),
    now(),
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    '+1-555-0101',
    'New York, NY',
    'EmptyAd Inc.',
    'Experienced CEO with a passion for innovative advertising solutions.'
),
(
    '22222222-2222-2222-2222-222222222222',
    'beck@emptyad.com',
    'Beck Majdell',
    'Beck Majdell',
    'CGO',
    true,
    now(),
    now(),
    now(),
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    '+1-555-0102',
    'San Francisco, CA',
    'EmptyAd Inc.',
    'Chief Growth Officer focused on scaling business operations and market expansion.'
),
(
    '33333333-3333-3333-3333-333333333333',
    'roman@emptyad.com',
    'M.A. Roman',
    'M.A. Roman',
    'CTO',
    false,
    now() - interval '2 hours',
    now(),
    now(),
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    '+1-555-0103',
    'Austin, TX',
    'EmptyAd Inc.',
    'Technical leader with expertise in scalable architecture and team management.'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    location = EXCLUDED.location,
    company = EXCLUDED.company,
    bio = EXCLUDED.bio,
    updated_at = now();

-- Verify the users were created
SELECT 'Auth users:' as table_name, count(*) as user_count FROM auth.users WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
);

SELECT 'Public users:' as table_name, count(*) as user_count FROM public.users WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
);

-- Show the created users
SELECT id, email, name, full_name, role, is_online, avatar_url, phone, location, company FROM public.users ORDER BY email;