-- First, let's create a demo user profile manually
-- You'll need to replace this UUID with an actual user ID from auth.users
-- Or we can create projects without the created_by constraint for demo purposes

-- Insert demo projects (without created_by for now - we'll update this after you have real users)
INSERT INTO public.projects (id, title, description, deadline, budget, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Website Redesign', 'Complete overhaul of company website with modern design', '2024-03-15', 15000.00, 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'Native iOS and Android app for customer engagement', '2024-04-30', 25000.00, 'active'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Marketing Campaign Q1', 'Digital marketing campaign for Q1 product launch', '2024-02-28', 8000.00, 'active');

-- Demo tasks
INSERT INTO public.tasks (title, description, project_id, status, priority, due_date) VALUES
  ('Design Mockups', 'Create initial design mockups for homepage', '550e8400-e29b-41d4-a716-446655440001', 'completed', 'high', '2024-01-15'),
  ('Frontend Development', 'Implement responsive frontend components', '550e8400-e29b-41d4-a716-446655440001', 'in_progress', 'high', '2024-02-15'),
  ('Backend API', 'Develop REST API endpoints', '550e8400-e29b-41d4-a716-446655440001', 'todo', 'medium', '2024-02-28'),
  ('User Authentication', 'Implement user login and registration', '550e8400-e29b-41d4-a716-446655440002', 'in_progress', 'high', '2024-02-10'),
  ('Push Notifications', 'Set up push notification system', '550e8400-e29b-41d4-a716-446655440002', 'todo', 'medium', '2024-03-15'),
  ('App Store Submission', 'Prepare and submit app to stores', '550e8400-e29b-41d4-a716-446655440002', 'todo', 'high', '2024-04-20'),
  ('Social Media Strategy', 'Develop comprehensive social media plan', '550e8400-e29b-41d4-a716-446655440003', 'completed', 'medium', '2024-01-30'),
  ('Content Creation', 'Create marketing content and assets', '550e8400-e29b-41d4-a716-446655440003', 'in_progress', 'high', '2024-02-15');

-- Demo goals
INSERT INTO public.goals (title, description, project_id, target_value, current_value) VALUES
  ('Website Launch', 'Successfully launch the new website', '550e8400-e29b-41d4-a716-446655440001', 100, 65),
  ('App Store Approval', 'Get app approved on both app stores', '550e8400-e29b-41d4-a716-446655440002', 100, 30),
  ('Campaign Reach', 'Reach 10,000 potential customers', '550e8400-e29b-41d4-a716-446655440003', 10000, 3500);

-- Link some tasks to goals
INSERT INTO public.goal_tasks (goal_id, task_id) VALUES
  ((SELECT id FROM public.goals WHERE title = 'Website Launch'), (SELECT id FROM public.tasks WHERE title = 'Design Mockups')),
  ((SELECT id FROM public.goals WHERE title = 'Website Launch'), (SELECT id FROM public.tasks WHERE title = 'Frontend Development')),
  ((SELECT id FROM public.goals WHERE title = 'App Store Approval'), (SELECT id FROM public.tasks WHERE title = 'User Authentication')),
  ((SELECT id FROM public.goals WHERE title = 'Campaign Reach'), (SELECT id FROM public.tasks WHERE title = 'Social Media Strategy'));

-- Note: We'll skip expenses for now since they require created_by
-- You can add expenses after you have real user profiles

-- Insert some sample activities (we'll skip user_id for now)
-- These will be populated when users actually use the app
