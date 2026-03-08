
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS boost_payment_required boolean NOT NULL DEFAULT true;
