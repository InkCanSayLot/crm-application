-- Simple check of users table
SELECT id, email, name, full_name, role, created_at FROM public.users ORDER BY created_at;