-- Empêcher l'auto-contact (acheteur = producteur)
CREATE OR REPLACE FUNCTION public.create_contact_request(producer_profile_id uuid, product_id_param uuid, message_text text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF buyer_profile_id = producer_profile_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous contacter vous-même';
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
$function$;

-- Suppression sécurisée d'une discussion (messages + demande de contact)
CREATE OR REPLACE FUNCTION public.delete_conversation(contact_request_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_profile_id UUID;
  cr RECORD;
  deleted_messages INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  SELECT p.id INTO current_profile_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  IF current_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profil non trouvé';
  END IF;

  SELECT * INTO cr
  FROM public.contact_requests
  WHERE id = contact_request_id_param;

  IF cr IS NULL THEN
    RAISE EXCEPTION 'Conversation non trouvée';
  END IF;

  IF cr.buyer_id <> current_profile_id AND cr.producer_id <> current_profile_id THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  DELETE FROM public.messages
  WHERE contact_request_id = contact_request_id_param;

  GET DIAGNOSTICS deleted_messages = ROW_COUNT;

  DELETE FROM public.contact_requests
  WHERE id = contact_request_id_param;

  RETURN json_build_object(
    'success', true,
    'deleted_messages', deleted_messages,
    'message', 'Discussion supprimée'
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.delete_conversation(uuid) TO authenticated;