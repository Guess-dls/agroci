
-- ========================================
-- 1. PROFILES TABLE
-- ========================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nom TEXT NOT NULL DEFAULT '',
  prenom TEXT NOT NULL DEFAULT '',
  pays TEXT DEFAULT '',
  region TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  user_type TEXT NOT NULL DEFAULT 'acheteur' CHECK (user_type IN ('producteur', 'acheteur', 'admin')),
  type_activite TEXT DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT false,
  suspended BOOLEAN NOT NULL DEFAULT false,
  subscription_active BOOLEAN NOT NULL DEFAULT false,
  subscription_end_date TIMESTAMPTZ,
  subscription_required BOOLEAN NOT NULL DEFAULT true,
  boost_payment_required BOOLEAN NOT NULL DEFAULT true,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 2. CATEGORIES PRODUITS
-- ========================================
CREATE TABLE public.categories_produits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  icone TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories_produits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories_produits FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories_produits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- ========================================
-- 3. CATEGORIES ACHETEURS
-- ========================================
CREATE TABLE public.categories_acheteurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories_acheteurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer categories are viewable by everyone" ON public.categories_acheteurs FOR SELECT USING (true);
CREATE POLICY "Admins can manage buyer categories" ON public.categories_acheteurs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- ========================================
-- 4. PRODUCTS TABLE
-- ========================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  prix NUMERIC NOT NULL DEFAULT 0,
  quantite TEXT DEFAULT '',
  description TEXT DEFAULT '',
  localisation TEXT DEFAULT '',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'approuve', 'rejete')),
  hidden BOOLEAN NOT NULL DEFAULT false,
  categorie_id UUID REFERENCES public.categories_produits(id),
  producteur_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  acheteurs_cibles TEXT[] DEFAULT '{}',
  views_count INTEGER NOT NULL DEFAULT 0,
  whatsapp_clicks INTEGER NOT NULL DEFAULT 0,
  is_boosted BOOLEAN NOT NULL DEFAULT false,
  boost_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Producers can insert own products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = producteur_id AND user_id = auth.uid())
);
CREATE POLICY "Producers can update own products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = producteur_id AND user_id = auth.uid())
);
CREATE POLICY "Producers can delete own products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = producteur_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- ========================================
-- 5. SUBSCRIPTIONS TABLE
-- ========================================
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'mensuel',
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  nom TEXT DEFAULT 'Abonnement Mensuel',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "System can manage subscriptions" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- ========================================
-- 6. PRODUCT VIEWS
-- ========================================
CREATE TABLE public.product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert views" ON public.product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all views" ON public.product_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = viewer_id AND profiles.user_id = auth.uid())
);

-- ========================================
-- 7. WHATSAPP CLICKS
-- ========================================
CREATE TABLE public.whatsapp_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  clicker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert clicks" ON public.whatsapp_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all clicks" ON public.whatsapp_clicks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- ========================================
-- 8. CONTACT REQUESTS
-- ========================================
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'accepte', 'refuse')),
  message TEXT,
  deleted_by_buyer BOOLEAN NOT NULL DEFAULT false,
  deleted_by_producer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contact requests" ON public.contact_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE (id = buyer_id OR id = producer_id) AND profiles.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Authenticated users can insert contact requests" ON public.contact_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = buyer_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Participants can update contact requests" ON public.contact_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE (id = buyer_id OR id = producer_id) AND profiles.user_id = auth.uid())
);

-- ========================================
-- 9. MESSAGES
-- ========================================
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_request_id UUID REFERENCES public.contact_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.contact_requests cr
    JOIN public.profiles p ON (p.id = cr.buyer_id OR p.id = cr.producer_id)
    WHERE cr.id = contact_request_id AND p.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Participants can insert messages" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = sender_id AND profiles.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.contact_requests cr
    JOIN public.profiles p ON (p.id = cr.buyer_id OR p.id = cr.producer_id)
    WHERE cr.id = contact_request_id AND p.user_id = auth.uid() AND cr.status = 'accepte'
  )
);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.contact_requests cr
    JOIN public.profiles p ON (p.id = cr.buyer_id OR p.id = cr.producer_id)
    WHERE cr.id = contact_request_id AND p.user_id = auth.uid()
  )
);

-- ========================================
-- 10. TRANSACTIONS
-- ========================================
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type_transaction TEXT NOT NULL,
  montant NUMERIC,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  reference_paiement TEXT,
  credits_ajoutes INTEGER DEFAULT 0,
  credits_utilises INTEGER DEFAULT 0,
  abonnement_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);

-- ========================================
-- 11. PRODUCT BOOSTS
-- ========================================
CREATE TABLE public.product_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  reference_paiement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own boosts" ON public.product_boosts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = producer_id AND profiles.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "System can manage boosts" ON public.product_boosts FOR ALL USING (true);

-- ========================================
-- 12. SYSTEM SETTINGS
-- ========================================
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT 'true'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin')
);

-- ========================================
-- 13. STORAGE BUCKET FOR PRODUCT IMAGES
-- ========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ========================================
-- 14. FUNCTIONS
-- ========================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON public.contact_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_boosts_updated_at BEFORE UPDATE ON public.product_boosts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user signup: auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nom, prenom, pays, region, whatsapp, user_type, type_activite)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'pays', ''),
    COALESCE(NEW.raw_user_meta_data->>'region', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'acheteur'),
    COALESCE(NEW.raw_user_meta_data->>'type_activite', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create contact request function
CREATE OR REPLACE FUNCTION public.create_contact_request(
  producer_profile_id UUID,
  product_id_param UUID,
  message_text TEXT
)
RETURNS void AS $$
DECLARE
  buyer_profile_id UUID;
BEGIN
  SELECT id INTO buyer_profile_id FROM public.profiles WHERE user_id = auth.uid();
  
  IF buyer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF buyer_profile_id = producer_profile_id THEN
    RAISE EXCEPTION 'You cannot contact yourself';
  END IF;

  -- Check if a request already exists
  IF EXISTS (
    SELECT 1 FROM public.contact_requests
    WHERE buyer_id = buyer_profile_id AND producer_id = producer_profile_id AND product_id = product_id_param
  ) THEN
    RAISE EXCEPTION 'Une demande de contact existe déjà pour ce produit';
  END IF;

  INSERT INTO public.contact_requests (buyer_id, producer_id, product_id, message)
  VALUES (buyer_profile_id, producer_profile_id, product_id_param, message_text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Toggle user suspension (admin only)
CREATE OR REPLACE FUNCTION public.toggle_user_suspension(profile_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_status BOOLEAN;
  admin_check BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO admin_check;
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT suspended INTO current_status FROM public.profiles WHERE id = profile_id;
  UPDATE public.profiles SET suspended = NOT current_status WHERE id = profile_id;
  
  RETURN CASE WHEN current_status THEN 'Utilisateur réactivé' ELSE 'Utilisateur suspendu' END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Delete user account (admin only)
CREATE OR REPLACE FUNCTION public.delete_user_account(profile_id UUID)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
  admin_check BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO admin_check;
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT user_id INTO target_user_id FROM public.profiles WHERE id = profile_id;
  DELETE FROM public.profiles WHERE id = profile_id;
  
  RETURN 'Compte utilisateur supprimé';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Toggle product visibility (admin only)
CREATE OR REPLACE FUNCTION public.toggle_product_visibility(product_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_hidden BOOLEAN;
  admin_check BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO admin_check;
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT hidden INTO current_hidden FROM public.products WHERE id = product_id;
  UPDATE public.products SET hidden = NOT current_hidden WHERE id = product_id;
  
  RETURN CASE WHEN current_hidden THEN 'Produit rendu visible' ELSE 'Produit masqué' END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verify producer (admin only)
CREATE OR REPLACE FUNCTION public.verify_producer(profile_id UUID)
RETURNS TEXT AS $$
DECLARE
  admin_check BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO admin_check;
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles SET verified = true WHERE id = profile_id;
  
  RETURN 'Producteur vérifié avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('subscription_restrictions_enabled', 'false'::jsonb),
  ('boost_payment_required', 'true'::jsonb);

-- Insert default categories
INSERT INTO public.categories_produits (nom, icone) VALUES
  ('Céréales', '🌾'),
  ('Fruits', '🍎'),
  ('Légumes', '🥬'),
  ('Tubercules', '🥔'),
  ('Épices', '🌶️'),
  ('Cacao & Café', '☕'),
  ('Huiles', '🫒'),
  ('Noix & Graines', '🥜'),
  ('Produits laitiers', '🥛'),
  ('Viandes & Poissons', '🐟'),
  ('Boissons', '🧃'),
  ('Autres', '📦');

INSERT INTO public.categories_acheteurs (nom) VALUES
  ('Grossiste'),
  ('Détaillant'),
  ('Restaurant / Hôtel'),
  ('Transformateur'),
  ('Exportateur'),
  ('Consommateur final'),
  ('Autre');
