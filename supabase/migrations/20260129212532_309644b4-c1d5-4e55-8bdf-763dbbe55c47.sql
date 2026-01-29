-- Fix unrestricted INSERT policies on analytics tables

-- 1. Fix product_views table RLS policy
DROP POLICY IF EXISTS "Insertion libre des vues" ON public.product_views;

CREATE POLICY "Users can log their own views"
ON public.product_views FOR INSERT
WITH CHECK (
  viewer_id IS NULL 
  OR viewer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 2. Fix whatsapp_clicks table RLS policy  
DROP POLICY IF EXISTS "Insertion libre des clics" ON public.whatsapp_clicks;

CREATE POLICY "Users can log their own clicks"
ON public.whatsapp_clicks FOR INSERT
WITH CHECK (
  clicker_id IS NULL
  OR clicker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);