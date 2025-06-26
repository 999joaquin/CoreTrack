-- Check current RLS policies for tasks table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'tasks';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

-- Create comprehensive RLS policies for tasks
CREATE POLICY "Users can view tasks" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Users can insert tasks" ON tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete tasks" ON tasks
    FOR DELETE USING (true);

-- Ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Test the delete operation directly
-- Replace 'your-task-id' with the actual task ID you're trying to delete
-- DELETE FROM tasks WHERE id = '69054c3a-8fda-440f-9274-813e12bbcd09';

-- Check if the task still exists
-- SELECT id, title FROM tasks WHERE id = '69054c3a-8fda-440f-9274-813e12bbcd09';
