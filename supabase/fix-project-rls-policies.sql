-- Check current RLS policies for projects table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'projects';

-- Drop existing RLS policies for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON projects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON projects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON projects;

-- Create comprehensive RLS policies for projects
CREATE POLICY "Users can view all projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = created_by);

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Test queries to verify the policies work
-- Replace 'your-user-id' with your actual user ID from auth.users
SELECT 'Testing project selection:' as test;
SELECT id, title, created_by FROM projects LIMIT 5;

SELECT 'Testing project deletion (this should work):' as test;
-- Uncomment and replace with actual project ID to test:
-- DELETE FROM projects WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';

-- Check if the project still exists
SELECT 'Checking if project still exists:' as test;
SELECT id, title FROM projects WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';

-- Check current user ID
SELECT 'Current user context:' as test;
SELECT auth.uid() as current_user_id;

-- Check project ownership
SELECT 'Project ownership check:' as test;
SELECT id, title, created_by, (auth.uid() = created_by) as can_delete 
FROM projects 
WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';
