import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, MessageSquare, Package, Calendar, User } from "lucide-react";
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
  producteur_id: string;
  created_at: string;
  profiles?: {
    nom: string;
    prenom: string;
    whatsapp?: string;
    verified: boolean;
  };
}

interface Producer {
  nom: string;
  prenom: string;
  whatsapp: string;
}

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onContactProducer: (productId: string, productName: string) => void;
}

export const ProductDetailsModal = ({ product, isOpen, onClose, onContactProducer }: ProductDetailsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!product) return null;

  const producer = product.profiles;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleContactClick = () => {
    onContactProducer(product.id, product.nom);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.nom}</DialogTitle>
          <DialogDescription>
            Détails complets du produit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

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

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Localisation */}
          {product.localisation && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="font-medium">{product.localisation}</span>
            </div>
          )}

          {/* Informations du producteur */}
          {producer && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Producteur
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">
                    {producer.prenom} {producer.nom}
                  </p>
                  {producer.verified && (
                    <Badge variant="default" className="mt-1">
                      ✓ Vérifié
                    </Badge>
                  )}
                </div>
                <Button 
                  onClick={handleContactClick}
                  className="ml-4"
                  disabled={!user}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {user ? "Contacter" : "Connexion requise"}
                </Button>
              </div>
            </div>
          )}

          {/* Date de publication */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            Publié le {formatDate(product.created_at)}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
            {user && (
              <Button 
                onClick={handleContactClick}
                className="flex-1"
              >
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