-- Create function to increment user credits
CREATE OR REPLACE FUNCTION public.increment_user_credits(user_profile_id uuid, credits_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET credits = credits + credits_to_add
  WHERE id = user_profile_id;
END;
$function$;