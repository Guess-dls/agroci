
-- 1. messages: add WITH CHECK to prevent tampering with content/identity
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contact_requests cr
    JOIN public.profiles p ON (p.id = cr.buyer_id OR p.id = cr.producer_id)
    WHERE cr.id = messages.contact_request_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  content = (SELECT m.content FROM public.messages m WHERE m.id = messages.id)
  AND sender_id = (SELECT m.sender_id FROM public.messages m WHERE m.id = messages.id)
  AND receiver_id = (SELECT m.receiver_id FROM public.messages m WHERE m.id = messages.id)
  AND contact_request_id = (SELECT m.contact_request_id FROM public.messages m WHERE m.id = messages.id)
  AND created_at = (SELECT m.created_at FROM public.messages m WHERE m.id = messages.id)
);

-- 2. products: lock status & hidden in WITH CHECK
DROP POLICY IF EXISTS "Producers can update own products" ON public.products;
CREATE POLICY "Producers can update own products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles
          WHERE profiles.id = products.producteur_id AND profiles.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles
          WHERE profiles.id = products.producteur_id AND profiles.user_id = auth.uid())
  AND status = (SELECT pr.status FROM public.products pr WHERE pr.id = products.id)
  AND hidden = (SELECT pr.hidden FROM public.products pr WHERE pr.id = products.id)
  AND producteur_id = (SELECT pr.producteur_id FROM public.products pr WHERE pr.id = products.id)
);

-- 3. transactions: remove client-side INSERT (rely on service_role / webhook)
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

-- 4. boost RPC: revoke direct execute, expose a vetted free-boost RPC
REVOKE EXECUTE ON FUNCTION public.activate_product_boost(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_product_boost(uuid, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.activate_product_boost(uuid, uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_product_boost(uuid, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.request_free_boost(p_product_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_payment_required boolean;
  v_boost_end timestamptz;
BEGIN
  SELECT id, boost_payment_required
  INTO v_profile_id, v_payment_required
  FROM public.profiles
  WHERE user_id = auth.uid() AND user_type = 'producteur';

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF COALESCE(v_payment_required, true) THEN
    RAISE EXCEPTION 'Le boost gratuit n''est pas autorisé pour ce compte';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND producteur_id = v_profile_id
  ) THEN
    RAISE EXCEPTION 'Product does not belong to this producer';
  END IF;

  v_boost_end := now() + INTERVAL '7 days';

  INSERT INTO public.product_boosts (product_id, producer_id, start_date, end_date, status, amount_paid, reference_paiement)
  VALUES (p_product_id, v_profile_id, now(), v_boost_end, 'active', 0, 'boost_gratuit_admin');

  UPDATE public.products
  SET is_boosted = true, boost_end_date = v_boost_end
  WHERE id = p_product_id;

  RETURN 'Produit boosté pendant 7 jours';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_free_boost(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.request_free_boost(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.request_free_boost(uuid) TO authenticated;

-- 5. whatsapp_clicks: explicit anon deny (defense in depth)
DROP POLICY IF EXISTS "Deny anon whatsapp clicks" ON public.whatsapp_clicks;
CREATE POLICY "Deny anon whatsapp clicks"
ON public.whatsapp_clicks
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
