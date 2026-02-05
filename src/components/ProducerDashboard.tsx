import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, BarChart3, Eye, MessageCircle, Edit, Trash2, User, Crown } from "lucide-react";
import { AddProductForm } from "./AddProductForm";
import { EditProductModal } from "./EditProductModal";
import { EditProfileModal } from "./EditProfileModal";
import { SubscriptionUpgrade } from "./SubscriptionUpgrade";
import { ContactRequestsList } from "./ContactRequestsList";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

export const ProducerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [subscription, setSubscription] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching products for user:', user.id);
      
      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }
      if (!profile) {
        console.warn('No profile found for user:', user.id);
        setProducts([]);
        setStats({ totalProducts: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 });
        return;
      }
      
      console.log('Profile found:', profile.id);
      setProfile(profile);

      // Get subscription
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      setSubscription(subscriptionData);
      
      // Fetch products
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('producteur_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Products fetch error:', error);
        throw error;
      }
      
      const products = productsData || [];
      console.log('Products found:', products.length);
      
      // Fetch WhatsApp clicks and views for each product
      const productIds = products.map(p => p.id);
      let clicksData: any[] = [];
      let viewsData: any[] = [];
      
      if (productIds.length > 0) {
        console.log('Fetching stats for products:', productIds);
        const [whatsappClicksResult, viewsResult] = await Promise.all([
          supabase
            .from('whatsapp_clicks')
            .select('product_id')
            .in('product_id', productIds),
          supabase
            .from('product_views')
            .select('product_id')
            .in('product_id', productIds)
        ]);
        
        if (whatsappClicksResult.error) {
          console.error('WhatsApp clicks fetch error:', whatsappClicksResult.error);
        } else {
          clicksData = whatsappClicksResult.data || [];
          console.log('WhatsApp clicks found:', clicksData.length);
        }
        
        if (viewsResult.error) {
          console.error('Views fetch error:', viewsResult.error);
        } else {
          viewsData = viewsResult.data || [];
          console.log('Views found:', viewsData.length);
        }
      }
      
      // Count clicks per product
      const clickCounts = clicksData.reduce((acc: Record<string, number>, click) => {
        acc[click.product_id] = (acc[click.product_id] || 0) + 1;
        return acc;
      }, {});
      
      // Count views per product
      const viewCounts = viewsData.reduce((acc: Record<string, number>, view) => {
        acc[view.product_id] = (acc[view.product_id] || 0) + 1;
        return acc;
      }, {});
      
      // Add click and view counts to products
      const productsWithStats = products.map(product => ({
        ...product,
        actualWhatsappClicks: clickCounts[product.id] || 0,
        actualViews: viewCounts[product.id] || 0
      }));
      
      setProducts(productsWithStats);
      
      // Calculate stats
      const totalProducts = products.length;
      const totalViews = (Object.values(viewCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0);
      const totalClicks = (Object.values(clickCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0);
      const conversionRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;
      
      console.log('Calculated stats:', { totalProducts, totalViews, totalClicks, conversionRate });
      
      setStats({
        totalProducts,
        totalViews,
        totalClicks,
        conversionRate
      });
      
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
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Le produit a été supprimé avec succès"
      });
      
      // Refresh the products list
      await fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le produit",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditProductModalOpen(true);
  };

  const handleProductUpdated = () => {
    fetchProducts();
  };

  const handleProfileUpdated = () => {
    // Optionally refresh any profile-related data
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  // Refresh stats when a WhatsApp click is recorded elsewhere
  useEffect(() => {
    const handler = () => fetchProducts();
    window.addEventListener('whatsapp:stats-refresh', handler);
    return () => window.removeEventListener('whatsapp:stats-refresh', handler);
  }, []);

  return (
    <div className="space-y-6">
      {/* Subscription restriction warning */}
      {profile?.subscription_required && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Crown className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">Abonnement requis</h4>
            <p className="text-sm text-amber-700">
              Vous êtes limité à 3 produits et ne pouvez pas modifier vos produits existants. 
              Souscrivez à un abonnement pour débloquer toutes les fonctionnalités.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setActiveTab("subscription")}
            >
              Voir les abonnements
            </Button>
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
              {profile?.subscription_required ? `Limite: 3 produits` : `Limite: Aucune`}
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
            <p className="text-[10px] sm:text-xs text-blue-600 truncate">
              Vues totales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-orange-200/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700 truncate">Clics WhatsApp</CardTitle>
            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-800">{stats.totalClicks}</div>
            <p className="text-[10px] sm:text-xs text-orange-600 truncate">
              Clics totaux
            </p>
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
            <p className="text-[10px] sm:text-xs text-purple-600 truncate">
              Taux de conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => {
        console.log('Tab changed to:', value);
        setActiveTab(value);
      }}>
        <TabsList className="flex w-full h-auto p-1 bg-gradient-to-r from-emerald-100 to-blue-100 gap-1 overflow-x-auto">
          <TabsTrigger value="overview" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white whitespace-nowrap">Aperçu</TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-pink-500 data-[state=active]:text-white whitespace-nowrap">Demandes</TabsTrigger>
          <TabsTrigger value="products" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap">Produits</TabsTrigger>
          <TabsTrigger value="add-product" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white whitespace-nowrap">Ajouter</TabsTrigger>
          <TabsTrigger value="subscription" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white whitespace-nowrap">Abonnement</TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 min-w-fit text-[10px] sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white whitespace-nowrap">Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <ContactRequestsList />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenue sur votre espace producteur</CardTitle>
              <CardDescription>
                Gérez vos produits et suivez vos performances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base">Commencez par ajouter votre premier produit</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Publiez vos produits pour les rendre visibles aux acheteurs
                  </p>
                </div>
                <Button onClick={() => setActiveTab("add-product")} className="w-full sm:w-auto whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Badge Vérifié</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Obtenez la badge "Producteur Vérifié" pour gagner la confiance des acheteurs
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    En attente de vérification
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Abonnement</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Plan Gratuit - Fonctionnalités de base
                  </p>
                  <Button variant="accent" size="sm">
                    Voir les plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mes Produits</CardTitle>
              <CardDescription>
                Gérez vos produits publiés
              </CardDescription>
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
                    Vous n'avez pas encore de produits. Commencez par en ajouter un !
                  </p>
                  <Button onClick={() => setActiveTab("add-product")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter votre premier produit
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.nom}
                            className="w-full sm:w-16 sm:h-16 h-32 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{product.nom}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {product.prix} FCFA • {product.quantite}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {product.localisation}
                          </p>
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
                        <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 sm:flex-none"
                            disabled={profile?.subscription_required}
                            title={profile?.subscription_required ? "Modification désactivée - Abonnement requis" : "Modifier le produit"}
                          >
                            <Edit className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">{profile?.subscription_required ? "Bloqué" : "Modifier"}</span>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                            className="flex-1 sm:flex-none"
                            disabled={profile?.subscription_required}
                            title={profile?.subscription_required ? "Suppression désactivée - Abonnement requis" : "Supprimer le produit"}
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
          <AddProductForm onProductAdded={handleProductAdded} />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-accent rounded-full flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                Mon abonnement
                {subscription && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    subscription.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                    subscription.plan === 'pro' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.plan === 'premium' ? 'Premium' : 
                     subscription.plan === 'pro' ? 'Pro' : 'Gratuit'}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Gérez votre abonnement et débloquez plus de fonctionnalités
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile && (
                <SubscriptionUpgrade 
                  userEmail={user?.email || ''} 
                  profileId={profile.id}
                  currentPlan={subscription?.plan || 'gratuit'}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mon Profil</CardTitle>
              <CardDescription>
                Gérez vos informations personnelles
              </CardDescription>
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

      {/* Modals */}
      <EditProductModal
        product={editingProduct}
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        onProductUpdated={handleProductUpdated}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};