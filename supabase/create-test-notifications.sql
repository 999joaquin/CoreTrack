-- Create some test notifications for the current user
-- Replace 'your-user-id' with an actual user ID from your auth.users table

INSERT INTO notifications (user_id, title, message, type, category, action_url, action_text, metadata)
VALUES 
  (
    (SELECT id FROM auth.users LIMIT 1), -- Gets the first user
    'Welcome to CoreTrack!',
    'Your account has been set up successfully. Start by creating your first project.',
    'success',
    'system',
    '/projects',
    'Create Project',
    '{"welcome": true}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'New Task Assigned',
    'You have been assigned a new task: "Review project requirements"',
    'info',
    'task',
    '/tasks',
    'View Task',
    '{"task_id": "123"}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Goal Deadline Approaching',
    'Your goal "Complete Q1 objectives" is due in 3 days.',
    'warning',
    'goal',
    '/goals',
    'View Goal',
    '{"goal_id": "456"}'
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Expense Budget Alert',
    'You have exceeded 80% of your monthly budget.',
    'warning',
    'expense',
    '/expenses',
    'View Expenses',
    '{"budget_percentage": 85}'
  );
