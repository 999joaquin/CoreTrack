-- Test manual profile creation
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'test@example.com';
BEGIN
    -- Try to insert a test profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (test_user_id, test_email, 'Test User', 'user');
    
    RAISE NOTICE 'Profile creation test successful';
    
    -- Clean up
    DELETE FROM public.profiles WHERE id = test_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Profile creation test failed: %', SQLERRM;
END $$;
