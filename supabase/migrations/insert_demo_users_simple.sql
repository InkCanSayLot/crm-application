-- Insert demo users directly into public.users table
-- First, clear any existing users to avoid conflicts
DELETE FROM public.users;

-- Insert the demo users
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
);

-- Verify the insert
SELECT 'Inserted users:' as result, count(*) as count FROM public.users;
SELECT id, email, name, full_name, role FROM public.users ORDER BY email;