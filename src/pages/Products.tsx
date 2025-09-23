import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ContactProducerModal } from "@/components/ContactProducerModal";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, MapPin, MessageSquare, Loader2, Package, Eye } from "lucide-react";
import { ProducerBadge } from "@/components/ProducerBadge";

interface Product {
  id: string;
  nom: string;
  prix: number;
  quantite: string;
  description: string;
  localisation: string;
  image_url: string;
  producteur_id: string;
  created_at: string;
  profiles?: {
    nom: string;
    prenom: string;
    whatsapp: string;
    verified: boolean;
    id: string;
  };
}

interface Producer {
  nom: string;
  prenom: string;
  whatsapp: string;
}

const Products = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
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
          producteur_id,
          created_at,
          profiles!products_producteur_id_fkey (
            nom,
            prenom,
            whatsapp,
            verified,
            id
          )
        `)
        .eq('status', 'approuve')
        .eq('hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactProducer = async (productId: string, productName: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour contacter un producteur",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_producer_contact_info', {
        producer_profile_id: products.find(p => p.id === productId)?.producteur_id,
        product_id: productId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const producerInfo = data[0];
        setSelectedProducer({
          nom: producerInfo.nom,
          prenom: producerInfo.prenom,
          whatsapp: producerInfo.whatsapp
        });
        setSelectedProductName(productName);
        setContactModalOpen(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les informations du producteur",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de contacter le producteur",
        variant: "destructive"
      });
    }
  };

  const handleViewProduct = async (product: Product) => {
    // Record the view
    if (user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          await supabase
            .from('product_views')
            .insert({
              product_id: product.id,
              viewer_id: profile.id
            });

          // Increment views count
          await supabase
            .from('products')
            .update({ 
              views_count: (product as any).views_count ? (product as any).views_count + 1 : 1 
            })
            .eq('id', product.id);
        }
      } catch (error) {
        console.error('Error recording view:', error);
      }
    }

    setSelectedProduct(product);
    setDetailsModalOpen(true);
  };

  const filteredProducts = products.filter(product =>
    product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.localisation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Produits Disponibles
          </h1>
          <p className="text-muted-foreground">
            Découvrez tous les produits proposés par nos producteurs vérifiés
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input 
              placeholder="Rechercher un produit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtrer
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Chargement des produits...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? "Aucun produit trouvé pour votre recherche" : "Aucun produit disponible pour le moment"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const productData = product as any;
              const producer = productData.profiles;
              
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{product.nom}</h3>
                        {producer?.id && <ProducerBadge producerId={producer.id} />}
                      </div>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {product.prix.toLocaleString()} FCFA
                      </Badge>
                    </div>
                    <CardDescription>
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Quantité:</span>
                        <span className="font-medium">{product.quantite}</span>
                      </div>
                      {product.localisation && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          {product.localisation}
                        </div>
                      )}
                      {producer && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Producteur:</span>
                          <span className="font-medium ml-1">
                            {producer.prenom} {producer.nom}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => handleViewProduct(product)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button 
                          onClick={() => handleContactProducer(product.id, product.nom)}
                          className="flex-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contacter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
      
      <ContactProducerModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        producer={selectedProducer}
        productName={selectedProductName}
      />
      
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onContactProducer={handleContactProducer}
      />
    </div>
  );
};

export default Products;