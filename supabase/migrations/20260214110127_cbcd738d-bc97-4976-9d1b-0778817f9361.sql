
-- Fix system_settings RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins peuvent modifier les paramètres système" ON public.system_settings;
DROP POLICY IF EXISTS "Admins peuvent voir les paramètres système" ON public.system_settings;

CREATE POLICY "Admins peuvent gérer les paramètres système"
ON public.system_settings
FOR ALL
TO authenticated
USING (get_user_type() = 'admin'::text)
WITH CHECK (get_user_type() = 'admin'::text);

-- Add subscription_expires_at column to profiles for 30-day expiry tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone DEFAULT NULL;
