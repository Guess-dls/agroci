
-- 1. transactions: explicit deny INSERT/UPDATE/DELETE for clients
CREATE POLICY "Deny client inserts on transactions"
  ON public.transactions AS RESTRICTIVE FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on transactions"
  ON public.transactions AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny client deletes on transactions"
  ON public.transactions AS RESTRICTIVE FOR DELETE
  TO anon, authenticated
  USING (false);

-- 2. contact_requests: only producer can change status
DROP POLICY IF EXISTS "Participants can update contact requests" ON public.contact_requests;

CREATE POLICY "Participants can update contact requests"
  ON public.contact_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (profiles.id = contact_requests.buyer_id OR profiles.id = contact_requests.producer_id)
        AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- caller must still be a participant
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (profiles.id = contact_requests.buyer_id OR profiles.id = contact_requests.producer_id)
        AND profiles.user_id = auth.uid()
    )
    -- status changes ONLY by producer
    AND (
      status = (SELECT cr.status FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = contact_requests.producer_id
          AND profiles.user_id = auth.uid()
          AND profiles.id <> contact_requests.buyer_id
      )
    )
    -- deleted_by_producer flag only by producer
    AND (
      deleted_by_producer = (SELECT cr.deleted_by_producer FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = contact_requests.producer_id
          AND profiles.user_id = auth.uid()
      )
    )
    -- deleted_by_buyer flag only by buyer
    AND (
      deleted_by_buyer = (SELECT cr.deleted_by_buyer FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = contact_requests.buyer_id
          AND profiles.user_id = auth.uid()
      )
    )
    -- identity columns immutable
    AND buyer_id   = (SELECT cr.buyer_id   FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
    AND producer_id= (SELECT cr.producer_id FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
    AND product_id = (SELECT cr.product_id FROM public.contact_requests cr WHERE cr.id = contact_requests.id)
  );

-- 3. messages: only recipient can mark as read
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

CREATE POLICY "Recipients can mark messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = messages.receiver_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = messages.receiver_id
        AND p.user_id = auth.uid()
    )
    AND content            = (SELECT m.content            FROM public.messages m WHERE m.id = messages.id)
    AND sender_id          = (SELECT m.sender_id          FROM public.messages m WHERE m.id = messages.id)
    AND receiver_id        = (SELECT m.receiver_id        FROM public.messages m WHERE m.id = messages.id)
    AND contact_request_id = (SELECT m.contact_request_id FROM public.messages m WHERE m.id = messages.id)
    AND created_at         = (SELECT m.created_at         FROM public.messages m WHERE m.id = messages.id)
  );
