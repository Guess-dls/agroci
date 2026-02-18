import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Coins } from "lucide-react";
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
      // Vérifier le producteur du produit pour garantir le ciblage correct
      const { data: productRow, error: productErr } = await supabase
        .from('products')
        .select('producteur_id')
        .eq('id', productId)
        .maybeSingle();

      if (productErr) {
        console.error('Erreur récupération produit:', productErr);
      }

      const producerIdToUse = productRow?.producteur_id || producer.id;

      // Créer une demande de contact (fonction SQL sécurisée)
      const { error } = await supabase
        .rpc('create_contact_request', {
          producer_profile_id: producerIdToUse,
          product_id_param: productId,
          message_text: `Intéressé(e) par le produit: ${productName}`
        });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Demande envoyée",
        description: "Votre demande de contact a été envoyée au producteur. Vous serez notifié dès qu'il acceptera.",
      });

      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'envoi de la demande",
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
            <div className={`border p-3 rounded-lg ${userCredits < 5 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2">
                <Coins className={`h-4 w-4 ${userCredits < 5 ? 'text-red-600' : 'text-blue-600'}`} />
                <span className={`text-sm font-medium ${userCredits < 5 ? 'text-red-800' : 'text-blue-800'}`}>
                  Vos crédits: {userCredits}
                </span>
              </div>
              <p className={`text-xs mt-1 ${userCredits < 5 ? 'text-red-600' : 'text-blue-600'}`}>
                {userCredits < 5 
                  ? '❌ Crédits insuffisants — il vous faut au moins 5 crédits pour envoyer une demande'
                  : '5 crédits seront déduits à chaque partie lors de l\'acceptation'
                }
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleWhatsAppContact}
              disabled={loading || (userCredits !== null && userCredits < 5)}
              className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Envoyer une demande de contact
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