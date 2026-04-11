import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, MessageSquare, Package, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  nom: string;
  prix: number;
  quantite: string;
  description: string;
  localisation: string;
  image_url: string;
  images?: string[];
  producteur_id: string;
  created_at: string;
  profiles?: {
    nom: string;
    prenom: string;
    whatsapp?: string;
    verified: boolean;
  };
}

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onContactProducer: (productId: string, productName: string) => void;
}

export const ProductDetailsModal = ({ product, isOpen, onClose, onContactProducer }: ProductDetailsModalProps) => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const allImages = product.images && product.images.length > 0
    ? product.images.filter(Boolean)
    : product.image_url ? [product.image_url] : [];

  const producer = product.profiles;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR');

  const handleContactClick = () => {
    onContactProducer(product.id, product.nom);
    onClose();
  };

  const prevImage = () => setCurrentImageIndex(i => (i === 0 ? allImages.length - 1 : i - 1));
  const nextImage = () => setCurrentImageIndex(i => (i === allImages.length - 1 ? 0 : i + 1));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setCurrentImageIndex(0); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.nom}</DialogTitle>
          <DialogDescription>Détails complets du produit</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {allImages.length > 0 ? (
              <>
                <img
                  src={allImages[currentImageIndex]}
                  alt={`${product.nom} - Photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {allImages.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-1.5 shadow">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-1.5 shadow">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-primary' : 'bg-background/60'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {allImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${idx === currentImageIndex ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={url} alt={`Miniature ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Prix et quantité */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-2xl font-bold px-4 py-2">
              {product.prix.toLocaleString()} FCFA
            </Badge>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Quantité disponible</p>
              <p className="text-lg font-semibold">{product.quantite}</p>
            </div>
          </div>

          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.localisation && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="font-medium">{product.localisation}</span>
            </div>
          )}

          {producer && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Producteur
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{producer.prenom} {producer.nom}</p>
                  {producer.verified && <Badge variant="default" className="mt-1">✓ Vérifié</Badge>}
                </div>
                <Button onClick={handleContactClick} className="ml-4" disabled={!user}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {user ? "Contacter" : "Connexion requise"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            Publié le {formatDate(product.created_at)}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">Fermer</Button>
            {user && (
              <Button onClick={handleContactClick} className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter le producteur
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
