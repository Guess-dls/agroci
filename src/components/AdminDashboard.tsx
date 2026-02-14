import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Eye, Shield, TrendingUp, Users, Package, Clock, UserMinus, EyeOff, Trash2, Ban, UserCheck, Filter, Settings, CreditCard, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  nom: string;
  prix: number;
  quantite: string;
  description: string;
  localisation: string;
  image_url: string;
  status: 'en_attente' | 'approuve' | 'rejete';
  hidden: boolean;
  created_at: string;
  producteur: {
    nom: string;
    prenom: string;
    whatsapp: string;
    pays: string;
    region: string;
  };
}

interface User {
  id: string;
  nom: string;
  prenom: string;
  pays: string;
  region: string;
  whatsapp: string;
  user_type: 'producteur' | 'acheteur' | 'admin';
  verified: boolean;
  suspended: boolean;
  subscription_required: boolean;
  created_at: string;
}

interface AdminStats {
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalProducers: number;
  totalBuyers: number;
}

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0,
    totalProducers: 0,
    totalBuyers: 0
  });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingAllProducts, setLoadingAllProducts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [productFilter, setProductFilter] = useState<'all' | 'approuve' | 'rejete' | 'en_attente'>('all');
  const [subscriptionRestrictionsEnabled, setSubscriptionRestrictionsEnabled] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetchPendingProducts();
    fetchStats();
    fetchSystemSettings();
    if (activeTab === 'users') {
      fetchAllUsers();
    }
    if (activeTab === 'products') {
      fetchAllProducts();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      // Fetch product stats
      const { data: productStats, error: productStatsError } = await supabase
        .from('products')
        .select('status');

      if (productStatsError) throw productStatsError;

      // Fetch user stats
      const { data: userStats, error: userStatsError } = await supabase
        .from('profiles')
        .select('user_type');

      if (userStatsError) throw userStatsError;

      const totalProducts = productStats?.length || 0;
      const pendingProducts = productStats?.filter(p => p.status === 'en_attente').length || 0;
      const approvedProducts = productStats?.filter(p => p.status === 'approuve').length || 0;
      const rejectedProducts = productStats?.filter(p => p.status === 'rejete').length || 0;
      const totalProducers = userStats?.filter(u => u.user_type === 'producteur').length || 0;
      const totalBuyers = userStats?.filter(u => u.user_type === 'acheteur').length || 0;

      setStats({
        totalProducts,
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        totalProducers,
        totalBuyers
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPendingProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          nom,
          prix,
          quantite,
          description,
          localisation,
          image_url,
          status,
          created_at,
          profiles!products_producteur_id_fkey (
            nom,
            prenom,
            whatsapp,
            pays,
            region
          )
        `)
        .eq('status', 'en_attente')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const formattedProducts = data.map((product: any) => ({
        ...product,
        producteur: product.profiles,
        hidden: product.hidden || false
      }));

      setProducts(formattedProducts);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits en attente",
        variant: "destructive"
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const updateProductStatus = async (productId: string, status: 'approuve' | 'rejete') => {
    setUpdatingProduct(productId);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ status })
        .eq('id', productId);

      if (error) {
        throw error;
      }

      toast({
        title: status === 'approuve' ? "Produit approuvé" : "Produit refusé",
        description: `Le produit a été ${status === 'approuve' ? 'approuvé' : 'refusé'} avec succès`,
      });

      // Remove the product from the list and update stats
      setProducts(prev => prev.filter(p => p.id !== productId));
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive"
      });
    } finally {
      setUpdatingProduct(null);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'subscription_restrictions_enabled')
        .single();

      if (error) throw error;

      setSubscriptionRestrictionsEnabled(data.setting_value);
    } catch (error: any) {
      console.error('Error fetching system settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoadingAllProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          nom,
          prix,
          quantite,
          description,
          localisation,
          image_url,
          status,
          hidden,
          created_at,
          profiles!products_producteur_id_fkey (
            nom,
            prenom,
            whatsapp,
            pays,
            region
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts = data.map(product => ({
        ...product,
        producteur: product.profiles
      }));

      setAllProducts(formattedProducts);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger tous les produits",
        variant: "destructive"
      });
    } finally {
      setLoadingAllProducts(false);
    }
  };

  const toggleUserSuspension = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const { data, error } = await supabase.rpc('toggle_user_suspension', {
        profile_id: userId
      });

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: data,
      });

      fetchAllUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const { data, error } = await supabase.rpc('delete_user_account', {
        profile_id: userId
      });

      if (error) throw error;

      toast({
        title: "Utilisateur supprimé",
        description: data,
      });

      fetchAllUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const toggleProductVisibility = async (productId: string) => {
    setUpdatingProduct(productId);
    try {
      const { data, error } = await supabase.rpc('toggle_product_visibility', {
        product_id: productId
      });

      if (error) throw error;

      toast({
        title: "Visibilité mise à jour",
        description: data,
      });

      fetchAllProducts();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la visibilité",
        variant: "destructive"
      });
    } finally {
      setUpdatingProduct(null);
    }
  };

  const deleteProduct = async (productId: string) => {
    setUpdatingProduct(productId);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé définitivement",
      });

      fetchAllProducts();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive"
      });
    } finally {
      setUpdatingProduct(null);
    }
  };

  const verifyProducer = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const { data, error } = await supabase.rpc('verify_producer', {
        profile_id: userId
      });

      if (error) throw error;

      toast({
        title: "Producteur vérifié",
        description: data,
      });

      fetchAllUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le producteur",
        variant: "destructive"
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const navigateToTab = (tab: string, filter?: string) => {
    setActiveTab(tab);
    if (filter && tab === 'products') {
      setProductFilter(filter as 'all' | 'approuve' | 'rejete' | 'en_attente');
    }
  };

  const toggleSubscriptionRestrictions = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: !subscriptionRestrictionsEnabled })
        .eq('setting_key', 'subscription_restrictions_enabled');

      if (error) throw error;

      setSubscriptionRestrictionsEnabled(!subscriptionRestrictionsEnabled);
      toast({
        title: "Paramètres mis à jour",
        description: `Restrictions d'abonnement ${!subscriptionRestrictionsEnabled ? 'activées' : 'désactivées'}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive"
      });
    }
  };

  const toggleUserSubscriptionRequirement = async (userId: string) => {
    setUpdatingUser(userId);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_required: !user.subscription_required })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Paramètre utilisateur mis à jour",
        description: `Obligation d'abonnement ${!user.subscription_required ? 'activée' : 'désactivée'} pour ${user.prenom} ${user.nom}`,
      });

      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre utilisateur",
        variant: "destructive"
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredProducts = allProducts.filter(product => {
    if (productFilter === 'all') return true;
    return product.status === productFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="space-y-4 md:space-y-6">
        {/* Header Section with Gradient */}
        <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 border border-primary/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Shield className="h-8 w-8 md:h-10 md:w-10 text-primary flex-shrink-0" />
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Administration
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">Gestion de la plateforme AgroConnect</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              {/* Report Link */}
              <Link to="/admin/report">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs md:text-sm bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200 hover:from-purple-500/20 hover:to-blue-500/20"
                >
                  <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Rapport Traction
                </Button>
              </Link>

              {/* Global Subscription Settings */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  <span className="text-xs md:text-sm text-muted-foreground">Restrictions (30 jours/mois après achat):</span>
                </div>
                <Button
                  onClick={toggleSubscriptionRestrictions}
                  variant={subscriptionRestrictionsEnabled ? "default" : "outline"}
                  size="sm"
                  className={subscriptionRestrictionsEnabled 
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-xs md:text-sm" 
                    : "text-xs md:text-sm"}
                  disabled={loadingSettings}
                >
                  {loadingSettings ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : subscriptionRestrictionsEnabled ? (
                    <>
                      <Check className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Activées
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Désactivées
                    </>
                  )}
                </Button>
                <span className="text-[10px] text-muted-foreground">La restriction se restaure 30 jours après l'achat d'un abonnement</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-orange-200/50"
            onClick={() => navigateToTab('validation')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-orange-800">Produits en attente</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold text-orange-900">{stats.pendingProducts}</div>
              <p className="text-[10px] md:text-xs text-orange-600">Cliquez pour valider</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50"
            onClick={() => navigateToTab('products', 'all')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-blue-800">Total Produits</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold text-blue-900">{stats.totalProducts}</div>
              <p className="text-[10px] md:text-xs text-blue-600">
                {stats.approvedProducts} approuvés, {stats.rejectedProducts} refusés
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-purple-200/50 sm:col-span-2 lg:col-span-1"
            onClick={() => navigateToTab('users')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-purple-800">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold text-purple-900">{stats.totalProducers + stats.totalBuyers}</div>
              <p className="text-[10px] md:text-xs text-purple-600">
                {stats.totalProducers} producteurs, {stats.totalBuyers} acheteurs
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="validation" className="text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2 flex items-center gap-1">
            <span className="hidden sm:inline">Validation</span>
            <span className="sm:hidden">Valid.</span>
            {stats.pendingProducts > 0 && (
              <Badge variant="destructive" className="text-[8px] px-1 py-0 md:text-xs md:px-2">
                {stats.pendingProducts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2">Utilisateurs</TabsTrigger>
          <TabsTrigger value="products" className="text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-2">
            <span className="hidden sm:inline">Tous les produits</span>
            <span className="sm:hidden">Produits</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                Résumé de l'activité sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Produits en attente de validation</p>
                      <p className="text-sm text-muted-foreground">Nécessitent votre attention</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{stats.pendingProducts}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Produits approuvés</p>
                      <p className="text-sm text-muted-foreground">Visibles sur la plateforme</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{stats.approvedProducts}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Utilisateurs actifs</p>
                      <p className="text-sm text-muted-foreground">Producteurs et acheteurs</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{stats.totalProducers + stats.totalBuyers}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Produits en attente d'approbation
                <Badge variant="secondary">{products.length} produit(s)</Badge>
              </CardTitle>
              <CardDescription>
                Examinez et approuvez ou refusez les nouveaux produits soumis par les producteurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Chargement des produits...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun produit en attente d'approbation</p>
                  <p className="text-sm">Tous les produits ont été traités ✨</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Producteur</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.nom}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.nom}</p>
                              {product.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {product.description}
                                </p>
                              )}
                              {product.localisation && (
                                <p className="text-xs text-muted-foreground">📍 {product.localisation}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {product.producteur.prenom} {product.producteur.nom}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {product.producteur.pays}
                                {product.producteur.region && `, ${product.producteur.region}`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.prix.toLocaleString()} FCFA
                          </TableCell>
                          <TableCell>{product.quantite}</TableCell>
                          <TableCell>
                            {new Date(product.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateProductStatus(product.id, 'approuve')}
                                disabled={updatingProduct === product.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {updatingProduct === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateProductStatus(product.id, 'rejete')}
                                disabled={updatingProduct === product.id}
                              >
                                {updatingProduct === product.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-base md:text-lg">Gestion des utilisateurs</span>
                <Badge variant="secondary" className="w-fit">{users.length} utilisateur(s)</Badge>
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Gérer tous les utilisateurs de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground text-sm">Chargement...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <>
                  {/* Mobile view - Cards */}
                  <div className="md:hidden space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{user.prenom} {user.nom}</p>
                            <p className="text-xs text-muted-foreground">{user.whatsapp}</p>
                            <p className="text-xs text-muted-foreground">{user.pays}{user.region && `, ${user.region}`}</p>
                          </div>
                          <Badge variant={
                            user.user_type === 'admin' ? 'default' : 
                            user.user_type === 'producteur' ? 'secondary' : 'outline'
                          } className="text-[10px]">
                            {user.user_type}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {user.verified && <Badge variant="secondary" className="text-[10px]">Vérifié</Badge>}
                          {user.suspended && <Badge variant="destructive" className="text-[10px]">Suspendu</Badge>}
                          <Badge variant={user.subscription_required ? "default" : "outline"} className="text-[10px]">
                            {user.subscription_required ? "Abo. requis (3 produits max)" : "Abo. optionnel"}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        {user.user_type !== 'admin' && (
                          <div className="flex flex-wrap gap-2">
                            {user.user_type === 'producteur' && !user.verified && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => verifyProducer(user.id)}
                                disabled={updatingUser === user.id}
                                className="bg-green-600 hover:bg-green-700 text-xs h-8"
                              >
                                {updatingUser === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Vérifier</>}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={user.subscription_required ? "default" : "outline"}
                              onClick={() => toggleUserSubscriptionRequirement(user.id)}
                              disabled={updatingUser === user.id}
                              className={`text-xs h-8 ${user.subscription_required ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                            >
                              {updatingUser === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CreditCard className="h-3 w-3 mr-1" />{user.subscription_required ? "Lever" : "Exiger"}</>}
                            </Button>
                            <Button
                              size="sm"
                              variant={user.suspended ? "default" : "outline"}
                              onClick={() => toggleUserSuspension(user.id)}
                              disabled={updatingUser === user.id}
                              className="text-xs h-8"
                            >
                              {updatingUser === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : user.suspended ? <><UserCheck className="h-3 w-3 mr-1" />Activer</> : <><Ban className="h-3 w-3 mr-1" />Suspendre</>}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" disabled={updatingUser === user.id} className="text-xs h-8">
                                  <Trash2 className="h-3 w-3 mr-1" />Suppr.
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90vw] rounded-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-base">Supprimer l'utilisateur</AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm">
                                    Supprimer {user.prenom} {user.nom} et tous ses produits ?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row gap-2">
                                  <AlertDialogCancel className="flex-1">Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-destructive flex-1">
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop view - Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Localisation</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Abonnement</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.prenom} {user.nom}</p>
                                <p className="text-sm text-muted-foreground">{user.whatsapp}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                user.user_type === 'admin' ? 'default' : 
                                user.user_type === 'producteur' ? 'secondary' : 'outline'
                              }>
                                {user.user_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{user.pays}</p>
                                {user.region && <p className="text-xs text-muted-foreground">{user.region}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {user.verified && <Badge variant="secondary" className="text-xs">Vérifié</Badge>}
                                {user.suspended && <Badge variant="destructive" className="text-xs">Suspendu</Badge>}
                                {!user.verified && !user.suspended && <Badge variant="outline" className="text-xs">Actif</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={user.subscription_required ? "default" : "outline"} className="text-xs">
                                  {user.subscription_required ? "Requis" : "Optionnel"}
                                </Badge>
                                {user.subscription_required && (
                                  <span className="text-[10px] text-muted-foreground">3 produits max</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              {user.user_type !== 'admin' && (
                                <div className="flex gap-2">
                                  {user.user_type === 'producteur' && !user.verified && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => verifyProducer(user.id)}
                                      disabled={updatingUser === user.id}
                                      className="bg-green-600 hover:bg-green-700"
                                      title="Vérifier le producteur"
                                    >
                                      {updatingUser === user.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </Button>
                                   )}
                                   <Button
                                     size="sm"
                                     variant={user.subscription_required ? "default" : "outline"}
                                     onClick={() => toggleUserSubscriptionRequirement(user.id)}
                                     disabled={updatingUser === user.id}
                                     className={user.subscription_required 
                                       ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white" 
                                       : ""}
                                     title={user.subscription_required ? "Lever l'obligation (permet modification)" : "Exiger l'abonnement (3 produits max, lecture seule)"}
                                   >
                                     {updatingUser === user.id ? (
                                       <Loader2 className="h-4 w-4 animate-spin" />
                                     ) : (
                                       <CreditCard className="h-4 w-4" />
                                     )}
                                   </Button>
                                   <Button
                                     size="sm"
                                     variant={user.suspended ? "default" : "outline"}
                                     onClick={() => toggleUserSuspension(user.id)}
                                     disabled={updatingUser === user.id}
                                     title={user.suspended ? "Réactiver" : "Suspendre"}
                                   >
                                     {updatingUser === user.id ? (
                                       <Loader2 className="h-4 w-4 animate-spin" />
                                     ) : user.suspended ? (
                                       <UserCheck className="h-4 w-4" />
                                     ) : (
                                       <Ban className="h-4 w-4" />
                                     )}
                                   </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={updatingUser === user.id}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir supprimer définitivement {user.prenom} {user.nom} ? 
                                          Cette action est irréversible et supprimera tous ses produits.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteUser(user.id)}
                                          className="bg-destructive text-destructive-foreground"
                                        >
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Tous les produits
                <Badge variant="secondary">{filteredProducts.length} produit(s)</Badge>
              </CardTitle>
              <CardDescription>
                Gérer tous les produits de la plateforme
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant={productFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setProductFilter('all')}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Tous ({allProducts.length})
                </Button>
                <Button
                  size="sm"
                  variant={productFilter === 'approuve' ? 'default' : 'outline'}
                  onClick={() => setProductFilter('approuve')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approuvés ({allProducts.filter(p => p.status === 'approuve').length})
                </Button>
                <Button
                  size="sm"
                  variant={productFilter === 'rejete' ? 'default' : 'outline'}
                  onClick={() => setProductFilter('rejete')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Refusés ({allProducts.filter(p => p.status === 'rejete').length})
                </Button>
                <Button
                  size="sm"
                  variant={productFilter === 'en_attente' ? 'default' : 'outline'}
                  onClick={() => setProductFilter('en_attente')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  En attente ({allProducts.filter(p => p.status === 'en_attente').length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAllProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Chargement des produits...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun produit trouvé</p>
                  <p className="text-sm">
                    {productFilter === 'all' ? 
                      'Aucun produit dans la base de données' : 
                      `Aucun produit avec le statut "${productFilter}"`
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Producteur</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.nom}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.nom}</p>
                            <p className="text-sm text-muted-foreground">Qté: {product.quantite}</p>
                            {product.localisation && (
                              <p className="text-xs text-muted-foreground">📍 {product.localisation}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {product.producteur.prenom} {product.producteur.nom}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {product.producteur.pays}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.prix.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={
                              product.status === 'approuve' ? 'default' :
                              product.status === 'en_attente' ? 'secondary' : 'destructive'
                            }>
                              {product.status}
                            </Badge>
                            {product.hidden && <Badge variant="outline" className="text-xs">Caché</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(product.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={product.hidden ? "default" : "outline"}
                              onClick={() => toggleProductVisibility(product.id)}
                              disabled={updatingProduct === product.id}
                            >
                              {updatingProduct === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : product.hidden ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={updatingProduct === product.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer définitivement le produit "{product.nom}" ? 
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProduct(product.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};