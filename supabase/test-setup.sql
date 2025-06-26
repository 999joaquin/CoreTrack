-- Test 1: Check if trigger function exists
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- Test 2: Check if trigger exists and is enabled
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Test 3: Check RLS policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Test 4: Check existing users and profiles
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  p.email as profile_email,
  p.role,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
