
-- 1) Harden activate_product_boost: verify caller owns the producer profile AND product
CREATE OR REPLACE FUNCTION public.activate_product_boost(p_product_id uuid, p_producer_id uuid, p_reference text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  boost_end TIMESTAMPTZ;
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO is_admin;

  IF NOT is_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_producer_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.products
      WHERE id = p_product_id AND producteur_id = p_producer_id
    ) THEN
      RAISE EXCEPTION 'Product does not belong to this producer';
    END IF;
  END IF;

  boost_end := now() + INTERVAL '7 days';

  INSERT INTO public.product_boosts (product_id, producer_id, start_date, end_date, status, amount_paid, reference_paiement)
  VALUES (p_product_id, p_producer_id, now(), boost_end, 'active', 0, p_reference);

  UPDATE public.products SET is_boosted = true, boost_end_date = boost_end WHERE id = p_product_id;

  RETURN 'Produit boosté pendant 7 jours';
END;
$function$;

-- 2) Tighten product_views INSERT policy: require viewer_id to match auth user (or remain NULL for anonymous via service role)
DROP POLICY IF EXISTS "Users can insert own product views" ON public.product_views;
CREATE POLICY "Users can insert own product views"
ON public.product_views
FOR INSERT
TO authenticated
WITH CHECK (
  viewer_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = product_views.viewer_id AND p.user_id = auth.uid()
  )
);

-- 3) Restrict producer boost inserts to status='pending'; admins can insert any status
DROP POLICY IF EXISTS "Producers can insert own boosts" ON public.product_boosts;
CREATE POLICY "Producers can insert own boosts"
ON public.product_boosts
FOR INSERT
TO authenticated
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = product_boosts.producer_id AND profiles.user_id = auth.uid()
    )
    AND status = 'pending'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'admin'
  )
);
