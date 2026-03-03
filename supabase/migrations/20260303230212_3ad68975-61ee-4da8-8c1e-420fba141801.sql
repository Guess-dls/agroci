
-- Drop old function first to change return type
DROP FUNCTION IF EXISTS public.accept_contact_request(uuid);

-- Create messages table for in-app messaging
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_request_id UUID REFERENCES public.contact_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see messages they sent"
ON public.messages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = messages.sender_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can see messages they received"
ON public.messages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = messages.receiver_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can send messages on accepted requests"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = messages.sender_id AND p.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.contact_requests cr
    WHERE cr.id = messages.contact_request_id AND cr.status = 'acceptee'
    AND ((cr.buyer_id = messages.sender_id AND cr.producer_id = messages.receiver_id)
      OR (cr.producer_id = messages.sender_id AND cr.buyer_id = messages.receiver_id))
  )
);

CREATE POLICY "Users can mark received messages as read"
ON public.messages FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = messages.receiver_id AND p.user_id = auth.uid()));

CREATE INDEX idx_messages_contact_request ON public.messages(contact_request_id);
CREATE INDEX idx_messages_receiver_read ON public.messages(receiver_id, read);

-- Recreate accept_contact_request WITHOUT whatsapp in return
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  SELECT cr.producer_id, cr.buyer_id
  INTO producer_profile_id, buyer_profile_id
  FROM public.contact_requests cr
  WHERE cr.id = request_id_param AND cr.status = 'en_attente';

  IF producer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = producer_profile_id AND p.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  SELECT (p.nom || ' ' || p.prenom) INTO buyer_name_var FROM public.profiles p WHERE p.id = buyer_profile_id;

  UPDATE public.contact_requests SET status = 'acceptee', updated_at = now() WHERE id = request_id_param;

  RETURN QUERY SELECT buyer_name_var, p.nom, p.prenom FROM public.profiles p WHERE p.id = buyer_profile_id;
END;
$function$;

-- Send message function
CREATE OR REPLACE FUNCTION public.send_message(contact_request_id_param UUID, content_param TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_profile_id UUID;
  receiver_profile_id UUID;
  cr RECORD;
  new_msg_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non autorisé'; END IF;

  SELECT p.id INTO sender_profile_id FROM public.profiles p WHERE p.user_id = auth.uid();
  IF sender_profile_id IS NULL THEN RAISE EXCEPTION 'Profil non trouvé'; END IF;

  SELECT * INTO cr FROM public.contact_requests WHERE id = contact_request_id_param AND status = 'acceptee';
  IF cr IS NULL THEN RAISE EXCEPTION 'Conversation non trouvée'; END IF;

  IF cr.buyer_id = sender_profile_id THEN receiver_profile_id := cr.producer_id;
  ELSIF cr.producer_id = sender_profile_id THEN receiver_profile_id := cr.buyer_id;
  ELSE RAISE EXCEPTION 'Non autorisé'; END IF;

  INSERT INTO public.messages (contact_request_id, sender_id, receiver_id, content)
  VALUES (contact_request_id_param, sender_profile_id, receiver_profile_id, content_param)
  RETURNING id INTO new_msg_id;

  RETURN json_build_object('success', true, 'message_id', new_msg_id);
END;
$function$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
