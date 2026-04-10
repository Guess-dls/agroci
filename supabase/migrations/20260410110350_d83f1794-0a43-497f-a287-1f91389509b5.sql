
-- Admin function to toggle subscription requirement globally
CREATE OR REPLACE FUNCTION public.admin_toggle_subscription_global(new_value boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_check BOOLEAN;
  affected_count INTEGER;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO admin_check;
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Upsert system setting
  INSERT INTO public.system_settings (setting_key, setting_value)
  VALUES ('subscription_restrictions_enabled', to_jsonb(new_value))
  ON CONFLICT (setting_key) DO UPDATE SET setting_value = to_jsonb(new_value), updated_at = now();

  -- Update all producer profiles
  UPDATE public.profiles SET subscription_required = new_value WHERE user_type = 'producteur';
  GET DIAGNOSTICS affected_count = ROW_COUNT;

  RETURN format('Restrictions d''abonnement %s pour %s producteur(s)', 
    CASE WHEN new_value THEN 'activées' ELSE 'désactivées' END, affected_count);
END;
$$;

-- Admin function to toggle subscription requirement for a single user
CREATE OR REPLACE FUNCTION public.admin_toggle_subscription_user(target_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_check BOOLEAN;
  current_val BOOLEAN;
  target_name TEXT;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO admin_check;
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT subscription_required, (prenom || ' ' || nom) INTO current_val, target_name 
  FROM public.profiles WHERE id = target_profile_id;

  UPDATE public.profiles SET subscription_required = NOT current_val WHERE id = target_profile_id;

  RETURN format('Abonnement %s pour %s', 
    CASE WHEN current_val THEN 'optionnel' ELSE 'requis' END, target_name);
END;
$$;

-- Admin function to toggle boost payment globally
CREATE OR REPLACE FUNCTION public.admin_toggle_boost_global(new_value boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_check BOOLEAN;
  affected_count INTEGER;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO admin_check;
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.system_settings (setting_key, setting_value)
  VALUES ('boost_payment_required', to_jsonb(new_value))
  ON CONFLICT (setting_key) DO UPDATE SET setting_value = to_jsonb(new_value), updated_at = now();

  UPDATE public.profiles SET boost_payment_required = new_value WHERE user_type = 'producteur';
  GET DIAGNOSTICS affected_count = ROW_COUNT;

  RETURN format('Paiement boost %s pour %s producteur(s)', 
    CASE WHEN new_value THEN 'exigé' ELSE 'désactivé' END, affected_count);
END;
$$;

-- Admin function to toggle boost payment for a single user
CREATE OR REPLACE FUNCTION public.admin_toggle_boost_user(target_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_check BOOLEAN;
  current_val BOOLEAN;
  target_name TEXT;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'admin') INTO admin_check;
  IF NOT admin_check THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT boost_payment_required, (prenom || ' ' || nom) INTO current_val, target_name 
  FROM public.profiles WHERE id = target_profile_id;

  UPDATE public.profiles SET boost_payment_required = NOT current_val WHERE id = target_profile_id;

  RETURN format('Paiement boost %s pour %s', 
    CASE WHEN current_val THEN 'désactivé' ELSE 'exigé' END, target_name);
END;
$$;
