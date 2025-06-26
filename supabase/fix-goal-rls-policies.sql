-- Check current RLS policies for goals table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'goals';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'goals';

-- Check current user ID
SELECT auth.uid() as current_user_id;

-- Check the specific goal and its ownership
SELECT id, title, created_at, 
       CASE 
         WHEN EXISTS (SELECT 1 FROM projects WHERE id = goals.project_id AND created_by = auth.uid()) 
         THEN 'User owns project' 
         ELSE 'User does not own project' 
       END as ownership_status
FROM goals 
WHERE id = '9fbb1cd7-c62d-4124-a11e-8f66e4a37101';

-- Try manual deletion to test RLS
DELETE FROM goals WHERE id = '9fbb1cd7-c62d-4124-a11e-8f66e4a37101';

-- Check if goal still exists
SELECT COUNT(*) as goal_count FROM goals WHERE id = '9fbb1cd7-c62d-4124-a11e-8f66e4a37101';

-- Drop existing policies and create more permissive ones
DROP POLICY IF EXISTS "Users can view all goals" ON goals;
DROP POLICY IF EXISTS "Users can create goals" ON goals;
DROP POLICY IF EXISTS "Users can update goals" ON goals;
DROP POLICY IF EXISTS "Users can delete goals" ON goals;

-- Create new policies
CREATE POLICY "Users can view all goals" ON goals FOR SELECT USING (true);
CREATE POLICY "Users can create goals" ON goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update goals" ON goals FOR UPDATE USING (true);
CREATE POLICY "Users can delete goals" ON goals FOR DELETE USING (true);

-- Test deletion again
DELETE FROM goals WHERE id = '9fbb1cd7-c62d-4124-a11e-8f66e4a37101';

-- Final check
SELECT COUNT(*) as final_goal_count FROM goals WHERE id = '9fbb1cd7-c62d-4124-a11e-8f66e4a37101';
