import { ArrowLeft, Shield, Eye, Database, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PolitiqueConfidentialite = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-4">Politique de Confidentialité</h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : Janvier 2025 | Conforme aux standards de protection des données
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Engagement de confidentialité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AgroCI s'engage à protéger votre vie privée et vos données personnelles. 
                Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8 text-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <Database className="h-6 w-6" />
              1. Données collectées
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Données d'inscription :</h3>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Nom et prénom</li>
                <li>Pays et région</li>
                <li>Numéro WhatsApp (obligatoire pour les producteurs)</li>
                <li>Type d'activité (pour les acheteurs)</li>
                <li>Adresse email de contact</li>
              </ul>
              
              <h3 className="text-lg font-medium">Données d'utilisation :</h3>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Historique de navigation sur la plateforme</li>
                <li>Produits consultés et recherches effectuées</li>
                <li>Interactions avec les annonces (vues, clics WhatsApp)</li>
                <li>Données de connexion (adresse IP, navigateur, appareil)</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <Eye className="h-6 w-6" />
              2. Finalité du traitement
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Producteurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <li>Création et gestion du profil</li>
                  <li>Publication des produits</li>
                  <li>Mise en relation avec les acheteurs</li>
                  <li>Statistiques de performance</li>
                  <li>Vérification du statut "Producteur vérifié"</li>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acheteurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <li>Recherche et filtrage des produits</li>
                  <li>Mise en relation avec les producteurs</li>
                  <li>Gestion des favoris et historique</li>
                  <li>Personnalisation de l'expérience</li>
                  <li>Recommandations de produits</li>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">3. Base légale</h2>
            <p className="text-muted-foreground">
              Le traitement de vos données repose sur :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li><strong>Votre consentement</strong> pour l'inscription et l'utilisation des services</li>
              <li><strong>L'exécution du contrat</strong> de mise en relation</li>
              <li><strong>L'intérêt légitime</strong> pour l'amélioration de nos services</li>
              <li><strong>Les obligations légales</strong> en matière de commerce</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">4. Conservation des données</h2>
            <div className="bg-muted/50 rounded-lg p-4">
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Données de profil :</strong> Conservées pendant la durée d'utilisation active + 3 ans</li>
                <li><strong>Données de navigation :</strong> 13 mois maximum</li>
                <li><strong>Données de contact :</strong> Supprimées à la fermeture du compte</li>
                <li><strong>Données statistiques :</strong> Anonymisées après 2 ans</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
              <Users className="h-6 w-6" />
              5. Vos droits
            </h2>
            <p className="text-muted-foreground mb-4">
              Conformément à la réglementation, vous disposez des droits suivants :
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Droit d'accès</h4>
                    <p className="text-sm text-muted-foreground">Consulter vos données personnelles</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Droit de rectification</h4>
                    <p className="text-sm text-muted-foreground">Corriger vos informations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Droit à l'effacement</h4>
                    <p className="text-sm text-muted-foreground">Supprimer votre compte</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Droit à la portabilité</h4>
                    <p className="text-sm text-muted-foreground">Récupérer vos données</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Droit d'opposition</h4>
                    <p className="text-sm text-muted-foreground">Refuser certains traitements</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Droit de limitation</h4>
                    <p className="text-sm text-muted-foreground">Restreindre l'usage de vos données</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">6. Cookies et traceurs</h2>
            <p className="text-muted-foreground">
              Notre site utilise des cookies pour améliorer votre expérience :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
              <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site</li>
              <li><strong>Cookies analytiques :</strong> Mesure d'audience (avec votre consentement)</li>
              <li><strong>Cookies de préférences :</strong> Mémorisation de vos choix</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">7. Sécurité</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-muted-foreground">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées 
                pour protéger vos données contre l'accès non autorisé, la perte ou la destruction :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-muted-foreground">
                <li>Chiffrement des données sensibles</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Surveillance continue des systèmes</li>
                <li>Sauvegardes sécurisées régulières</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">8. Contact</h2>
            <p className="text-muted-foreground">
              Pour exercer vos droits ou pour toute question concernant cette politique :
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p><strong>Email :</strong> josephguessanbi@gmail.com</p>
              <p><strong>WhatsApp :</strong> +225 0789363442</p>
              <p><strong>Courrier :</strong> Service Protection des Données - AgroCI, Abidjan, Côte d'Ivoire</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">9. Modifications</h2>
            <p className="text-muted-foreground">
              Cette politique peut être modifiée pour refléter les changements dans nos pratiques 
              ou la réglementation. Nous vous informerons de toute modification importante 
              par email ou via une notification sur la plateforme.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PolitiqueConfidentialite;
