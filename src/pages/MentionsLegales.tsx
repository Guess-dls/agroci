import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const MentionsLegales = () => {
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
          <h1 className="text-4xl font-bold text-foreground mb-4">Mentions Légales</h1>
          <p className="text-muted-foreground">Dernière mise à jour : Janvier 2025</p>
        </div>

        <div className="space-y-8 text-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">1. Informations légales</h2>
            <div className="space-y-2">
              <p><strong>Nom de la plateforme :</strong> AgroCI</p>
              <p><strong>Forme juridique :</strong> Société de services numériques</p>
              <p><strong>Siège social :</strong> Abidjan, Côte d'Ivoire</p>
              <p><strong>Téléphone / WhatsApp :</strong> +225 0789363442</p>
              <p><strong>Email :</strong> josephguessanbi@gmail.com</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">2. Responsable de publication</h2>
            <p>
              Le responsable de la publication est le directeur de la publication d'AgroCI.
              Il peut être contacté à l'adresse email : josephguessanbi@gmail.com
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">3. Hébergement</h2>
            <div className="space-y-2">
              <p><strong>Hébergeur :</strong> Services d'hébergement cloud</p>
              <p><strong>Localisation :</strong> Serveurs sécurisés en Europe</p>
              <p>
                L'hébergeur assure la continuité de service 24h/24 et 7j/7, 
                conformément aux standards internationaux de sécurité.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">4. Propriété intellectuelle</h2>
            <p>
              Tous les éléments du site AgroCI (textes, images, graphismes, logo, icônes, sons, logiciels) 
              sont la propriété exclusive d'AgroCI, à l'exception des marques, logos ou contenus 
              appartenant à d'autres sociétés partenaires ou auteurs.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">5. Responsabilité</h2>
            <p>
              AgroCI agit en tant qu'intermédiaire technique permettant la mise en relation 
              entre producteurs et acheteurs. La plateforme ne peut être tenue responsable :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>De la qualité des produits proposés par les producteurs</li>
              <li>Des négociations et transactions effectuées via WhatsApp</li>
              <li>Des litiges commerciaux entre les parties</li>
              <li>De l'interruption temporaire du service pour maintenance</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">6. Protection des données</h2>
            <p>
              Conformément à la réglementation en vigueur, AgroCI s'engage à protéger 
              les données personnelles de ses utilisateurs. Pour plus d'informations, 
              consultez notre <a href="/politique-confidentialite" className="text-accent hover:underline">
              Politique de confidentialité</a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">7. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit ivoirien. 
              Tout litige relatif à l'utilisation du site sera de la compétence 
              exclusive des tribunaux d'Abidjan.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">8. Contact</h2>
            <p>
              Pour toute question concernant ces mentions légales, vous pouvez nous contacter :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Par WhatsApp : +225 0789363442</li>
              <li>Par email : josephguessanbi@gmail.com</li>
              <li>Par courrier à notre siège social</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegales;
