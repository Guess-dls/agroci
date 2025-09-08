import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Heart, History, Filter, ShoppingCart } from "lucide-react";

export const BuyerDashboard = () => {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoris</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Producteurs sauvegardés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recherches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Producteurs contactés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnement</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gratuit</div>
            <p className="text-xs text-muted-foreground">
              Plan Découverte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Rechercher</TabsTrigger>
          <TabsTrigger value="favorites">Favoris</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rechercher des produits</CardTitle>
              <CardDescription>
                Trouvez les meilleurs produits directement chez les producteurs vérifiés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input 
                    placeholder="Rechercher un produit (maïs, riz, manioc...)" 
                    className="w-full"
                  />
                </div>
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Rechercher
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col">
                  <div className="text-2xl mb-2">🌽</div>
                  <span>Maïs</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col">
                  <div className="text-2xl mb-2">🍚</div>
                  <span>Riz</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col">
                  <div className="text-2xl mb-2">🍠</div>
                  <span>Manioc</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col">
                  <div className="text-2xl mb-2">🥔</div>
                  <span>Igname</span>
                </Button>
              </div>

              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Commencez votre recherche</h3>
                <p className="text-muted-foreground">
                  Utilisez les filtres ci-dessus pour trouver les produits qui vous intéressent
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes Favoris</CardTitle>
              <CardDescription>
                Producteurs et produits que vous avez sauvegardés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
                <p className="text-muted-foreground mb-4">
                  Ajoutez des producteurs à vos favoris pour les retrouver facilement
                </p>
                <Button onClick={() => setActiveTab("search")}>
                  <Search className="mr-2 h-4 w-4" />
                  Rechercher des produits
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des recherches</CardTitle>
              <CardDescription>
                Vos recherches et contacts récents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
                <p className="text-muted-foreground mb-4">
                  Votre historique de recherches apparaîtra ici
                </p>
                <Button onClick={() => setActiveTab("search")}>
                  <Search className="mr-2 h-4 w-4" />
                  Commencer une recherche
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mon Profil Acheteur</CardTitle>
              <CardDescription>
                Gérez vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Informations personnelles</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Nom, prénom, pays, région, type d'activité
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Modifier le profil (bientôt)
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Abonnement Business</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Accès illimité aux producteurs vérifiés
                  </p>
                  <Button variant="accent" size="sm">
                    Voir les plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};