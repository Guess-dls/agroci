
-- Désactiver tous les abonnements existants
UPDATE abonnements SET actif = false;

-- Créer le plan test unique
INSERT INTO abonnements (nom, montant, credits, duree_jours, description, actif)
VALUES ('Test', 100, 10, 30, 'Plan test avec 10 crédits pour 100 FCFA', true);
