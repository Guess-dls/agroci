
-- Add missing columns
ALTER TABLE public.messages ADD COLUMN receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD COLUMN plan TEXT DEFAULT 'mensuel';
ALTER TABLE public.categories_produits ADD COLUMN description TEXT DEFAULT '';

-- Create abonnements table
CREATE TABLE public.abonnements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  prix NUMERIC NOT NULL DEFAULT 0,
  duree_jours INTEGER NOT NULL DEFAULT 30,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view abonnements" ON public.abonnements FOR SELECT USING (true);

-- Add foreign key from transactions to abonnements
ALTER TABLE public.transactions ADD CONSTRAINT transactions_abonnement_id_fkey FOREIGN KEY (abonnement_id) REFERENCES public.abonnements(id);

-- Insert default abonnement
INSERT INTO public.abonnements (nom, prix, duree_jours, description) VALUES
  ('Abonnement Mensuel', 3000, 30, 'Abonnement mensuel pour publier des produits');

-- ========================================
-- FUNCTIONS
-- ========================================

-- Send message
CREATE OR REPLACE FUNCTION public.send_message(
  contact_request_id_param UUID,
  content_param TEXT
)
RETURNS void AS $$
DECLARE
  sender_profile_id UUID;
  receiver_profile_id UUID;
  cr RECORD;
BEGIN
  SELECT id INTO sender_profile_id FROM public.profiles WHERE user_id = auth.uid();
  IF sender_profile_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT * INTO cr FROM public.contact_requests WHERE id = contact_request_id_param;
  IF cr IS NULL THEN RAISE EXCEPTION 'Contact request not found'; END IF;
  IF cr.status != 'accepte' THEN RAISE EXCEPTION 'Conversation not accepted'; END IF;

  IF sender_profile_id = cr.buyer_id THEN
    receiver_profile_id := cr.producer_id;
  ELSIF sender_profile_id = cr.producer_id THEN
    receiver_profile_id := cr.buyer_id;
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;

  INSERT INTO public.messages (contact_request_id, sender_id, receiver_id, content)
  VALUES (contact_request_id_param, sender_profile_id, receiver_profile_id, content_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Accept contact request
CREATE OR REPLACE FUNCTION public.accept_contact_request(request_id_param UUID)
RETURNS void AS $$
DECLARE
  producer_profile_id UUID;
BEGIN
  SELECT id INTO producer_profile_id FROM public.profiles WHERE user_id = auth.uid();
  IF producer_profile_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  UPDATE public.contact_requests
  SET status = 'accepte', updated_at = now()
  WHERE id = request_id_param AND producer_id = producer_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Reject contact request
CREATE OR REPLACE FUNCTION public.reject_contact_request(request_id_param UUID)
RETURNS void AS $$
DECLARE
  producer_profile_id UUID;
BEGIN
  SELECT id INTO producer_profile_id FROM public.profiles WHERE user_id = auth.uid();
  IF producer_profile_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  UPDATE public.contact_requests
  SET status = 'refuse', updated_at = now()
  WHERE id = request_id_param AND producer_id = producer_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Delete conversation (soft delete)
CREATE OR REPLACE FUNCTION public.delete_conversation(contact_request_id_param UUID)
RETURNS void AS $$
DECLARE
  current_profile_id UUID;
  cr RECORD;
BEGIN
  SELECT id INTO current_profile_id FROM public.profiles WHERE user_id = auth.uid();
  IF current_profile_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT * INTO cr FROM public.contact_requests WHERE id = contact_request_id_param;
  IF cr IS NULL THEN RAISE EXCEPTION 'Conversation not found'; END IF;

  IF current_profile_id = cr.buyer_id THEN
    UPDATE public.contact_requests SET deleted_by_buyer = true WHERE id = contact_request_id_param;
  ELSIF current_profile_id = cr.producer_id THEN
    UPDATE public.contact_requests SET deleted_by_producer = true WHERE id = contact_request_id_param;
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Activate product boost
CREATE OR REPLACE FUNCTION public.activate_product_boost(
  p_product_id UUID,
  p_producer_id UUID,
  p_reference TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  boost_end TIMESTAMPTZ;
BEGIN
  boost_end := now() + INTERVAL '7 days';

  INSERT INTO public.product_boosts (product_id, producer_id, start_date, end_date, status, amount_paid, reference_paiement)
  VALUES (p_product_id, p_producer_id, now(), boost_end, 'active', 0, p_reference);

  UPDATE public.products SET is_boosted = true, boost_end_date = boost_end WHERE id = p_product_id;

  RETURN 'Produit boosté pendant 7 jours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get public producer info for product
CREATE OR REPLACE FUNCTION public.get_public_producer_info_for_product(product_id_param UUID)
RETURNS TABLE(id UUID, nom TEXT, prenom TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nom, p.prenom
  FROM public.profiles p
  JOIN public.products prod ON prod.producteur_id = p.id
  WHERE prod.id = product_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
