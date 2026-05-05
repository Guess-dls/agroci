
-- 1. contact_requests: add WITH CHECK to prevent buyers from forging status / deleted_by_producer
DROP POLICY IF EXISTS "Participants can update contact requests" ON public.contact_requests;

CREATE POLICY "Participants can update contact requests"
ON public.contact_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (profiles.id = contact_requests.buyer_id OR profiles.id = contact_requests.producer_id)
      AND profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (profiles.id = contact_requests.buyer_id OR profiles.id = contact_requests.producer_id)
      AND profiles.user_id = auth.uid()
  )
  -- Status changes restricted to producer only
  AND (
    status = (SELECT cr.status FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = contact_requests.producer_id
        AND profiles.user_id = auth.uid()
    )
  )
  -- deleted_by_producer can only be flipped by the producer
  AND (
    deleted_by_producer = (SELECT cr.deleted_by_producer FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = contact_requests.producer_id
        AND profiles.user_id = auth.uid()
    )
  )
  -- deleted_by_buyer can only be flipped by the buyer
  AND (
    deleted_by_buyer = (SELECT cr.deleted_by_buyer FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = contact_requests.buyer_id
        AND profiles.user_id = auth.uid()
    )
  )
  -- Immutable identity columns
  AND buyer_id = (SELECT cr.buyer_id FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
  AND producer_id = (SELECT cr.producer_id FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
  AND product_id = (SELECT cr.product_id FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
);

-- 2. whatsapp_clicks: only authenticated users; clicker_id must match their profile (or be null is not allowed)
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.whatsapp_clicks;

CREATE POLICY "Authenticated users can insert own clicks"
ON public.whatsapp_clicks
FOR INSERT
TO authenticated
WITH CHECK (
  clicker_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = whatsapp_clicks.clicker_id
      AND p.user_id = auth.uid()
  )
);

-- 3. verification_codes: explicit deny-all policy (RLS already enabled, no policies = deny,
-- but make this explicit & defensible). Service role bypasses RLS.
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access to verification_codes" ON public.verification_codes;
CREATE POLICY "Deny all access to verification_codes"
ON public.verification_codes
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);
