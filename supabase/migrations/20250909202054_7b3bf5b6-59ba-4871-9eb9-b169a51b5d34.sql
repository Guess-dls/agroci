-- Supprimer la vue problématique avec SECURITY DEFINER
DROP VIEW IF EXISTS public.public_producer_profiles;

-- Créer une politique RLS correcte pour les informations publiques des producteurs
DROP POLICY IF EXISTS "profile_select_public_info_only" ON public.profiles;

CREATE POLICY "profile_select_own_or_public_producer_info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Utilisateurs peuvent voir leur propre profil complet
  (user_id = auth.uid()) 
  OR 
  -- Ou voir les informations publiques limitées des producteurs vérifiés (SANS WhatsApp)
  (user_type = 'producteur' AND verified = true AND auth.role() = 'authenticated')
);

-- Fonction pour obtenir seulement les informations publiques des producteurs
CREATE OR REPLACE FUNCTION public.get_public_producer_info_for_product(product_id_param uuid)
RETURNS TABLE(
  id uuid, 
  nom text, 
  prenom text, 
  pays text, 
  region text, 
  verified boolean,
  type_activite text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nom,
    p.prenom,
    p.pays,
    p.region,
    p.verified,
    p.type_activite
  FROM public.profiles p
  JOIN public.products prod ON prod.producteur_id = p.id
  WHERE prod.id = product_id_param
    AND p.user_type = 'producteur'
    AND p.verified = true;
END;
$$;