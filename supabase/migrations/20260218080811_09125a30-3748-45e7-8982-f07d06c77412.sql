
-- 1. Mettre à jour les abonnements existants avec les 3 nouveaux packs
DELETE FROM public.abonnements;

INSERT INTO public.abonnements (nom, montant, credits, duree_jours, actif, description) VALUES
  ('Pack Essentiel', 5000, 25, 30, true, '25 crédits pour contacter les producteurs'),
  ('Pack Pro', 10000, 50, 30, true, '50 crédits pour un usage intensif'),
  ('Pack Premium', 15000, 80, 30, true, '80 crédits au meilleur tarif');

-- 2. Mettre à jour la fonction accept_contact_request pour déduire 5 crédits de chaque côté
CREATE OR REPLACE FUNCTION public.accept_contact_request(request_id_param uuid)
 RETURNS TABLE(whatsapp text, nom text, prenom text, buyer_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  producer_profile_id UUID;
  buyer_profile_id UUID;
  producer_credits INTEGER;
  buyer_credits INTEGER;
  product_id_var UUID;
  producer_name TEXT;
  buyer_name_var TEXT;
BEGIN
  -- Vérifier l'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé - authentification requise';
  END IF;

  -- Obtenir les informations de la demande
  SELECT cr.producer_id, cr.buyer_id, cr.product_id
  INTO producer_profile_id, buyer_profile_id, product_id_var
  FROM public.contact_requests cr
  WHERE cr.id = request_id_param AND cr.status = 'en_attente';

  IF producer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Demande de contact non trouvée ou déjà traitée';
  END IF;

  -- Vérifier que l'utilisateur actuel est le producteur
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = producer_profile_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Non autorisé - vous n''êtes pas le producteur concerné';
  END IF;

  -- Vérifier les crédits du producteur (minimum 5)
  SELECT p.credits, (p.nom || ' ' || p.prenom)
  INTO producer_credits, producer_name
  FROM public.profiles p
  WHERE p.id = producer_profile_id;

  IF producer_credits < 5 THEN
    RAISE EXCEPTION 'Crédits insuffisants pour accepter cette demande. Il vous faut au moins 5 crédits.';
  END IF;

  -- Vérifier les crédits de l'acheteur (minimum 5)
  SELECT p.credits, (p.nom || ' ' || p.prenom)
  INTO buyer_credits, buyer_name_var
  FROM public.profiles p
  WHERE p.id = buyer_profile_id;

  IF buyer_credits < 5 THEN
    RAISE EXCEPTION 'L''acheteur n''a plus assez de crédits (minimum 5 requis)';
  END IF;

  -- Déduire 5 crédits de l'acheteur
  UPDATE public.profiles 
  SET credits = credits - 5
  WHERE id = buyer_profile_id;

  -- Enregistrer la transaction de l'acheteur
  INSERT INTO public.transactions (
    user_id,
    type_transaction,
    credits_utilises,
    description,
    statut
  ) VALUES (
    buyer_profile_id,
    'contact_producteur',
    5,
    'Contact avec le producteur ' || producer_name,
    'valide'
  );

  -- Déduire 5 crédits du producteur
  UPDATE public.profiles 
  SET credits = credits - 5
  WHERE id = producer_profile_id;

  -- Enregistrer la transaction du producteur
  INSERT INTO public.transactions (
    user_id,
    type_transaction,
    credits_utilises,
    description,
    statut
  ) VALUES (
    producer_profile_id,
    'contact_producteur',
    5,
    'Acceptation de demande de ' || buyer_name_var,
    'valide'
  );

  -- Enregistrer le clic WhatsApp
  INSERT INTO public.whatsapp_clicks (product_id, clicker_id)
  VALUES (product_id_var, buyer_profile_id);

  -- Mettre à jour le statut de la demande
  UPDATE public.contact_requests
  SET status = 'acceptee', updated_at = now()
  WHERE id = request_id_param;

  -- Retourner les informations de contact de l'acheteur
  RETURN QUERY
  SELECT 
    p.whatsapp,
    p.nom,
    p.prenom,
    buyer_name_var
  FROM public.profiles p
  WHERE p.id = buyer_profile_id;
END;
$function$;

-- 3. Mettre à jour create_contact_request pour vérifier 5 crédits minimum
CREATE OR REPLACE FUNCTION public.create_contact_request(producer_profile_id uuid, product_id_param uuid, message_text text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  buyer_profile_id UUID;
  buyer_credits INTEGER;
  producer_name TEXT;
  request_id UUID;
BEGIN
  -- Vérifier l'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé - authentification requise';
  END IF;

  -- Obtenir l'ID et les crédits de l'acheteur
  SELECT p.id, p.credits INTO buyer_profile_id, buyer_credits
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  IF buyer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profil utilisateur non trouvé';
  END IF;

  -- Vérifier que l'acheteur a au moins 5 crédits
  IF buyer_credits < 5 THEN
    RAISE EXCEPTION 'Crédits insuffisants pour contacter ce producteur. Il vous faut au moins 5 crédits.';
  END IF;

  -- Vérifier que le producteur existe et est vérifié
  SELECT (p.nom || ' ' || p.prenom) INTO producer_name
  FROM public.profiles p
  WHERE p.id = producer_profile_id 
    AND p.user_type = 'producteur'
    AND p.verified = true;

  IF producer_name IS NULL THEN
    RAISE EXCEPTION 'Producteur non trouvé ou non vérifié';
  END IF;

  -- Créer ou mettre à jour la demande de contact (SANS déduire de crédits)
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
