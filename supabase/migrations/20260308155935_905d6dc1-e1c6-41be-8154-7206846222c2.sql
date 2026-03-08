
-- Admin can view all contact_requests
CREATE POLICY "Admins peuvent voir toutes les demandes de contact"
ON public.contact_requests FOR SELECT
TO authenticated
USING (get_user_type() = 'admin');

-- Admin can view all messages
CREATE POLICY "Admins peuvent voir tous les messages"
ON public.messages FOR SELECT
TO authenticated
USING (get_user_type() = 'admin');

-- Admin can view all whatsapp_clicks
CREATE POLICY "Admins peuvent voir tous les clics WhatsApp"
ON public.whatsapp_clicks FOR SELECT
TO authenticated
USING (get_user_type() = 'admin');

-- Admin can view all product_views
CREATE POLICY "Admins peuvent voir toutes les vues de produits"
ON public.product_views FOR SELECT
TO authenticated
USING (get_user_type() = 'admin');
