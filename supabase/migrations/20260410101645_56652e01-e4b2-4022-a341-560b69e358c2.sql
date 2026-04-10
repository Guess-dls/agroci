
-- Fix product_views: require authentication for inserts
DROP POLICY IF EXISTS "Anyone can insert views" ON public.product_views;
CREATE POLICY "Authenticated users can insert views" ON public.product_views FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fix transactions: require authentication for inserts
DROP POLICY IF EXISTS "System can insert transactions" ON public.transactions;
CREATE POLICY "Authenticated users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fix product_boosts: restrict management to producers and admins
DROP POLICY IF EXISTS "System can manage boosts" ON public.product_boosts;
CREATE POLICY "Producers can insert own boosts" ON public.product_boosts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = producer_id AND profiles.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admins can update boosts" ON public.product_boosts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admins can delete boosts" ON public.product_boosts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);
