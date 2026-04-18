-- Table pour stocker les codes OTP hashés
CREATE TABLE public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'recovery')),
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_codes_email_type ON public.verification_codes(email, type, consumed);
CREATE INDEX idx_verification_codes_expires ON public.verification_codes(expires_at);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Aucune policy : seul le service-role (edge functions) y accède
-- RLS activée sans policy = tout est bloqué pour les clients

-- Ajout d'une colonne email_verified sur profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Fonction pour vérifier si un email est vérifié (utilisable par les clients)
CREATE OR REPLACE FUNCTION public.is_email_verified(email_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_var UUID;
  verified BOOLEAN;
BEGIN
  SELECT id INTO user_id_var FROM auth.users WHERE email = email_param LIMIT 1;
  IF user_id_var IS NULL THEN RETURN false; END IF;
  SELECT email_verified INTO verified FROM public.profiles WHERE user_id = user_id_var;
  RETURN COALESCE(verified, false);
END;
$$;