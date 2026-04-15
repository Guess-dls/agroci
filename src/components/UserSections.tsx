import { ArrowRight, Leaf, ShoppingCart, CheckCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const UserSections = () => {
  const navigate = useNavigate();

  const features = {
    producer: [
      { icon: CheckCircle, title: "Inscription simple", desc: "Créez votre profil en quelques minutes" },
      { icon: CheckCircle, title: 'Badge "Vérifié"', desc: "Gagnez la confiance des acheteurs" },
      { icon: CheckCircle, title: "Contact WhatsApp", desc: "Communication directe et rapide" },
      { icon: BarChart3, title: "Statistiques", desc: "Suivez vos vues et contacts" },
    ],
    buyer: [
      { icon: CheckCircle, title: "Recherche avancée", desc: "Filtres par produit, prix, localisation" },
      { icon: CheckCircle, title: "Producteurs vérifiés", desc: "Qualité et traçabilité garanties" },
      { icon: CheckCircle, title: "Favoris & Historique", desc: "Retrouvez vos producteurs préférés" },
      { icon: CheckCircle, title: "Contact direct", desc: "Négociation via WhatsApp" },
    ],
  };

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Rejoignez Notre Communauté
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Que vous soyez producteur ou acheteur, notre plateforme vous connecte 
            directement pour des transactions transparentes et efficaces.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Producteurs */}
          <Card id="producteurs" className="border-0 shadow-soft hover:shadow-elevated transition-shadow rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-6 pt-10">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-success">
                <Leaf className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl text-foreground">Espace Producteur</CardTitle>
              <p className="text-muted-foreground">Vendez vos produits directement aux acheteurs professionnels</p>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              <div className="space-y-4">
                {features.producer.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">{title}</h4>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full rounded-xl bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-soft"
                onClick={() => navigate('/auth?type=producteur')}
              >
                S'inscrire comme producteur
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Acheteurs */}
          <Card id="acheteurs" className="border-0 shadow-soft hover:shadow-elevated transition-shadow rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-6 pt-10">
              <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mb-4 shadow-glow">
                <ShoppingCart className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl text-foreground">Espace Acheteur</CardTitle>
              <p className="text-muted-foreground">Trouvez les meilleurs produits directement chez les producteurs</p>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              <div className="space-y-4">
                {features.buyer.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">{title}</h4>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full rounded-xl bg-gradient-accent hover:opacity-90 text-accent-foreground shadow-soft"
                onClick={() => navigate('/auth?type=acheteur')}
              >
                S'inscrire comme acheteur
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
