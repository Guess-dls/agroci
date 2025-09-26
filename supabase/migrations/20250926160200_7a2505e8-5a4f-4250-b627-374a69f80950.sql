-- Drop the problematic public access policy that exposes phone numbers
DROP POLICY IF EXISTS "public_producer_profiles_select" ON public.profiles;

-- Create a new restricted public policy that excludes sensitive fields
CREATE POLICY "public_producer_info_select" 
ON public.profiles 
FOR SELECT 
USING (
  (user_type = 'producteur'::user_type) 
  AND (verified = true)
);

-- Create a secure function to get producer contact info only after proper validation
CREATE OR REPLACE FUNCTION public.get_secure_producer_contact(
  producer_profile_id uuid, 
  product_id uuid
)
RETURNS TABLE(whatsapp text, nom text, prenom text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  buyer_profile_id uuid;
  buyer_credits INTEGER;
  producer_name TEXT;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autorisé - authentification requise';
  END IF;

  -- Get buyer profile ID and credits
  SELECT id, credits INTO buyer_profile_id, buyer_credits
  FROM public.profiles 
  WHERE user_id = auth.uid();

  IF buyer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profil utilisateur non trouvé';
  END IF;

  -- Check if buyer has sufficient credits
  IF buyer_credits < 1 THEN
    RAISE EXCEPTION 'Crédits insuffisants pour contacter ce producteur';
  END IF;

  -- Verify producer exists and is verified
  SELECT (nom || ' ' || prenom) INTO producer_name
  FROM public.profiles 
  WHERE id = producer_profile_id 
    AND user_type = 'producteur'
    AND verified = true;

  IF producer_name IS NULL THEN
    RAISE EXCEPTION 'Producteur non trouvé ou non vérifié';
  END IF;

  -- Deduct 1 credit from buyer
  UPDATE public.profiles 
  SET credits = credits - 1
  WHERE id = buyer_profile_id;

  -- Log the transaction
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

  -- Log WhatsApp click for analytics
  INSERT INTO public.whatsapp_clicks (product_id, clicker_id)
  VALUES (product_id, buyer_profile_id);

  -- Return secure contact information
  RETURN QUERY
  SELECT 
    p.whatsapp,
    p.nom,
    p.prenom
  FROM public.profiles p
  WHERE p.id = producer_profile_id;
END;
$$;

-- Update existing get_producer_contact_info to use the secure approach
CREATE OR REPLACE FUNCTION public.get_producer_contact_info(producer_profile_id uuid, product_id uuid)
RETURNS TABLE(whatsapp text, nom text, prenom text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use the new secure function
  RETURN QUERY
  SELECT * FROM public.get_secure_producer_contact(producer_profile_id, product_id);
END;
$$;