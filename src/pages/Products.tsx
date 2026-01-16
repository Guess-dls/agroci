import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ContactProducerModal } from "@/components/ContactProducerModal";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, MessageSquare, Loader2, Package, Eye } from "lucide-react";
import { ProducerBadge } from "@/components/ProducerBadge";
import CategoryFilter from "@/components/CategoryFilter";
import SEOHead from "@/components/SEOHead";

interface Product {
  id: string;
  nom: string;
  prix: number;
  quantite: string;
  description: string;
  localisation: string;
  image_url: string;
  producteur_id: string;
  categorie_id: string;
  created_at: string;
  profiles?: {
    nom: string;
    prenom: string;
    whatsapp?: string;
    verified: boolean;
    id: string;
  };
  categories_produits?: {
    nom: string;
    icone: string;
  };
}

interface Producer {
  id: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
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
          *,
          profiles:producteur_id (
            id,
            nom,
            prenom,
            pays,
            region,
            verified,
            type_activite
          ),
          categories_produits:categorie_id (
            nom,
            icone
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
      const product = products.find(p => p.id === productId);
      if (!product || !product.profiles) {
        toast({
          title: "Erreur",
          description: "Produit non trouvé",
          variant: "destructive"
        });
        return;
      }

      setSelectedProducer({
        id: product.profiles.id,
        nom: product.profiles.nom,
        prenom: product.profiles.prenom,
        whatsapp: ''
      });
      setSelectedProductName(productName);
      setSelectedProductId(productId);
      setContactModalOpen(true);
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de contacter le producteur",
        variant: "destructive"
      });
    }
  };

  const handleViewProduct = async (product: Product) => {
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.localisation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === null || product.categorie_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <SEOHead 
        title="Catalogue des produits agricoles"
        description="Découvrez notre catalogue de produits vivriers en gros : maïs, riz, manioc, igname, tomates, oignons. Produits frais de producteurs vérifiés en Côte d'Ivoire."
        keywords="catalogue produits agricoles, maïs en gros, riz en gros, manioc, igname, légumes frais, Côte d'Ivoire"
        canonicalUrl="https://agroci.lovable.app/products"
      />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Produits Agricoles Disponibles
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Découvrez une large gamme de produits agricoles frais et de qualité provenant de producteurs vérifiés
          </p>
          
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input
                placeholder="Rechercher des produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Rechercher des produits agricoles"
              />
            </div>
          </div>

          <CategoryFilter 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Chargement">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <span className="ml-2 text-gray-600">Chargement des produits...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
              <p className="text-gray-600">
                {searchTerm || selectedCategory ? "Aucun produit trouvé pour vos critères" : "Aucun produit disponible pour le moment"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <section aria-label="Liste des produits agricoles">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const producer = product.profiles;
                const category = product.categories_produits;
                
                return (
                  <article key={product.id}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 h-full">
                      <div className="aspect-video relative bg-gray-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={`${product.nom} - ${product.quantite} disponible à ${product.localisation || 'Côte d\'Ivoire'}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-12 w-12 text-gray-400" aria-hidden="true" />
                          </div>
                        )}
                        {category && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-white/90 text-gray-800 hover:bg-white">
                              <span className="mr-1" aria-hidden="true">{category.icone}</span>
                              {category.nom}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-800">{product.nom}</h2>
                            {producer?.id && <ProducerBadge producerId={producer.id} />}
                          </div>
                          <Badge className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 text-white">
                            {product.prix.toLocaleString()} FCFA
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-600">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Quantité:</span>
                            <span className="font-medium text-gray-800">{product.quantite}</span>
                          </div>
                          {product.localisation && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" aria-hidden="true" />
                              <span>{product.localisation}</span>
                            </div>
                          )}
                          {producer && (
                            <div className="text-sm">
                              <span className="text-gray-500">Producteur:</span>
                              <span className="font-medium ml-1 text-gray-800">
                                {producer.prenom} {producer.nom}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="outline"
                              onClick={() => handleViewProduct(product)}
                              className="flex-1 hover:bg-gray-100"
                              aria-label={`Voir les détails de ${product.nom}`}
                            >
                              <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                              Voir
                            </Button>
                            <Button 
                              onClick={() => handleContactProducer(product.id, product.nom)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                              aria-label={`Contacter le producteur de ${product.nom}`}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                              Contacter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <Footer />
      
      <ContactProducerModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        producer={selectedProducer}
        productName={selectedProductName}
        productId={selectedProductId}
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
