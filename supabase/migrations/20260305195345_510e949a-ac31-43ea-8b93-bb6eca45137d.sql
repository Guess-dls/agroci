-- Optimisation de la messagerie interne: performances + temps réel fiable
CREATE INDEX IF NOT EXISTS idx_messages_contact_request_created_at
ON public.messages (contact_request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_contact_request_receiver_read
ON public.messages (contact_request_id, receiver_id, read);

CREATE INDEX IF NOT EXISTS idx_contact_requests_buyer_status_created_at
ON public.contact_requests (buyer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_requests_producer_status_created_at
ON public.contact_requests (producer_id, status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'contact_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_requests;
  END IF;
END $$;