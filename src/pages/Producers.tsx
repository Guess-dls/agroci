import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Badge } from "lucide-react";
import { useState } from "react";

const Producers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // TODO: Implémenter la logique de recherche
      console.log("Recherche pour:", searchTerm);
    }
  };

  const handleRegionFilter = () => {
    // TODO: Implémenter le filtre par région
    console.log("Filtrage par région");
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Nos Producteurs
          </h1>
          <p className="text-muted-foreground">
            Trouvez des producteurs vérifiés près de chez vous
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input 
              placeholder="Rechercher un producteur ou une région..." 
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" />
            Rechercher
          </Button>
          <Button variant="outline" onClick={handleRegionFilter}>
            <MapPin className="mr-2 h-4 w-4" />
            Par région
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Badge className="mr-2 h-5 w-5" />
              Producteurs Vérifiés
            </CardTitle>
            <CardDescription>
              Tous nos producteurs sont vérifiés pour garantir la qualité
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
      </main>
      <Footer />
    </div>
  );
};

export default Producers;