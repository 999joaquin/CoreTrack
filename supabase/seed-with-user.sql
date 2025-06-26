-- This approach creates a demo user first, then seeds data
-- Note: This creates a user in auth.users which will trigger our profile creation

-- Insert a demo user into auth.users (this will automatically create a profile via trigger)
-- You would typically do this through the Supabase Auth API, but for seeding we can do it directly
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dd7f0eab-8ad0-4ef8-89fe-c82bb4f0648b',
  'authenticated',
  'authenticated',
  'demo@coretrack.com',
  crypt('demopassword', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Demo User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- The profile will be created automatically via trigger
-- But let's make sure it has admin role for demo purposes
UPDATE public.profiles 
SET role = 'admin', full_name = 'Demo User'
WHERE id = 'dd7f0eab-8ad0-4ef8-89fe-c82bb4f0648b';

-- Now insert projects with the demo user as creator
INSERT INTO public.projects (id, title, description, deadline, budget, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Website Redesign', 'Complete overhaul of company website with modern design', '2024-03-15', 15000.00, 'dd7f0eab-8ad0-4ef8-89fe-c82bb4f0648b'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'Native iOS and Android app for customer engagement', '2024-04-30', 25000.00, 'dd7f0eab-8ad0-4ef8-89fe-c82bb4f0648b'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Marketing Campaign Q1', 'Digital marketing campaign for Q1 product launch', '2024-02-28', 8000.00, 'dd7f0eab-8ad0-4ef8-89fe-c82bb4f0648b');

-- Rest of the seed data (tasks, goals, etc.) - same as above
INSERT INTO public.tasks (title, description, project_id, status, priority, due_date) VALUES
  ('Design Mockups', 'Create initial design mockups for homepage', '550e8400-e29b-41d4-a716-446655440001', 'completed', 'high', '2024-01-15'),
  ('Frontend Development', 'Implement responsive frontend components', '550e8400-e29b-41d4-a716-446655440001', 'in_progress', 'high', '2024-02-15'),
  ('Backend API', 'Develop REST API endpoints', '550e8400-e29b-41d4-a716-446655440001', 'todo', 'medium', '2024-02-28'),
  ('User Authentication', 'Implement user login and registration', '550e8400-e29b-41d4-a716-446655440002', 'in_progress', 'high', '2024-02-10'),
  ('Push Notifications', 'Set up push notification system', '550e8400-e29b-41d4-a716-446655440002', 'todo', 'medium', '2024-03-15');

INSERT INTO public.goals (title, description, project_id, target_value, current_value) VALUES
  ('Website Launch', 'Successfully launch the new website', '550e8400-e29b-41d4-a716-446655440001', 100, 65),
  ('App Store Approval', 'Get app approved on both app stores', '550e8400-e29b-41d4-a716-446655440002', 100, 30),
  ('Campaign Reach', 'Reach 10,000 potential customers', '550e8400-e29b-41d4-a716-446655440003', 10000, 3500);

-- Demo expenses
INSERT INTO public.expenses (amount, description, project_id, created_by, expense_date) VALUES
  (2500.00, 'Design software licenses', '550e8400-e29b-41d4-a716-446655440001', 'dd7f0eab-8ad0-4ef8-89fe-c82bb4f0648b', '2024-01-10'),
  (1200.00, 'Stock photography', '550e8400-e29b-41d4-a716-446655440001', 'dd7f0eab-8ad0-4ef8-89fe-c82bb4f0648b', '2024-01-15'),
  (3000.00, 'Development tools and services', '550e8400-e29b-41d4-a716-446655440002', 'dd7f0eab-8ad0-4ef8-89fe-c82bb4f0648b', '2024-01-20');
