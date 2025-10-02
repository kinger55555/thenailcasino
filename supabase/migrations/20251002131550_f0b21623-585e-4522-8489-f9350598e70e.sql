-- Grant admin role to current user
-- Replace with your actual user ID if needed
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email LIKE '%@game.app'
ON CONFLICT (user_id, role) DO NOTHING;