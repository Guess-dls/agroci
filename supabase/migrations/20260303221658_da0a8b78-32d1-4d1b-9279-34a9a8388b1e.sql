
-- Update create_contact_request to remove credit check (contacts are now free)
CREATE OR REPLACE FUNCTION public.create_contact_request(producer_profile_id uuid, product_id_param uuid, message_text text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  buyer_profile_id UUID;
  producer_name TEXT;
  request_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé - authentification requise';
  END IF;

  SELECT p.id INTO buyer_profile_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  IF buyer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profil utilisateur non trouvé';
  END IF;

  SELECT (p.nom || ' ' || p.prenom) INTO producer_name
  FROM public.profiles p
  WHERE p.id = producer_profile_id 
    AND p.user_type = 'producteur'
    AND p.verified = true;

  IF producer_name IS NULL THEN
    RAISE EXCEPTION 'Producteur non trouvé ou non vérifié';
  END IF;

  INSERT INTO public.contact_requests (buyer_id, producer_id, product_id, message, status)
  VALUES (buyer_profile_id, producer_profile_id, product_id_param, message_text, 'en_attente')
  ON CONFLICT (buyer_id, producer_id, product_id)
  DO UPDATE SET status = 'en_attente', updated_at = now(), message = message_text
  RETURNING id INTO request_id;

  RETURN json_build_object(
    'success', true,
    'request_id', request_id,
    'message', 'Demande de contact envoyée au producteur'
  );
END;
$$;

-- Update accept_contact_request to remove credit deduction (contacts are now free)
CREATE OR REPLACE FUNCTION public.accept_contact_request(request_id_param uuid)
 RETURNS TABLE(whatsapp text, nom text, prenom text, buyer_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  producer_profile_id UUID;
  buyer_profile_id UUID;
  product_id_var UUID;
  buyer_name_var TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé - authentification requise';
  END IF;

  SELECT cr.producer_id, cr.buyer_id, cr.product_id
  INTO producer_profile_id, buyer_profile_id, product_id_var
  FROM public.contact_requests cr
  WHERE cr.id = request_id_param AND cr.status = 'en_attente';

  IF producer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Demande de contact non trouvée ou déjà traitée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = producer_profile_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Non autorisé - vous n''êtes pas le producteur concerné';
  END IF;

  SELECT (p.nom || ' ' || p.prenom) INTO buyer_name_var
  FROM public.profiles p
  WHERE p.id = buyer_profile_id;

  -- Record WhatsApp click
  INSERT INTO public.whatsapp_clicks (product_id, clicker_id)
  VALUES (product_id_var, buyer_profile_id);

  -- Update request status
  UPDATE public.contact_requests
  SET status = 'acceptee', updated_at = now()
  WHERE id = request_id_param;

  -- Return buyer contact info
  RETURN QUERY
  SELECT 
    p.whatsapp,
    p.nom,
    p.prenom,
    buyer_name_var
  FROM public.profiles p
  WHERE p.id = buyer_profile_id;
END;
$$;
