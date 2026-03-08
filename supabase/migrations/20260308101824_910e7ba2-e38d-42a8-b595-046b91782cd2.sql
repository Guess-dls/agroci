
-- Add soft-delete columns to contact_requests
ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS deleted_by_buyer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_by_producer boolean NOT NULL DEFAULT false;

-- Replace delete_conversation to do soft-delete per user
CREATE OR REPLACE FUNCTION public.delete_conversation(contact_request_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_profile_id UUID;
  cr RECORD;
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

  IF cr.buyer_id = current_profile_id THEN
    UPDATE public.contact_requests
    SET deleted_by_buyer = true, updated_at = now()
    WHERE id = contact_request_id_param;
  ELSIF cr.producer_id = current_profile_id THEN
    UPDATE public.contact_requests
    SET deleted_by_producer = true, updated_at = now()
    WHERE id = contact_request_id_param;
  ELSE
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  -- If both parties deleted, hard-delete everything
  IF (SELECT deleted_by_buyer AND deleted_by_producer FROM public.contact_requests WHERE id = contact_request_id_param) THEN
    DELETE FROM public.messages WHERE contact_request_id = contact_request_id_param;
    DELETE FROM public.contact_requests WHERE id = contact_request_id_param;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Discussion supprimée');
END;
$$;
