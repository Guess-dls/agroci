-- Corriger la fonction get_secure_producer_contact et créer le système de demandes de contact

-- D'abord, supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.get_secure_producer_contact(uuid, uuid);

-- Créer la table des demandes de contact
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'acceptee', 'refusee')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(buyer_id, producer_id, product_id)
);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Policies pour contact_requests
CREATE POLICY "Les acheteurs peuvent créer des demandes"
ON public.contact_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = buyer_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Les acheteurs peuvent voir leurs demandes"
ON public.contact_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = buyer_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Les producteurs peuvent voir les demandes qui leur sont adressées"
ON public.contact_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = producer_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Les producteurs peuvent mettre à jour leurs demandes"
ON public.contact_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = producer_id AND user_id = auth.uid()
  )
);

-- Nouvelle fonction pour créer une demande de contact
CREATE OR REPLACE FUNCTION public.create_contact_request(
  producer_profile_id UUID,
  product_id_param UUID,
  message_text TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Vérifier les crédits suffisants
  IF buyer_credits < 1 THEN
    RAISE EXCEPTION 'Crédits insuffisants pour contacter ce producteur';
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

  -- Créer ou mettre à jour la demande de contact
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

-- Fonction pour accepter une demande de contact
CREATE OR REPLACE FUNCTION public.accept_contact_request(request_id_param UUID)
RETURNS TABLE(whatsapp TEXT, nom TEXT, prenom TEXT, buyer_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  producer_profile_id UUID;
  buyer_profile_id UUID;
  buyer_credits INTEGER;
  product_id_var UUID;
  producer_name TEXT;
  v_buyer_name TEXT;
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

  -- Vérifier les crédits de l'acheteur
  SELECT p.credits, (p.nom || ' ' || p.prenom)
  INTO buyer_credits, v_buyer_name
  FROM public.profiles p
  WHERE p.id = buyer_profile_id;

  IF buyer_credits < 1 THEN
    RAISE EXCEPTION 'L''acheteur n''a plus assez de crédits';
  END IF;

  -- Déduire 1 crédit de l'acheteur
  UPDATE public.profiles 
  SET credits = credits - 1
  WHERE id = buyer_profile_id;

  -- Obtenir le nom du producteur
  SELECT (p.nom || ' ' || p.prenom) INTO producer_name
  FROM public.profiles p
  WHERE p.id = producer_profile_id;

  -- Enregistrer la transaction
  INSERT INTO public.transactions (
    user_id,
    type_transaction,
    credits_utilises,
    description,
    statut
  ) VALUES (
    buyer_profile_id,
    'contact_producteur',
    1,
    'Contact du producteur ' || producer_name,
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
    v_buyer_name
  FROM public.profiles p
  WHERE p.id = buyer_profile_id;
END;
$$;

-- Fonction pour refuser une demande de contact
CREATE OR REPLACE FUNCTION public.reject_contact_request(request_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  producer_profile_id UUID;
BEGIN
  -- Vérifier l'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé - authentification requise';
  END IF;

  -- Obtenir l'ID du producteur
  SELECT cr.producer_id INTO producer_profile_id
  FROM public.contact_requests cr
  WHERE cr.id = request_id_param;

  IF producer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Demande de contact non trouvée';
  END IF;

  -- Vérifier que l'utilisateur actuel est le producteur
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = producer_profile_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  -- Mettre à jour le statut
  UPDATE public.contact_requests
  SET status = 'refusee', updated_at = now()
  WHERE id = request_id_param;

  RETURN json_build_object('success', true, 'message', 'Demande refusée');
END;
$$;