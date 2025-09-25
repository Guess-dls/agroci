-- 1. Table des catégories de produits
CREATE TABLE public.categories_produits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  icone TEXT, -- Pour stocker l'icône ou emoji de la catégorie
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les catégories par défaut
INSERT INTO public.categories_produits (nom, description, icone) VALUES 
('Céréales', 'Riz, maïs, blé, millet, sorgho', '🌾'),
('Tubercules', 'Igname, manioc, patate douce, pomme de terre', '🍠'),
('Légumineuses', 'Haricots, pois, arachides, soja', '🫘'),
('Fruits', 'Fruits tropicaux et locaux', '🍌'),
('Légumes', 'Légumes frais et feuilles', '🥬'),
('Produits transformés', 'Farines, huiles, conserves', '🏭');

-- 2. Table des catégories d'acheteurs
CREATE TABLE public.categories_acheteurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les catégories d'acheteurs par défaut
INSERT INTO public.categories_acheteurs (nom, description) VALUES 
('Consommateurs', 'Particuliers achetant pour consommation personnelle'),
('Commerçants', 'Détaillants et grossistes'),
('Institutions', 'Écoles, hôpitaux, restaurants, cantines'),
('Industries agroalimentaires', 'Entreprises de transformation alimentaire');

-- 3. Table des plans d'abonnement
CREATE TABLE public.abonnements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  montant DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  duree_jours INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer les plans d'abonnement par défaut
INSERT INTO public.abonnements (nom, montant, credits, duree_jours, description) VALUES 
('Starter', 10000, 100, 30, 'Plan de base avec 100 crédits pour 30 jours'),
('Premium', 20000, 250, 30, 'Plan premium avec 250 crédits pour 30 jours'),
('Pro', 35000, 500, 30, 'Plan professionnel avec 500 crédits pour 30 jours');

-- 4. Table des transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  abonnement_id UUID REFERENCES public.abonnements(id),
  type_transaction TEXT NOT NULL CHECK (type_transaction IN ('achat_abonnement', 'utilisation_credit', 'bonus')),
  montant DECIMAL(10,2),
  credits_ajoutes INTEGER DEFAULT 0,
  credits_utilises INTEGER DEFAULT 0,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'echoue', 'annule')),
  reference_paiement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Ajouter la colonne categorie_id à la table products
ALTER TABLE public.products 
ADD COLUMN categorie_id UUID REFERENCES public.categories_produits(id);

-- 6. Ajouter la colonne type_acheteur à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN type_acheteur UUID REFERENCES public.categories_acheteurs(id);

-- 7. Ajouter la colonne credits à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN credits INTEGER NOT NULL DEFAULT 0;

-- 8. Ajouter la colonne acheteurs_cibles à la table products (pour cibler certains types d'acheteurs)
ALTER TABLE public.products 
ADD COLUMN acheteurs_cibles UUID[] DEFAULT '{}';

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.categories_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories_acheteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour categories_produits (lecture publique)
CREATE POLICY "Tout le monde peut voir les catégories de produits" 
ON public.categories_produits 
FOR SELECT 
USING (true);

CREATE POLICY "Admins peuvent modifier les catégories de produits" 
ON public.categories_produits 
FOR ALL 
USING (get_user_type() = 'admin');

-- Politiques RLS pour categories_acheteurs (lecture publique)
CREATE POLICY "Tout le monde peut voir les catégories d'acheteurs" 
ON public.categories_acheteurs 
FOR SELECT 
USING (true);

CREATE POLICY "Admins peuvent modifier les catégories d'acheteurs" 
ON public.categories_acheteurs 
FOR ALL 
USING (get_user_type() = 'admin');

-- Politiques RLS pour abonnements (lecture publique des plans actifs)
CREATE POLICY "Tout le monde peut voir les abonnements actifs" 
ON public.abonnements 
FOR SELECT 
USING (actif = true);

CREATE POLICY "Admins peuvent modifier les abonnements" 
ON public.abonnements 
FOR ALL 
USING (get_user_type() = 'admin');

-- Politiques RLS pour transactions (utilisateurs voient leurs propres transactions)
CREATE POLICY "Les utilisateurs peuvent voir leurs propres transactions" 
ON public.transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = transactions.user_id 
  AND p.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent créer leurs propres transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = transactions.user_id 
  AND p.user_id = auth.uid()
));

CREATE POLICY "Admins peuvent voir toutes les transactions" 
ON public.transactions 
FOR SELECT 
USING (get_user_type() = 'admin');

-- Triggers pour updated_at
CREATE TRIGGER update_categories_produits_updated_at
BEFORE UPDATE ON public.categories_produits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_acheteurs_updated_at
BEFORE UPDATE ON public.categories_acheteurs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_abonnements_updated_at
BEFORE UPDATE ON public.abonnements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour créditer un utilisateur
CREATE OR REPLACE FUNCTION public.crediter_utilisateur(
  user_profile_id UUID,
  abonnement_id_param UUID,
  reference_paiement_param TEXT DEFAULT NULL
) 
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  credits_a_ajouter INTEGER;
  montant_abonnement DECIMAL(10,2);
  nom_abonnement TEXT;
  user_name TEXT;
BEGIN
  -- Récupérer les informations de l'abonnement
  SELECT credits, montant, nom INTO credits_a_ajouter, montant_abonnement, nom_abonnement
  FROM public.abonnements 
  WHERE id = abonnement_id_param AND actif = true;

  IF NOT FOUND THEN
    RETURN 'Abonnement non trouvé ou inactif';
  END IF;

  -- Récupérer le nom de l'utilisateur
  SELECT (nom || ' ' || prenom) INTO user_name
  FROM public.profiles 
  WHERE id = user_profile_id;

  IF NOT FOUND THEN
    RETURN 'Utilisateur non trouvé';
  END IF;

  -- Ajouter les crédits au compte utilisateur
  UPDATE public.profiles 
  SET credits = credits + credits_a_ajouter
  WHERE id = user_profile_id;

  -- Enregistrer la transaction
  INSERT INTO public.transactions (
    user_id, 
    abonnement_id, 
    type_transaction, 
    montant, 
    credits_ajoutes, 
    description,
    statut,
    reference_paiement
  ) VALUES (
    user_profile_id,
    abonnement_id_param,
    'achat_abonnement',
    montant_abonnement,
    credits_a_ajouter,
    'Achat abonnement ' || nom_abonnement,
    'valide',
    reference_paiement_param
  );

  RETURN 'Utilisateur ' || user_name || ' crédité de ' || credits_a_ajouter || ' crédits pour l''abonnement ' || nom_abonnement;
END;
$$;