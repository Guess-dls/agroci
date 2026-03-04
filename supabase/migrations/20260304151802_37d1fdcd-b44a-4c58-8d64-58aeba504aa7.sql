
-- Drop all existing restrictive policies on messages
DROP POLICY IF EXISTS "Users can see messages they sent" ON public.messages;
DROP POLICY IF EXISTS "Users can see messages they received" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages on accepted requests" ON public.messages;
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;

-- Recreate as PERMISSIVE policies so users can see messages they sent OR received
CREATE POLICY "Users can see their messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = messages.sender_id AND p.user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = messages.receiver_id AND p.user_id = auth.uid())
);

-- Insert: users can send messages on accepted contact requests
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = messages.sender_id AND p.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM contact_requests cr
    WHERE cr.id = messages.contact_request_id
      AND cr.status = 'acceptee'
      AND (
        (cr.buyer_id = messages.sender_id AND cr.producer_id = messages.receiver_id)
        OR (cr.producer_id = messages.sender_id AND cr.buyer_id = messages.receiver_id)
      )
  )
);

-- Update: receivers can mark messages as read
CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = messages.receiver_id AND p.user_id = auth.uid())
);
