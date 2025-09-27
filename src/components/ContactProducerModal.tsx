import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Phone, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Producer {
  id: string;
  nom: string;
  prenom: string;
  whatsapp: string;
}

interface ContactProducerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producer: Producer | null;
  productName: string;
  productId: string;
}

export const ContactProducerModal = ({ open, onOpenChange, producer, productName, productId }: ContactProducerModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);

  // Charger les crédits de l'utilisateur quand la modal s'ouvre
  useEffect(() => {
    if (open && user) {
      loadUserCredits();
    }
  }, [open, user]);

  const loadUserCredits = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserCredits(profile?.credits || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des crédits:', error);
    }
  };

  const handleWhatsAppContact = async () => {
    if (!producer || !user) return;

    setLoading(true);

    try {
      console.log('Attempting to contact producer:', producer.id, 'for product:', productId);
      
      // Call the secure RPC function that handles authentication, credit deduction, and contact info
      const { data, error } = await supabase
        .rpc('get_secure_producer_contact', {
          producer_profile_id: producer.id,
          product_id: productId
        });

      console.log('RPC response:', { data, error });

      if (error) {
        console.error('RPC error:', error);
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        toast({
          title: "Erreur",
          description: "Impossible d'obtenir les informations de contact",
          variant: "destructive",
        });
        return;
      }

      // Get contact info from secure function response
      const contactInfo = data[0];
      
      // Generate WhatsApp message and URL
      const message = encodeURIComponent(
        `Bonjour ${contactInfo.prenom},\n\nJe suis intéressé(e) par votre produit "${productName}" que j'ai vu sur AgroConnect. Pourriez-vous me donner plus d'informations ?\n\nMerci !`
      );
      
      // Format WhatsApp number - ensure it starts with + and remove any extra characters
      let whatsappNumber = contactInfo.whatsapp.replace(/[^\d+]/g, '');
      if (!whatsappNumber.startsWith('+')) {
        whatsappNumber = '+' + whatsappNumber;
      }

      const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Contact autorisé",
        description: "1 crédit a été déduit. Vous allez être redirigé vers WhatsApp.",
      });

      // Recharger les crédits pour afficher la nouvelle valeur
      loadUserCredits();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors du contact",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!producer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contacter le producteur
          </DialogTitle>
          <DialogDescription>
            Prenez contact avec {producer.prenom} {producer.nom} pour en savoir plus sur "{productName}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Informations du producteur</h4>
            <p><strong>Nom :</strong> {producer.prenom} {producer.nom}</p>
            <p><strong>Statut :</strong> Producteur vérifié</p>
          </div>

          {userCredits !== null && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Vos crédits: {userCredits}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Contacter ce producteur coûte 1 crédit
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleWhatsAppContact}
              disabled={loading || (userCredits !== null && userCredits < 1)}
              className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vérification...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Contacter via WhatsApp (1 crédit)
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};