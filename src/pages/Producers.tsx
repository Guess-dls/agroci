import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Badge } from "lucide-react";
import { useState } from "react";
import SEOHead from "@/components/SEOHead";

const Producers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      console.log("Recherche pour:", searchTerm);
    }
  };

  const handleRegionFilter = () => {
    console.log("Filtrage par région");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Producteurs agricoles vérifiés"
        description="Trouvez des producteurs agricoles vérifiés en Côte d'Ivoire. Maïs, riz, manioc, igname et autres produits vivriers. Contact direct via WhatsApp."
        keywords="producteurs agricoles, agriculteurs Côte d'Ivoire, producteurs vérifiés, maïs, riz, manioc, igname, WhatsApp"
        canonicalUrl="https://agroci.lovable.app/producers"
      />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Nos Producteurs Agricoles
          </h1>
          <p className="text-muted-foreground">
            Trouvez des producteurs vérifiés près de chez vous pour vos achats de produits vivriers en gros
          </p>
        </header>

        <section aria-label="Recherche de producteurs" className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input 
              placeholder="Rechercher un producteur ou une région..." 
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              aria-label="Rechercher un producteur agricole"
            />
          </div>
          <Button onClick={handleSearch} aria-label="Lancer la recherche">
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Rechercher
          </Button>
          <Button variant="outline" onClick={handleRegionFilter} aria-label="Filtrer par région">
            <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
            Par région
          </Button>
        </section>

        <section aria-label="Liste des producteurs vérifiés">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Badge className="mr-2 h-5 w-5" aria-hidden="true" />
                <span>Producteurs Vérifiés</span>
              </CardTitle>
              <CardDescription>
                Tous nos producteurs sont vérifiés pour garantir la qualité des produits agricoles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Les profils des producteurs vérifiés apparaîtront ici.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Producers;
