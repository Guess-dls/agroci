
-- 1. Create product_boosts table
CREATE TABLE public.product_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 1200,
  status TEXT NOT NULL DEFAULT 'active',
  reference_paiement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_boosts ENABLE ROW LEVEL SECURITY;

-- RLS: Producers can see their own boosts
CREATE POLICY "Producers can view their own boosts"
ON public.product_boosts FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = product_boosts.producer_id AND p.user_id = auth.uid()
));

-- RLS: Admins can see all boosts
CREATE POLICY "Admins can view all boosts"
ON public.product_boosts FOR SELECT
TO authenticated
USING (get_user_type() = 'admin');

-- RLS: Producers can insert their own boosts
CREATE POLICY "Producers can insert their own boosts"
ON public.product_boosts FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = product_boosts.producer_id AND p.user_id = auth.uid()
));

-- RLS: Admins can manage all boosts
CREATE POLICY "Admins can manage all boosts"
ON public.product_boosts FOR ALL
TO authenticated
USING (get_user_type() = 'admin');

-- 2. Add subscription_active and subscription_end_date to profiles for easy tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN NOT NULL DEFAULT false;

-- 3. Function to check if a producer has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(producer_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT subscription_active AND subscription_end_date > now()
     FROM public.profiles
     WHERE id = producer_profile_id AND user_type = 'producteur'),
    false
  );
$$;

-- 4. Function to activate subscription after payment
CREATE OR REPLACE FUNCTION public.activate_producer_subscription(
  producer_profile_id UUID,
  reference TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_end TIMESTAMP WITH TIME ZONE;
  new_start TIMESTAMP WITH TIME ZONE;
  new_end TIMESTAMP WITH TIME ZONE;
  producer_name TEXT;
BEGIN
  -- Get current subscription end date
  SELECT subscription_end_date, (nom || ' ' || prenom)
  INTO current_end, producer_name
  FROM public.profiles
  WHERE id = producer_profile_id AND user_type = 'producteur';

  IF producer_name IS NULL THEN
    RETURN 'Producteur non trouvé';
  END IF;

  -- If subscription is still active, extend from current end date
  IF current_end IS NOT NULL AND current_end > now() THEN
    new_start := current_end;
    new_end := current_end + INTERVAL '30 days';
  ELSE
    new_start := now();
    new_end := now() + INTERVAL '30 days';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET subscription_active = true,
      subscription_start_date = COALESCE(subscription_start_date, new_start),
      subscription_end_date = new_end,
      subscription_required = false
  WHERE id = producer_profile_id;

  -- Make all producer's products visible (unhide them)
  UPDATE public.products
  SET hidden = false
  WHERE producteur_id = producer_profile_id AND hidden = true;

  -- Record transaction
  INSERT INTO public.transactions (
    user_id, type_transaction, montant, description, statut, reference_paiement
  ) VALUES (
    producer_profile_id, 'abonnement_mensuel', 3000,
    'Abonnement mensuel AgroCI', 'valide', reference
  );

  RETURN 'Abonnement activé pour ' || producer_name || ' jusqu''au ' || to_char(new_end, 'DD/MM/YYYY');
END;
$$;

-- 5. Function to activate a product boost after payment
CREATE OR REPLACE FUNCTION public.activate_product_boost(
  p_product_id UUID,
  p_producer_id UUID,
  p_reference TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_boost RECORD;
  new_end TIMESTAMP WITH TIME ZONE;
  product_name TEXT;
BEGIN
  -- Check the product exists and belongs to the producer
  SELECT nom INTO product_name
  FROM public.products
  WHERE id = p_product_id AND producteur_id = p_producer_id;

  IF product_name IS NULL THEN
    RETURN 'Produit non trouvé ou non autorisé';
  END IF;

  -- Check for existing active boost
  SELECT * INTO existing_boost
  FROM public.product_boosts
  WHERE product_id = p_product_id AND status = 'active' AND end_date > now()
  LIMIT 1;

  IF existing_boost IS NOT NULL THEN
    -- Extend existing boost by 7 days
    new_end := existing_boost.end_date + INTERVAL '7 days';
    UPDATE public.product_boosts
    SET end_date = new_end, updated_at = now()
    WHERE id = existing_boost.id;
  ELSE
    -- Create new boost
    new_end := now() + INTERVAL '7 days';
    INSERT INTO public.product_boosts (product_id, producer_id, end_date, amount_paid, reference_paiement)
    VALUES (p_product_id, p_producer_id, new_end, 1200, p_reference);
  END IF;

  -- Record transaction
  INSERT INTO public.transactions (
    user_id, type_transaction, montant, description, statut, reference_paiement
  ) VALUES (
    p_producer_id, 'boost_produit', 1200,
    'Boost du produit: ' || product_name, 'valide', p_reference
  );

  RETURN 'Boost activé pour ' || product_name || ' jusqu''au ' || to_char(new_end, 'DD/MM/YYYY');
END;
$$;

-- 6. Function to deactivate expired subscriptions (to be called by cron)
CREATE OR REPLACE FUNCTION public.deactivate_expired_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Deactivate expired subscriptions
  WITH expired AS (
    UPDATE public.profiles
    SET subscription_active = false, subscription_required = true
    WHERE user_type = 'producteur'
      AND subscription_active = true
      AND subscription_end_date < now()
    RETURNING id
  )
  SELECT count(*) INTO affected_count FROM expired;

  -- Hide all products of expired producers
  UPDATE public.products
  SET hidden = true
  WHERE producteur_id IN (
    SELECT id FROM public.profiles
    WHERE user_type = 'producteur'
      AND subscription_active = false
      AND subscription_end_date < now()
  ) AND hidden = false;

  -- Deactivate expired boosts
  UPDATE public.product_boosts
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND end_date < now();

  RETURN affected_count;
END;
$$;

-- 7. Function to check if a product is currently boosted
CREATE OR REPLACE FUNCTION public.is_product_boosted(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.product_boosts
    WHERE product_id = p_product_id
      AND status = 'active'
      AND end_date > now()
  );
$$;
