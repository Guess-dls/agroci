-- 1. Lock down activate_producer_subscription if it still exists
DO $$
DECLARE
  fn_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'activate_producer_subscription'
  ) INTO fn_exists;

  IF fn_exists THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.activate_producer_subscription(uuid, text) FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

-- Recreate (or create) with strict caller ownership check, only callable by service_role + admins/owners
CREATE OR REPLACE FUNCTION public.activate_producer_subscription(producer_profile_id uuid, reference text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin BOOLEAN;
  is_owner BOOLEAN;
  is_service BOOLEAN;
BEGIN
  is_service := (current_setting('request.jwt.claim.role', true) = 'service_role')
                OR (auth.uid() IS NULL);

  IF NOT is_service THEN
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO is_admin;
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = producer_profile_id AND user_id = auth.uid()) INTO is_owner;
    IF NOT (is_admin OR is_owner) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  UPDATE public.profiles
  SET subscription_active = true,
      subscription_end_date = COALESCE(GREATEST(subscription_end_date, now()), now()) + INTERVAL '30 days'
  WHERE id = producer_profile_id;

  INSERT INTO public.subscriptions (user_id, plan, type, status, start_date, end_date, nom)
  SELECT user_id, 'mensuel', 'mensuel', 'active', now(), now() + INTERVAL '30 days', 'Abonnement Mensuel'
  FROM public.profiles WHERE id = producer_profile_id;

  RETURN 'Abonnement activé';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_producer_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_producer_subscription(uuid, text) TO service_role;

-- 2. Storage: restrict product-images uploads to the user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Users upload product images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
