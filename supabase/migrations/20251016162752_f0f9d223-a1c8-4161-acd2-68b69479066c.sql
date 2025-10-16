-- Ajouter une policy RLS pour permettre aux acheteurs de voir leurs propres vues de produits
CREATE POLICY "Les acheteurs peuvent voir leurs propres vues"
ON public.product_views
FOR SELECT
USING (viewer_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));