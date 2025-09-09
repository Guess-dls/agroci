-- Mettre à jour le type d'un utilisateur existant en admin pour les tests
-- Remplacer l'email par celui d'un utilisateur test existant
UPDATE public.profiles 
SET user_type = 'admin'::user_type 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@test.com' 
  LIMIT 1
);

-- Si aucun utilisateur admin@test.com n'existe, cette requête ne fera rien
-- L'administrateur devra créer un compte avec cet email ou modifier cette requête
-- avec l'email d'un utilisateur existant qu'il souhaite promouvoir admin