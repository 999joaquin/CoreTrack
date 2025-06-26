-- Check current auth settings
SELECT 
  setting_name,
  setting_value
FROM auth.config
WHERE setting_name IN ('SITE_URL', 'URI_ALLOW_LIST', 'EXTERNAL_EMAIL_ENABLED');

-- Check if we have any custom email templates
SELECT 
  template_name,
  subject,
  content
FROM auth.email_templates;
