import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const Buyers = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Espace Acheteurs - Achats de produits vivriers en gros"
        description="Achetez des produits vivriers en gros directement auprès de producteurs vérifiés. Maïs, riz, manioc, igname. Contact WhatsApp, transactions sécurisées."
        keywords="acheteurs produits vivriers, achats en gros, grossistes, maïs, riz, manioc, igname, Côte d'Ivoire"
        canonicalUrl="https://agroci.lovable.app/buyers"
      />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Espace Acheteurs de Produits Vivriers
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous directement avec les producteurs agricoles pour vos achats en gros
          </p>
        </header>

        <section aria-label="Statistiques de la plateforme" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Producteurs Actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">150+</div>
              <p className="text-xs text-muted-foreground">
                Producteurs agricoles vérifiés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Disponibles</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">500+</div>
              <p className="text-xs text-muted-foreground">
                Produits vivriers en stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1200+</div>
              <p className="text-xs text-muted-foreground">
                Mises en relation ce mois-ci
              </p>
            </CardContent>
          </Card>
        </section>

        <section aria-label="Inscription acheteur">
          <Card>
            <CardHeader>
              <CardTitle>Commencez vos achats de produits vivriers</CardTitle>
              <CardDescription>
                Créez votre compte acheteur pour accéder à notre réseau de producteurs agricoles vérifiés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => navigate('/auth')} size="lg" aria-label="Créer un compte acheteur gratuit">
                  Créer un compte acheteur
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')} size="lg" aria-label="Accéder à mon espace personnel">
                  Accéder à mon espace
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Buyers;
