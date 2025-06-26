-- Check the current auth configuration
SELECT 
  raw_app_meta_data,
  raw_user_meta_data,
  email,
  email_confirmed_at,
  invited_at,
  confirmation_sent_at
FROM auth.users 
WHERE email = 'test@example.com'  -- Replace with the email you're testing
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any auth hooks or triggers that might be interfering
SELECT 
  schemaname,
  tablename,
  triggername,
  definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth'
AND c.relname = 'users';
