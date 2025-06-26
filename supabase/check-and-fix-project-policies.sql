-- First, let's see what policies currently exist
SELECT 'Current RLS policies for projects:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'projects';

-- Check current user ID
SELECT 'Current user context:' as info;
SELECT auth.uid() as current_user_id;

-- Check the specific project we're trying to delete
SELECT 'Project details and ownership:' as info;
SELECT id, title, created_by, 
       (auth.uid()::text = created_by::text) as user_owns_project,
       auth.uid() as current_user
FROM projects 
WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';

-- Test if we can select the project (should work if RLS allows)
SELECT 'Can we select this project?' as info;
SELECT COUNT(*) as project_count 
FROM projects 
WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';

-- Check the data types of the columns
SELECT 'Column types:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name IN ('id', 'created_by');

-- Try to delete the project manually to see what happens
SELECT 'Attempting manual deletion...' as info;
DELETE FROM projects WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';

-- Check if it was deleted
SELECT 'Project still exists after delete attempt?' as info;
SELECT COUNT(*) as still_exists 
FROM projects 
WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';

-- If the above delete didn't work, let's try updating the RLS policies
-- Drop existing delete policy and recreate it
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON projects;
DROP POLICY IF EXISTS "Users can delete projects they created" ON projects;

-- Create a more permissive delete policy for testing
CREATE POLICY "Users can delete projects they created" ON projects
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid()::text = created_by::text
    );

-- Try the delete again
SELECT 'Trying delete with updated policy...' as info;
DELETE FROM projects WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';

-- Final check
SELECT 'Final check - project deleted?' as info;
SELECT COUNT(*) as final_count 
FROM projects 
WHERE id = '5fa48c4b-85f6-4d45-885d-6aa98bcef278';
