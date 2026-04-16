import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, ShieldCheck, Package, Loader2, User, ChevronDown, X, Eye, MessageSquare, Rocket } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { ContactProducerModal } from "@/components/ContactProducerModal";
import { ProducerBadge } from "@/components/ProducerBadge";
import SEOHead from "@/components/SEOHead";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProducerProfile {
  id: string;
  nom: string;
  prenom: string;
  region: string | null;
  pays: string | null;
  verified: boolean;
  type_activite: string | null;
}

interface ProducerProduct {
  id: string;
  nom: string;
  prix: number;
  quantite: string | null;
  image_url: string | null;
  images: string[] | null;
  localisation: string | null;
  description: string | null;
  producteur_id: string;
  categorie_id: string | null;
  created_at: string;
  is_boosted: boolean;
  categories_produits: { nom: string; icone: string } | null;
}

interface ProducerWithProducts {
  profile: ProducerProfile;
  products: ProducerProduct[];
}

const Producers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [producers, setProducers] = useState<ProducerWithProducts[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  // Product detail modal
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Contact modal
  const [contactOpen, setContactOpen] = useState(false);
  const [contactProducer, setContactProducer] = useState<any>(null);
  const [contactProductName, setContactProductName] = useState("");
  const [contactProductId, setContactProductId] = useState("");

  useEffect(() => {
    fetchProducers();
  }, []);

  const fetchProducers = async () => {
    try {
      setLoading(true);

      // Fetch all approved, visible products with their producer profiles
      const { data: products, error } = await supabase
        .from("products")
        .select(`
          id, nom, prix, quantite, image_url, images, localisation, description,
          producteur_id, categorie_id, created_at,
          profiles!products_producteur_id_fkey(id, nom, prenom, region, pays, verified, type_activite),
          categories_produits:categorie_id(nom, icone)
        `)
        .eq("status", "approuve")
        .eq("hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch active boosts
      const { data: boosts } = await supabase
        .from("product_boosts")
        .select("product_id")
        .eq("status", "active")
        .gt("end_date", new Date().toISOString());

      const boostedIds = new Set((boosts || []).map(b => b.product_id));

      // Group products by producer
      const producerMap = new Map<string, ProducerWithProducts>();
      const regionSet = new Set<string>();

      for (const p of (products || [])) {
        const profile = p.profiles as any as ProducerProfile;
        if (!profile) continue;

        if (profile.region) regionSet.add(profile.region);

        if (!producerMap.has(profile.id)) {
          producerMap.set(profile.id, { profile, products: [] });
        }

        producerMap.get(profile.id)!.products.push({
          ...p,
          is_boosted: boostedIds.has(p.id),
          categories_produits: p.categories_produits as any,
        });
      }

      // Also collect unique localisations as regions
      for (const p of (products || [])) {
        if (p.localisation) regionSet.add(p.localisation);
      }

      setProducers(Array.from(producerMap.values()));
      setRegions(Array.from(regionSet).sort());
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les producteurs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return producers.filter(({ profile, products }) => {
      const nameMatch = `${profile.prenom} ${profile.nom}`.toLowerCase().includes(term) ||
        profile.type_activite?.toLowerCase().includes(term) ||
        products.some(p => p.nom.toLowerCase().includes(term));

      const regionMatch = !selectedRegion ||
        profile.region?.toLowerCase() === selectedRegion.toLowerCase() ||
        products.some(p => p.localisation?.toLowerCase().includes(selectedRegion.toLowerCase()));

      return nameMatch && regionMatch;
    });
  }, [producers, searchTerm, selectedRegion]);

  const handleViewProduct = (product: any, profile: ProducerProfile) => {
    setSelectedProduct({ ...product, profiles: profile });
    setDetailsOpen(true);
  };

  const handleContactProducer = (productId: string, productName: string) => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour contacter un producteur", variant: "destructive" });
      return;
    }
    const prod = producers.find(p => p.products.some(pr => pr.id === productId));
    if (!prod) return;
    setContactProducer({ id: prod.profile.id, nom: prod.profile.nom, prenom: prod.profile.prenom, whatsapp: "" });
    setContactProductName(productName);
    setContactProductId(productId);
    setContactOpen(true);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Producteurs agricoles vérifiés"
        description="Trouvez des producteurs agricoles vérifiés en Côte d'Ivoire. Maïs, riz, manioc, igname et autres produits vivriers. Contact direct."
        keywords="producteurs agricoles, agriculteurs Côte d'Ivoire, producteurs vérifiés, maïs, riz, manioc"
        canonicalUrl="https://agroci.lovable.app/producers"
      />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Nos Producteurs Agricoles
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trouvez des producteurs vérifiés et découvrez leurs produits disponibles
          </p>
        </header>

        {/* Search + Region filter */}
        <section className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un producteur ou produit..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={selectedRegion ? "default" : "outline"} className="gap-2 shrink-0">
                <MapPin className="h-4 w-4" />
                {selectedRegion || "Par région"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 overflow-auto">
              {regions.map(r => (
                <DropdownMenuItem key={r} onClick={() => setSelectedRegion(r)}>
                  {r}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedRegion && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedRegion(null)} aria-label="Effacer le filtre région">
              <X className="h-4 w-4" />
            </Button>
          )}
        </section>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Chargement des producteurs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-soft">
            <CardContent className="text-center py-16">
              <User className="h-14 w-14 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground text-lg">
                {searchTerm || selectedRegion
                  ? "Aucun producteur trouvé pour vos critères"
                  : "Aucun producteur avec des produits en ligne pour le moment"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {filtered.map(({ profile, products }) => (
              <section key={profile.id} className="space-y-4">
                {/* Producer header */}
                <div className="flex items-center gap-3 px-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-foreground">
                        {profile.prenom} {profile.nom}
                      </h2>
                      <ProducerBadge producerId={profile.id} />
                      {profile.verified && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <ShieldCheck className="w-3 h-3" /> Vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {profile.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {profile.region}
                        </span>
                      )}
                      {profile.type_activite && (
                        <span>{profile.type_activite}</span>
                      )}
                      <span className="font-medium text-primary">{products.length} produit{products.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Producer's products grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map(product => (
                    <Card
                      key={product.id}
                      onClick={() => handleViewProduct(product, profile)}
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
                            <Package className="w-10 h-10 text-muted-foreground/40" />
                          </div>
                        )}
                        {product.is_boosted && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-accent text-accent-foreground text-xs gap-1 rounded-lg">
                              <Rocket className="w-3 h-3" /> Boosté
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        {product.categories_produits && (
                          <span className="text-xs text-primary font-semibold uppercase tracking-wide">
                            {product.categories_produits.icone} {product.categories_produits.nom}
                          </span>
                        )}
                        <h3 className="font-semibold text-foreground mt-1 text-sm line-clamp-1">{product.nom}</h3>
                        {product.localisation && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{product.localisation}</span>
                          </div>
                        )}
                        <p className="text-primary font-bold mt-2 text-sm">{formatPrice(product.prix)}</p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-8"
                            onClick={(e) => { e.stopPropagation(); handleViewProduct(product, profile); }}
                          >
                            <Eye className="w-3 h-3 mr-1" /> Voir
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs h-8 bg-gradient-primary text-primary-foreground"
                            onClick={(e) => { e.stopPropagation(); handleContactProducer(product.id, product.nom); }}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" /> Contact
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onContactProducer={handleContactProducer}
      />
      <ContactProducerModal
        open={contactOpen}
        onOpenChange={setContactOpen}
        producer={contactProducer}
        productName={contactProductName}
        productId={contactProductId}
      />
    </div>
  );
};

export default Producers;
