-- Function to create welcome notification for new users
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert welcome notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    category,
    action_url,
    action_text,
    metadata
  ) VALUES (
    NEW.id,
    'Welcome to CoreTrack! 🎉',
    'Welcome to CoreTrack! We''re excited to have you on board. Start by creating your first project or exploring the dashboard to see what you can accomplish.',
    'success',
    'system',
    '/dashboard',
    'Get Started',
    jsonb_build_object(
      'welcome', true,
      'user_email', NEW.email,
      'signup_date', NOW()
    )
  );

  -- Insert a second notification about features
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    category,
    action_url,
    action_text,
    metadata
  ) VALUES (
    NEW.id,
    'Explore CoreTrack Features',
    'CoreTrack helps you manage projects, track tasks, set goals, and monitor expenses all in one place. Check out your settings to customize your experience.',
    'info',
    'system',
    '/settings',
    'View Settings',
    jsonb_build_object(
      'onboarding', true,
      'feature_intro', true
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing trigger to also create welcome notifications
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (
    user_id,
    email_project_updates,
    email_task_assignments,
    email_goal_reminders,
    email_expense_alerts,
    email_weekly_reports,
    email_system_updates,
    push_project_updates,
    push_task_assignments,
    push_goal_reminders,
    push_expense_alerts,
    push_system_updates,
    digest_frequency,
    quiet_hours_start,
    quiet_hours_end,
    timezone,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    true,  -- email_project_updates
    true,  -- email_task_assignments
    true,  -- email_goal_reminders
    true,  -- email_expense_alerts
    true,  -- email_weekly_reports
    true,  -- email_system_updates
    true,  -- push_project_updates
    true,  -- push_task_assignments
    true,  -- push_goal_reminders
    true,  -- push_expense_alerts
    true,  -- push_system_updates
    'weekly', -- digest_frequency
    '22:00',  -- quiet_hours_start
    '08:00',  -- quiet_hours_end
    'UTC',    -- timezone
    NOW(),
    NOW()
  );

  -- Create welcome notifications
  PERFORM create_welcome_notification();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
