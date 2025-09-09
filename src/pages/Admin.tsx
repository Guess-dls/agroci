import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  nom: string;
  prix: number;
  quantite: string;
  description: string;
  localisation: string;
  image_url: string;
  status: 'en_attente' | 'approuve' | 'rejete';
  created_at: string;
  producteur: {
    nom: string;
    prenom: string;
    whatsapp: string;
    pays: string;
    region: string;
  };
}

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      checkAdminAccess();
    }
  }, [user, loading, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        navigate('/');
        return;
      }

      if (data.user_type !== 'admin') {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions pour accéder à cette page",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchPendingProducts();
    } catch (error) {
      console.error('Error:', error);
      navigate('/');
    } finally {
      setLoadingProfile(false);
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

      const formattedProducts = data.map(product => ({
        ...product,
        producteur: product.profiles
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

      // Remove the product from the list
      setProducts(prev => prev.filter(p => p.id !== productId));
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

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Accès non autorisé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Administration
          </h1>
          <p className="text-muted-foreground">
            Gérez les produits en attente d'approbation
          </p>
        </div>

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
                      <TableHead>Localisation</TableHead>
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
                        <TableCell>{product.localisation || "-"}</TableCell>
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
      </main>
      <Footer />
    </div>
  );
};

export default Admin;