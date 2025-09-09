-- Créer un compte admin de test via une insertion directe dans les profils
-- (L'utilisateur devra ensuite créer le compte auth correspondant)

-- D'abord, créons une fonction pour faciliter la création d'un admin
CREATE OR REPLACE FUNCTION create_admin_profile(
  admin_email TEXT,
  admin_nom TEXT,
  admin_prenom TEXT,
  admin_pays TEXT DEFAULT 'Côte d''Ivoire',
  admin_whatsapp TEXT DEFAULT '+225'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Vérifier si l'utilisateur existe dans auth.users
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF user_uuid IS NULL THEN
    RETURN 'Utilisateur non trouvé. Veuillez d''abord créer le compte via l''inscription.';
  END IF;
  
  -- Insérer ou mettre à jour le profil admin
  INSERT INTO public.profiles (
    user_id, 
    nom, 
    prenom, 
    pays, 
    whatsapp, 
    user_type,
    verified
  )
  VALUES (
    user_uuid,
    admin_nom,
    admin_prenom,
    admin_pays,
    admin_whatsapp,
    'admin',
    true
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    user_type = 'admin',
    verified = true,
    nom = admin_nom,
    prenom = admin_prenom,
    pays = admin_pays,
    whatsapp = admin_whatsapp;
    
  RETURN 'Profil admin créé avec succès pour ' || admin_email;
END;
$$;

-- Créer aussi une fonction simple pour promouvoir un utilisateur existant en admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Trouver l'utilisateur
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RETURN 'Utilisateur non trouvé: ' || user_email;
  END IF;
  
  -- Mettre à jour le profil
  UPDATE public.profiles 
  SET user_type = 'admin', verified = true
  WHERE user_id = user_uuid;
  
  IF FOUND THEN
    RETURN 'Utilisateur promu admin: ' || user_email;
  ELSE
    RETURN 'Profil non trouvé pour: ' || user_email;
  END IF;
END;
$$;