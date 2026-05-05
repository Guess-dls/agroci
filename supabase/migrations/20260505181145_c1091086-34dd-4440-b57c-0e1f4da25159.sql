
-- Restrict UPDATE on profiles: users cannot escalate privileges or change sensitive fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND user_type = (SELECT p.user_type FROM public.profiles p WHERE p.user_id = auth.uid())
  AND verified = (SELECT p.verified FROM public.profiles p WHERE p.user_id = auth.uid())
  AND suspended = (SELECT p.suspended FROM public.profiles p WHERE p.user_id = auth.uid())
  AND credits = (SELECT p.credits FROM public.profiles p WHERE p.user_id = auth.uid())
  AND subscription_active = (SELECT p.subscription_active FROM public.profiles p WHERE p.user_id = auth.uid())
  AND subscription_required = (SELECT p.subscription_required FROM public.profiles p WHERE p.user_id = auth.uid())
  AND subscription_end_date IS NOT DISTINCT FROM (SELECT p.subscription_end_date FROM public.profiles p WHERE p.user_id = auth.uid())
  AND boost_payment_required = (SELECT p.boost_payment_required FROM public.profiles p WHERE p.user_id = auth.uid())
  AND email_verified = (SELECT p.email_verified FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- Admins keep full update via separate policy
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.user_type = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.user_type = 'admin'));

-- Allow producers to see views on their own products
DROP POLICY IF EXISTS "Producers can view own product views" ON public.product_views;
CREATE POLICY "Producers can view own product views"
ON public.product_views
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products pr
    JOIN public.profiles p ON p.id = pr.producteur_id
    WHERE pr.id = product_views.product_id AND p.user_id = auth.uid()
  )
);
