-- Créer une table pour les paramètres système
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent gérer les paramètres système
CREATE POLICY "Admins peuvent voir les paramètres système" 
ON public.system_settings 
FOR SELECT 
USING (get_user_type() = 'admin');

CREATE POLICY "Admins peuvent modifier les paramètres système" 
ON public.system_settings 
FOR ALL 
USING (get_user_type() = 'admin');

-- Ajouter une colonne pour l'obligation d'abonnement par utilisateur
ALTER TABLE public.profiles 
ADD COLUMN subscription_required boolean NOT NULL DEFAULT false;

-- Insérer le paramètre global par défaut
INSERT INTO public.system_settings (setting_key, setting_value) 
VALUES ('subscription_restrictions_enabled', false);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();