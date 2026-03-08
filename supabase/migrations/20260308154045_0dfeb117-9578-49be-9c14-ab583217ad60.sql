CREATE OR REPLACE FUNCTION public.activate_product_boost(p_product_id uuid, p_producer_id uuid, p_reference text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_boost RECORD;
  new_end TIMESTAMP WITH TIME ZONE;
  product_name TEXT;
  normalized_reference TEXT;
BEGIN
  -- Normalize and uniquify free/admin references to avoid unique index collisions
  normalized_reference := NULLIF(BTRIM(p_reference), '');

  IF normalized_reference IS NOT NULL AND normalized_reference ILIKE 'boost_gratuit%' THEN
    normalized_reference := normalized_reference || '_' || gen_random_uuid()::text;
  END IF;

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
    VALUES (p_product_id, p_producer_id, new_end, 1200, normalized_reference);
  END IF;

  -- Record transaction
  INSERT INTO public.transactions (
    user_id, type_transaction, montant, description, statut, reference_paiement
  ) VALUES (
    p_producer_id, 'boost_produit', 1200,
    'Boost du produit: ' || product_name, 'valide', normalized_reference
  );

  RETURN 'Boost activé pour ' || product_name || ' jusqu''au ' || to_char(new_end, 'DD/MM/YYYY');
END;
$function$;