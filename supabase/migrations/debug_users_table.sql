-- Debug users table to see what's in there
SELECT 'Total users in public.users:' as info, count(*) as count FROM public.users;
SELECT 'Users data:' as info, id, email, name, full_name, role FROM public.users LIMIT 10;

-- Check auth.users too
SELECT 'Total users in auth.users:' as info, count(*) as count FROM auth.users;
SELECT 'Auth users data:' as info, id, email FROM auth.users LIMIT 10;

-- Check RLS status
SELECT 'RLS enabled on users:' as info, relname, relrowsecurity FROM pg_class WHERE relname = 'users';

-- Check current policies
SELECT 'Current policies:' as info, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'users';