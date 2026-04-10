
-- Function to get user emails for admin
CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND user_type = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT au.id as user_id, au.email::text
  FROM auth.users au;
END;
$$;
