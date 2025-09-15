import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, BarChart3, Eye, MessageCircle, Edit, Trash2, User } from "lucide-react";
import { AddProductForm } from "./AddProductForm";
import { EditProductModal } from "./EditProductModal";
import { EditProfileModal } from "./EditProfileModal";
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
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!profile) {
        console.warn('No profile found for user');
        setProducts([]);
        setStats({ totalProducts: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 });
        return;
      }
      
      // Fetch products
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('producteur_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const products = productsData || [];
      
      // Fetch WhatsApp clicks and views for each product
      const productIds = products.map(p => p.id);
      let clicksData: any[] = [];
      let viewsData: any[] = [];
      
      if (productIds.length > 0) {
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
        
        clicksData = whatsappClicksResult.data || [];
        viewsData = viewsResult.data || [];
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

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits publiés</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Total publié
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des vues</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Vues totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics WhatsApp</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Clics totaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Taux de conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="products">Mes Produits</TabsTrigger>
          <TabsTrigger value="add-product">Ajouter Produit</TabsTrigger>
          <TabsTrigger value="profile">Mon Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenue sur votre espace producteur</CardTitle>
              <CardDescription>
                Gérez vos produits et suivez vos performances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Commencez par ajouter votre premier produit</h3>
                  <p className="text-sm text-muted-foreground">
                    Publiez vos produits pour les rendre visibles aux acheteurs
                  </p>
                </div>
                <Button onClick={() => setActiveTab("add-product")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div key={product.id} className="border rounded-lg p-4 flex items-center space-x-4">
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.nom}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.nom}</h4>
                        <p className="text-sm text-muted-foreground">
                          {product.prix} FCFA • {product.quantite}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.localisation}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.status === 'approuve' ? 'bg-green-100 text-green-800' :
                            product.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.status === 'approuve' ? 'Approuvé' :
                             product.status === 'en_attente' ? 'En attente' : 'Rejeté'}
                          </span>
                           <span>{product.actualViews || 0} vues</span>
                           <span>{product.actualWhatsappClicks || 0} clics</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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