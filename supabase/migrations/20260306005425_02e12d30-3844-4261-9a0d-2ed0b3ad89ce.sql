-- Stabilisation messagerie: conserver les conversations actives + convertir le message initial en message interne

-- 1) Backfill: convertir les anciens messages de demande acceptée en premier message de conversation
INSERT INTO public.messages (contact_request_id, sender_id, receiver_id, content, created_at)
SELECT
  cr.id,
  cr.buyer_id,
  cr.producer_id,
  cr.message,
  COALESCE(cr.created_at, now())
FROM public.contact_requests cr
WHERE cr.status = 'acceptee'
  AND COALESCE(BTRIM(cr.message), '') <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE m.contact_request_id = cr.id
  );

-- 2) Empêcher la régression d'une conversation déjà acceptée vers en_attente
CREATE OR REPLACE FUNCTION public.create_contact_request(
  producer_profile_id uuid,
  product_id_param uuid,
  message_text text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  buyer_profile_id UUID;
  producer_name TEXT;
  request_id UUID;
  request_status TEXT;
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
  DO UPDATE SET
    status = CASE
      WHEN contact_requests.status = 'acceptee' THEN 'acceptee'
      ELSE 'en_attente'
    END,
    message = CASE
      WHEN contact_requests.status = 'acceptee' THEN contact_requests.message
      ELSE COALESCE(EXCLUDED.message, contact_requests.message)
    END,
    updated_at = now()
  RETURNING id, status INTO request_id, request_status;

  IF request_status = 'acceptee' THEN
    RETURN json_build_object(
      'success', true,
      'request_id', request_id,
      'status', request_status,
      'message', 'Conversation déjà active'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'request_id', request_id,
    'status', request_status,
    'message', 'Demande de contact envoyée au producteur'
  );
END;
$function$;

-- 3) À l'acceptation, injecter le message initial (si présent) dans la conversation interne
CREATE OR REPLACE FUNCTION public.accept_contact_request(request_id_param uuid)
RETURNS TABLE(buyer_name text, nom text, prenom text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  producer_profile_id UUID;
  buyer_profile_id UUID;
  buyer_name_var TEXT;
  initial_message TEXT;
  current_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  SELECT cr.producer_id, cr.buyer_id, cr.message, cr.status
  INTO producer_profile_id, buyer_profile_id, initial_message, current_status
  FROM public.contact_requests cr
  WHERE cr.id = request_id_param;

  IF producer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Demande non trouvée';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = producer_profile_id
      AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  IF current_status <> 'acceptee' THEN
    UPDATE public.contact_requests
    SET status = 'acceptee', updated_at = now()
    WHERE id = request_id_param;
  END IF;

  IF COALESCE(BTRIM(initial_message), '') <> ''
     AND NOT EXISTS (
       SELECT 1
       FROM public.messages m
       WHERE m.contact_request_id = request_id_param
     ) THEN
    INSERT INTO public.messages (contact_request_id, sender_id, receiver_id, content)
    VALUES (request_id_param, buyer_profile_id, producer_profile_id, initial_message);
  END IF;

  SELECT (p.nom || ' ' || p.prenom), p.nom, p.prenom
  INTO buyer_name_var, nom, prenom
  FROM public.profiles p
  WHERE p.id = buyer_profile_id;

  buyer_name := buyer_name_var;
  RETURN NEXT;
END;
$function$;