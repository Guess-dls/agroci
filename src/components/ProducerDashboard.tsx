import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, BarChart3, Eye, MessageCircle, Edit, Trash2, User, Crown, Rocket, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddProductForm } from "./AddProductForm";
import { EditProductModal } from "./EditProductModal";
import { EditProfileModal } from "./EditProfileModal";
import { SubscriptionUpgrade } from "./SubscriptionUpgrade";
import { ContactRequestsList } from "./ContactRequestsList";
import { ConversationsList } from "./ConversationsList";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Product {
  id: string;
  nom: string;
  prix: number;
  quantite: string;
  description: string;
  localisation: string;
  image_url: string;
  status: string;
  created_at: string;
  views_count: number;
  whatsapp_clicks: number;
  actualWhatsappClicks?: number;
  actualViews?: number;
  is_boosted?: boolean;
  boost_end_date?: string;
}

export const ProducerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [boostLoading, setBoostLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    totalClicks: 0,
    conversionRate: 0
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!profileData) {
        setProducts([]);
        setStats({ totalProducts: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 });
        return;
      }
      
      setProfile(profileData);
      
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('producteur_id', profileData.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const products = productsData || [];
      const productIds = products.map(p => p.id);
      
      let clicksData: any[] = [];
      let viewsData: any[] = [];
      let boostsData: any[] = [];
      
      if (productIds.length > 0) {
        const [whatsappClicksResult, viewsResult, boostsResult] = await Promise.all([
          supabase.from('whatsapp_clicks').select('product_id').in('product_id', productIds),
          supabase.from('product_views').select('product_id').in('product_id', productIds),
          supabase.from('product_boosts').select('product_id, end_date').eq('status', 'active').gt('end_date', new Date().toISOString()).in('product_id', productIds)
        ]);
        
        clicksData = whatsappClicksResult.data || [];
        viewsData = viewsResult.data || [];
        boostsData = boostsResult.data || [];
      }
      
      const clickCounts = clicksData.reduce((acc: Record<string, number>, click) => {
        acc[click.product_id] = (acc[click.product_id] || 0) + 1;
        return acc;
      }, {});
      
      const viewCounts = viewsData.reduce((acc: Record<string, number>, view) => {
        acc[view.product_id] = (acc[view.product_id] || 0) + 1;
        return acc;
      }, {});

      const boostMap = boostsData.reduce((acc: Record<string, string>, b) => {
        acc[b.product_id] = b.end_date;
        return acc;
      }, {});
      
      const productsWithStats = products.map(product => ({
        ...product,
        actualWhatsappClicks: clickCounts[product.id] || 0,
        actualViews: viewCounts[product.id] || 0,
        is_boosted: !!boostMap[product.id],
        boost_end_date: boostMap[product.id] || undefined
      }));
      
      setProducts(productsWithStats);
      
      const totalProducts = products.length;
      const totalViews = (Object.values(viewCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0);
      const totalClicks = (Object.values(clickCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0);
      const conversionRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;
      
      setStats({ totalProducts, totalViews, totalClicks, conversionRate });
      
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger vos produits",
        variant: "destructive"
      });
      setProducts([]);
      setStats({ totalProducts: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleProductAdded = () => {
    setActiveTab("products");
    fetchProducts();
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast({ title: "Succès", description: "Le produit a été supprimé avec succès" });
      await fetchProducts();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de supprimer le produit", variant: "destructive" });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditProductModalOpen(true);
  };

  const handleBoostProduct = async (productId: string) => {
    if (!profile) return;
    setBoostLoading(productId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-paystack-payment', {
        body: {
          type: 'boost',
          email: user?.email,
          profileId: profile.id,
          productId: productId
        }
      });

      if (error) throw error;

      if (data.authorization_url) {
        window.open(data.authorization_url, '_blank');
        toast({
          title: "Redirection vers le paiement",
          description: "Payez 1 200 FCFA pour booster ce produit pendant 1 semaine.",
        });
      }
    } catch (error) {
      console.error('Error creating boost payment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le paiement pour le boost.",
        variant: "destructive",
      });
    } finally {
      setBoostLoading(null);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  useEffect(() => {
    const handler = () => fetchProducts();
    window.addEventListener('whatsapp:stats-refresh', handler);
    return () => window.removeEventListener('whatsapp:stats-refresh', handler);
  }, []);

  const isSubscriptionActive = profile?.subscription_active && profile?.subscription_end_date && new Date(profile.subscription_end_date) > new Date();
  const isSubscriptionRequired = profile?.subscription_required !== false;
  const canPublish = !isSubscriptionRequired || isSubscriptionActive;

  return (
    <div className="space-y-6">
      {/* Subscription warning */}
      {isSubscriptionRequired && !isSubscriptionActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Crown className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">Abonnement requis</h4>
            <p className="text-sm text-amber-700">
              Vous devez souscrire un abonnement mensuel (3 000 FCFA/mois) pour publier vos produits et les rendre visibles aux acheteurs.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setActiveTab("subscription")}
            >
              S'abonner maintenant
            </Button>
          </div>
        </div>
      )}

      {/* Subscription active indicator */}
      {isSubscriptionActive && profile?.subscription_end_date && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <Crown className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium text-green-800">Abonnement actif</span>
            <span className="text-xs text-green-600 ml-2">
              Expire le {format(new Date(profile.subscription_end_date), 'dd MMMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-emerald-200/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700 truncate">Produits publiés</CardTitle>
            <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-800">{stats.totalProducts}</div>
            <p className="text-[10px] sm:text-xs text-emerald-600 truncate">
              {canPublish ? 'Publication illimitée' : 'Abonnement requis'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 truncate">Total des vues</CardTitle>
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-800">{stats.totalViews}</div>
            <p className="text-[10px] sm:text-xs text-blue-600 truncate">Vues totales</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-orange-200/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 truncate">Contacts reçus</CardTitle>
            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-800">{stats.totalClicks}</div>
            <p className="text-[10px] sm:text-xs text-orange-600 truncate">Demandes totales</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-purple-200/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700 truncate">Taux de conversion</CardTitle>
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-800">{stats.conversionRate}%</div>
            <p className="text-[10px] sm:text-xs text-purple-600 truncate">Taux de conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full h-auto p-1 bg-gradient-to-r from-emerald-100 to-blue-100 gap-1 overflow-x-auto">
          <TabsTrigger value="overview" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap">Aperçu</TabsTrigger>
          <TabsTrigger value="messages" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap">💬 Messages</TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-pink-500 data-[state=active]:text-white whitespace-nowrap">Demandes</TabsTrigger>
          <TabsTrigger value="products" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap">Produits</TabsTrigger>
          <TabsTrigger value="add-product" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white whitespace-nowrap">Ajouter</TabsTrigger>
          <TabsTrigger value="subscription" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white whitespace-nowrap">Abonnement</TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white whitespace-nowrap">Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <ConversationsList userType="producteur" />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <ContactRequestsList />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenue sur votre espace producteur</CardTitle>
              <CardDescription>Gérez vos produits et suivez vos performances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canPublish ? (
                <div className="p-4 border-2 border-amber-300 rounded-lg bg-amber-50">
                  <h3 className="font-semibold text-amber-800 mb-2">⚠️ Abonnement requis</h3>
                  <p className="text-sm text-amber-700 mb-3">
                    Pour publier et rendre vos produits visibles, vous devez souscrire un abonnement mensuel à <strong>3 000 FCFA/mois</strong>.
                  </p>
                  <Button onClick={() => setActiveTab("subscription")} className="bg-amber-600 hover:bg-amber-700">
                    S'abonner maintenant
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">Ajouter un nouveau produit</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Publiez vos produits pour les rendre visibles aux acheteurs
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab("add-product")} className="w-full sm:w-auto whitespace-nowrap">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              )}
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-amber-500" />
                  Boost de produit
                </h4>
                <p className="text-sm text-muted-foreground mb-1">
                  Boostez vos produits pour <strong>1 200 FCFA/semaine</strong> et apparaissez en priorité
                </p>
                <p className="text-xs text-muted-foreground">
                  Gérez les boosts depuis l'onglet "Produits"
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes Produits</CardTitle>
              <CardDescription>Gérez vos produits publiés et boostez-les</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                  <p>Chargement de vos produits...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit publié</h3>
                  <p className="text-muted-foreground mb-4">
                    {canPublish ? "Commencez par ajouter votre premier produit !" : "Abonnez-vous pour publier des produits."}
                  </p>
                  {canPublish && (
                    <Button onClick={() => setActiveTab("add-product")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter votre premier produit
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className={`border rounded-lg p-3 sm:p-4 ${product.is_boosted ? 'ring-2 ring-amber-400 bg-amber-50/30' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.nom}
                            className="w-full sm:w-16 sm:h-16 h-32 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm sm:text-base truncate">{product.nom}</h4>
                            {product.is_boosted && (
                              <Badge className="bg-amber-500 text-white text-xs gap-1">
                                <Rocket className="w-3 h-3" />
                                Boosté
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {product.prix} FCFA • {product.quantite}
                          </p>
                          {product.is_boosted && product.boost_end_date && (
                            <p className="text-xs text-amber-600">
                              Boost expire le {format(new Date(product.boost_end_date), 'dd/MM/yyyy', { locale: fr })}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              product.status === 'approuve' ? 'bg-green-100 text-green-800' :
                              product.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.status === 'approuve' ? 'Approuvé' :
                               product.status === 'en_attente' ? 'En attente' : 'Rejeté'}
                            </span>
                            <span className="text-xs text-muted-foreground">{product.actualViews || 0} vues</span>
                            <span className="text-xs text-muted-foreground">{product.actualWhatsappClicks || 0} clics</span>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBoostProduct(product.id)}
                            disabled={boostLoading === product.id || !canPublish}
                            className="flex-1 sm:flex-none text-amber-600 border-amber-300 hover:bg-amber-50"
                            title={!canPublish ? "Abonnement requis" : product.is_boosted ? "Prolonger le boost (+7 jours)" : "Booster ce produit (1 200 FCFA)"}
                          >
                            {boostLoading === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Rocket className="h-4 w-4 sm:mr-0 mr-2" />
                            )}
                            <span className="sm:hidden">{product.is_boosted ? 'Prolonger' : 'Booster'}</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 sm:flex-none"
                            disabled={!canPublish}
                          >
                            <Edit className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Modifier</span>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                            className="flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Supprimer</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-product" className="space-y-6">
          {canPublish ? (
            <AddProductForm onProductAdded={handleProductAdded} />
          ) : (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Crown className="h-5 w-5" />
                  Abonnement requis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 mb-4">
                  Vous devez avoir un abonnement actif pour publier de nouveaux produits.
                </p>
                <Button onClick={() => setActiveTab("subscription")} className="bg-amber-600 hover:bg-amber-700">
                  S'abonner (3 000 FCFA/mois)
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                Mon abonnement
              </CardTitle>
              <CardDescription>
                Gérez votre abonnement et boostez vos produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile && (
                <SubscriptionUpgrade 
                  userEmail={user?.email || ''} 
                  profileId={profile.id}
                  subscriptionActive={profile.subscription_active || false}
                  subscriptionEndDate={profile.subscription_end_date || null}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mon Profil</CardTitle>
              <CardDescription>Gérez vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Modifier mes informations</h3>
                  <p className="text-sm text-muted-foreground">
                    Mettez à jour vos informations de contact et professionnelles
                  </p>
                </div>
                <Button onClick={() => setIsEditProfileModalOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Modifier le profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditProductModal
        product={editingProduct}
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        onProductUpdated={fetchProducts}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onProfileUpdated={() => {}}
      />
    </div>
  );
};
