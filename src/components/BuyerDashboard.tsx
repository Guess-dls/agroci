import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Heart, History, Filter, ShoppingCart, MapPin, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Product {
  id: string;
  nom: string;
  description: string;
  prix: number;
  quantite: string;
  localisation: string;
  image_url?: string;
  producteur_id: string;
  profiles?: {
    nom: string;
    prenom: string;
    whatsapp: string;
  };
}

export const BuyerDashboard = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm) return;
    
    setIsSearching(true);
    console.log('Recherche pour:', searchTerm);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:producteur_id (
            nom,
            prenom,
            whatsapp
          )
        `)
        .eq('status', 'approuve')
        .ilike('nom', `%${searchTerm}%`);

      if (error) {
        toast.error("Erreur lors de la recherche");
        console.error('Erreur recherche:', error);
        return;
      }

      console.log('Résultats trouvés:', data);
      console.log('Premier produit:', data?.[0]);
      if (data?.[0]) {
        console.log('Profiles du premier produit:', data[0].profiles);
        console.log('WhatsApp du premier produit:', data[0].profiles?.whatsapp);
      }
      setSearchResults(data || []);
      toast.success(`${data?.length || 0} produit(s) trouvé(s)`);
    } catch (error) {
      toast.error("Erreur lors de la recherche");
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductClick = (productName: string) => {
    setSearchQuery(productName);
    handleSearch(productName); // Passer directement le terme de recherche
  };

  const handleWhatsAppClick = async (product: any) => {
    try {
      // Enregistrer le clic pour les statistiques
      await supabase
        .from('whatsapp_clicks')
        .insert({
          product_id: product.id,
          clicker_id: user?.id
        });

      // Incrémenter le compteur de clics WhatsApp
      await supabase
        .from('products')
        .update({ whatsapp_clicks: (product.whatsapp_clicks || 0) + 1 })
        .eq('id', product.id);

      // Ouvrir WhatsApp
      const phoneNumber = product.profiles?.whatsapp?.replace(/\s+/g, '');
      const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre produit: ${product.nom} (${product.prix} FCFA)`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
      
      toast.success("Redirection vers WhatsApp...");
    } catch (error) {
      console.error('Erreur lors du clic WhatsApp:', error);
      // Ouvrir WhatsApp même si l'enregistrement échoue
      const phoneNumber = product.profiles?.whatsapp?.replace(/\s+/g, '');
      const message = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre produit: ${product.nom}`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    }
  };

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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Rechercher un produit (maïs, riz, manioc...)" 
                    className="w-full"
                  />
                </div>
                <Button onClick={() => handleSearch()} disabled={isSearching}>
                  <Search className="mr-2 h-4 w-4" />
                  {isSearching ? "Recherche..." : "Rechercher"}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col"
                  onClick={() => handleProductClick('Maïs')}
                >
                  <div className="text-2xl mb-2">🌽</div>
                  <span>Maïs</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col"
                  onClick={() => handleProductClick('Riz')}
                >
                  <div className="text-2xl mb-2">🍚</div>
                  <span>Riz</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col"
                  onClick={() => handleProductClick('Manioc')}
                >
                  <div className="text-2xl mb-2">🍠</div>
                  <span>Manioc</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col"
                  onClick={() => handleProductClick('Igname')}
                >
                  <div className="text-2xl mb-2">🥔</div>
                  <span>Igname</span>
                </Button>
              </div>

              {/* Résultats de recherche */}
              {searchResults.length > 0 ? (
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Résultats de recherche ({searchResults.length})</h3>
                  {searchResults.map((product) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex gap-4">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.nom}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">{product.nom}</h4>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">{product.prix} FCFA</div>
                              <div className="text-sm text-muted-foreground">{product.quantite}</div>
                            </div>
                          </div>
                          
                          {product.description && (
                            <p className="text-muted-foreground mb-3">{product.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 mb-3">
                            {product.localisation && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {product.localisation}
                              </div>
                            )}
                            
                            {product.profiles && (
                              <div className="text-sm text-muted-foreground">
                                Par {product.profiles.prenom} {product.profiles.nom}
                              </div>
                            )}
                          </div>
                          
                          {/* Bouton WhatsApp - toujours affiché avec une logique de fallback */}
                          <div className="flex gap-2">
                            {product.profiles?.whatsapp ? (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleWhatsAppClick(product)}
                              >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Contacter sur WhatsApp
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                disabled
                              >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                WhatsApp non disponible
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun résultat trouvé</h3>
                  <p className="text-muted-foreground">
                    Essayez avec d'autres mots-clés
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Commencez votre recherche</h3>
                  <p className="text-muted-foreground">
                    Utilisez les filtres ci-dessus pour trouver les produits qui vous intéressent
                  </p>
                </div>
              )}
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