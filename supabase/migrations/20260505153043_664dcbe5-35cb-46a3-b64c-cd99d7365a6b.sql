-- 1) profiles: restrict SELECT to authenticated users (WhatsApp etc. are sensitive)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2) subscriptions: fix broken SELECT policy
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

-- 3) transactions: enforce ownership on INSERT
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;

CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

-- Also fix broken SELECT policy on transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

-- 4) products: restrict public SELECT to approved & visible products
DROP POLICY IF EXISTS "Approved products are viewable by everyone" ON public.products;

CREATE POLICY "Approved products are viewable by everyone"
ON public.products
FOR SELECT
TO anon, authenticated
USING (status = 'approuve' AND hidden = false);

CREATE POLICY "Producers can view own products"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = products.producteur_id AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

-- 5) Revoke public execute on increment_user_credits if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'increment_user_credits'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.increment_user_credits(uuid, integer) FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.increment_user_credits(uuid, integer) FROM authenticated';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.increment_user_credits(uuid, integer) FROM anon';
  END IF;
END $$;