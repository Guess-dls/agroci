import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Rocket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { ContactProducerModal } from "@/components/ContactProducerModal";

interface Product {
  id: string;
  nom: string;
  prix: number;
  quantite: string;
  image_url: string | null;
  images?: string[];
  localisation: string | null;
  description: string | null;
  producteur_id?: string;
  created_at?: string;
  categories_produits: { nom: string } | null;
  profiles?: {
    nom: string;
    prenom: string;
    whatsapp?: string;
    verified: boolean;
  };
  is_boosted?: boolean;
}

interface Producer {
  id: string;
  nom: string;
  prenom: string;
  whatsapp: string;
}

export const PopularProducts = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["approved-products-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, nom, prix, quantite, image_url, images, localisation, description,
          producteur_id, created_at,
          categories_produits(nom),
          profiles!products_producteur_id_fkey(nom, prenom, whatsapp, verified)
        `)
        .eq("status", "approuve")
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;

      const { data: boosts } = await supabase
        .from("product_boosts")
        .select("product_id")
        .eq("status", "active")
        .gt("end_date", new Date().toISOString());

      const boostedIds = new Set((boosts || []).map(b => b.product_id));
      const enriched = (data || []).map(p => ({ ...p, is_boosted: boostedIds.has(p.id) })) as Product[];
      enriched.sort((a, b) => (a.is_boosted && !b.is_boosted ? -1 : !a.is_boosted && b.is_boosted ? 1 : 0));
      return enriched.slice(0, 8);
    },
  });

  const formatPrice = (price: number) => new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

  const handleProductClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleContactProducer = async (productId: string, productName: string) => {
    try {
      const { data: producerData, error } = await supabase.rpc("get_public_producer_info_for_product", { product_id_param: productId });
      if (error) throw error;
      if (producerData && producerData.length > 0) {
        setSelectedProducer({ id: producerData[0].id, nom: producerData[0].nom, prenom: producerData[0].prenom, whatsapp: "" });
        setSelectedProductName(productName);
        setSelectedProductId(productId);
        setContactModalOpen(true);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <section id="produits" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Produits Disponibles
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les produits vivriers disponibles, directement des producteurs locaux vérifiés.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-4 rounded-2xl">
                <Skeleton className="w-full h-40 rounded-xl mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-2/3" />
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <Card
                  key={product.id}
                  onClick={(e) => handleProductClick(e, product)}
                  className={`overflow-hidden rounded-2xl border-0 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 cursor-pointer group bg-card ${
                    product.is_boosted ? 'ring-2 ring-accent shadow-glow' : ''
                  }`}
                >
                  <div className="aspect-square overflow-hidden bg-muted relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.nom}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-muted-foreground/40" />
                      </div>
                    )}
                    {product.is_boosted && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-accent text-accent-foreground text-xs gap-1 rounded-lg shadow-sm">
                          <Rocket className="w-3 h-3" /> Boosté
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {product.categories_produits && (
                      <span className="text-xs text-primary font-semibold uppercase tracking-wide">
                        {product.categories_produits.nom}
                      </span>
                    )}
                    <h3 className="font-semibold text-foreground mt-1 line-clamp-1">{product.nom}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{product.localisation || "Non spécifié"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{product.quantite}</p>
                    <p className="text-primary font-bold mt-2">{formatPrice(product.prix)}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/products">
                <Button size="lg" className="rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-soft gap-2">
                  Voir tous les produits
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucun produit disponible</h3>
            <p className="text-muted-foreground mb-6">Les produits des producteurs seront bientôt disponibles.</p>
            <Link to="/auth">
              <Button className="rounded-xl">Devenir producteur</Button>
            </Link>
          </div>
        )}
      </div>

      <ProductDetailsModal
        product={selectedProduct as any}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onContactProducer={handleContactProducer}
      />

      <ContactProducerModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        producer={selectedProducer}
        productName={selectedProductName}
        productId={selectedProductId}
      />
    </section>
  );
};
