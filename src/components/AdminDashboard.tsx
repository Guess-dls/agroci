import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Eye, Shield, TrendingUp, Users, Package, Clock, UserMinus, EyeOff, Trash2, Ban, UserCheck, Filter } from "lucide-react";
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

  useEffect(() => {
    fetchPendingProducts();
    fetchStats();
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

  const navigateToTab = (tab: string, filter?: string) => {
    setActiveTab(tab);
    if (filter && tab === 'products') {
      setProductFilter(filter as 'all' | 'approuve' | 'rejete' | 'en_attente');
    }
  };

  const filteredProducts = allProducts.filter(product => {
    if (productFilter === 'all') return true;
    return product.status === productFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Administration</h2>
          <p className="text-muted-foreground">Gestion de la plateforme AgroConnect</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigateToTab('validation')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingProducts}</div>
            <p className="text-xs text-muted-foreground">Cliquez pour valider</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigateToTab('products', 'all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              navigateToTab('products', 'approuve');
            }}>
              {stats.approvedProducts} approuvés, <span className="cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                navigateToTab('products', 'rejete');
              }}>{stats.rejectedProducts} refusés</span>
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigateToTab('users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducers + stats.totalBuyers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducers} producteurs, {stats.totalBuyers} acheteurs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="validation">
            Validation des produits
            {stats.pendingProducts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingProducts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="products">Tous les produits</TabsTrigger>
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
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gestion des utilisateurs
                <Badge variant="secondary">{users.length} utilisateur(s)</Badge>
              </CardTitle>
              <CardDescription>
                Gérer tous les utilisateurs de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Chargement des utilisateurs...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date d'inscription</TableHead>
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
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {user.user_type !== 'admin' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={user.suspended ? "default" : "outline"}
                                onClick={() => toggleUserSuspension(user.id)}
                                disabled={updatingUser === user.id}
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
  );
};