-- Check current users table data to debug team display and online status issues
SELECT 
    id, 
    email, 
    name, 
    full_name,
    role, 
    is_online, 
    last_seen, 
    created_at, 
    updated_at 
FROM users 
ORDER BY created_at;

-- Also check the count
SELECT COUNT(*) as total_users FROM users;

-- Check online status distribution
SELECT 
    is_online,
    COUNT(*) as count
FROM users 
GROUP BY is_online;