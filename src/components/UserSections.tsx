import { ArrowRight, Leaf, ShoppingCart, CheckCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const UserSections = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Rejoignez Notre Communauté
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Que vous soyez producteur ou acheteur, notre plateforme vous connecte 
            directement pour des transactions transparentes et efficaces.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Section Producteurs */}
          <Card id="producteurs" className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <Leaf className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl text-foreground">Espace Producteur</CardTitle>
              <p className="text-muted-foreground">
                Vendez vos produits directement aux acheteurs professionnels
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Inscription simple</h4>
                    <p className="text-sm text-muted-foreground">Créez votre profil en quelques minutes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Badge "Vérifié"</h4>
                    <p className="text-sm text-muted-foreground">Gagnez la confiance des acheteurs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Contact WhatsApp</h4>
                    <p className="text-sm text-muted-foreground">Communication directe et rapide</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Statistiques</h4>
                    <p className="text-sm text-muted-foreground">Suivez vos vues et contacts</p>
                  </div>
                </div>
              </div>
              
              <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">
                S'inscrire comme producteur
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Section Acheteurs */}
          <Card id="acheteurs" className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl text-foreground">Espace Acheteur</CardTitle>
              <p className="text-muted-foreground">
                Trouvez les meilleurs produits directement chez les producteurs
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Recherche avancée</h4>
                    <p className="text-sm text-muted-foreground">Filtres par produit, prix, localisation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Producteurs vérifiés</h4>
                    <p className="text-sm text-muted-foreground">Qualité et traçabilité garanties</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Favoris & Historique</h4>
                    <p className="text-sm text-muted-foreground">Retrouvez vos producteurs préférés</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Contact direct</h4>
                    <p className="text-sm text-muted-foreground">Négociation via WhatsApp</p>
                  </div>
                </div>
              </div>
              
              <Button variant="accent" className="w-full">
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