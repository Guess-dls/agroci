-- Create secure function to expose producer contact only after an accepted contact request
CREATE OR REPLACE FUNCTION public.get_secure_producer_contact(
  producer_profile_id uuid,
  product_id uuid
)
RETURNS TABLE(
  whatsapp text,
  nom text,
  prenom text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  buyer_profile_id uuid;
  is_allowed boolean;
BEGIN
  -- Require authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé - authentification requise';
  END IF;

  -- Resolve current buyer profile id
  SELECT p.id INTO buyer_profile_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  IF buyer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profil utilisateur non trouvé';
  END IF;

  -- Ensure there is an accepted contact request for this buyer/producer/product
  SELECT EXISTS (
    SELECT 1
    FROM public.contact_requests cr
    WHERE cr.buyer_id = buyer_profile_id
      AND cr.producer_id = producer_profile_id
      AND cr.product_id = product_id
      AND cr.status = 'acceptee'
  ) INTO is_allowed;

  IF NOT is_allowed THEN
    RAISE EXCEPTION 'Accès refusé - demande non acceptée';
  END IF;

  -- Return the verified producer contact info
  RETURN QUERY
  SELECT pr.whatsapp, pr.nom, pr.prenom
  FROM public.profiles pr
  WHERE pr.id = producer_profile_id
    AND pr.user_type = 'producteur'
    AND pr.verified = true;
END;
$function$;