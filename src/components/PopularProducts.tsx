import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const PopularProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["approved-products-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          nom,
          prix,
          quantite,
          image_url,
          localisation,
          description,
          categories_produits(nom)
        `)
        .eq("status", "approuve")
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  return (
    <section id="produits" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Produits Disponibles
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les produits vivriers disponibles, directement des
            producteurs locaux vérifiés.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="w-full h-32 rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-2/3" />
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.nom}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {product.categories_produits && (
                      <span className="text-xs text-primary font-medium">
                        {product.categories_produits.nom}
                      </span>
                    )}
                    <h3 className="font-semibold text-foreground mt-1 line-clamp-1">
                      {product.nom}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">
                        {product.localisation || "Non spécifié"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.quantite}
                    </p>
                    <p className="text-primary font-bold mt-2">
                      {formatPrice(product.prix)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link to="/products">
                <Button size="lg" className="px-8">
                  Voir tous les produits
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Aucun produit disponible
            </h3>
            <p className="text-muted-foreground mb-6">
              Les produits des producteurs seront bientôt disponibles.
            </p>
            <Link to="/auth">
              <Button>Devenir producteur</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
