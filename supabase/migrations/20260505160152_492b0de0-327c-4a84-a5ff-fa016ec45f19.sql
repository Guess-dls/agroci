
-- 1. Privilege escalation fix: whitelist roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nom, prenom, pays, region, whatsapp, user_type, type_activite)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'pays', ''),
    COALESCE(NEW.raw_user_meta_data->>'region', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    CASE WHEN NEW.raw_user_meta_data->>'user_type' IN ('producteur','acheteur')
         THEN NEW.raw_user_meta_data->>'user_type'
         ELSE 'acheteur' END,
    COALESCE(NEW.raw_user_meta_data->>'type_activite', '')
  );
  RETURN NEW;
END;
$function$;

-- 2. Profiles SELECT: strictly own + admin
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.user_type = 'admin')
);

-- Public directory view (safe fields only) for producer listings
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker=on) AS
SELECT id, user_id, nom, prenom, pays, region, user_type, type_activite, verified, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. product_views: enforce viewer_id ownership
DROP POLICY IF EXISTS "Authenticated users can insert views" ON public.product_views;
CREATE POLICY "Users can insert own product views"
ON public.product_views FOR INSERT
TO authenticated
WITH CHECK (
  viewer_id IS NULL
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = viewer_id AND p.user_id = auth.uid())
);

-- 4. Storage: restrict UPDATE/DELETE on product-images to owner
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;

CREATE POLICY "Owners can delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND owner = auth.uid());

CREATE POLICY "Owners can update their product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND owner = auth.uid());

-- 5. Lock down SECURITY DEFINER fn execution
REVOKE EXECUTE ON FUNCTION public.get_public_producer_info_for_product(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_email_verified(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_emails_for_admin() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_emails_for_admin() TO authenticated;
