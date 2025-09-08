-- Approuver tous les produits existants pour les tests
UPDATE public.products 
SET status = 'approuve' 
WHERE status = 'en_attente';