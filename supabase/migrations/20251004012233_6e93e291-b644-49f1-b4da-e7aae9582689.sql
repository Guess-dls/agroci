-- Add missing foreign keys for reliable embeds and performance indexes
-- Safe-guard with conditional creation

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_requests_buyer_id_fkey'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD CONSTRAINT contact_requests_buyer_id_fkey
      FOREIGN KEY (buyer_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_requests_producer_id_fkey'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD CONSTRAINT contact_requests_producer_id_fkey
      FOREIGN KEY (producer_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_requests_product_id_fkey'
  ) THEN
    ALTER TABLE public.contact_requests
      ADD CONSTRAINT contact_requests_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES public.products(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- Helpful indexes for fast producer view
CREATE INDEX IF NOT EXISTS idx_contact_requests_producer_status
  ON public.contact_requests (producer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_requests_buyer
  ON public.contact_requests (buyer_id);

CREATE INDEX IF NOT EXISTS idx_contact_requests_product
  ON public.contact_requests (product_id);
