import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";
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

  const handleContactRequest = async () => {
    if (!producer || !user) return;

    setLoading(true);

    try {
      // Get the correct producer ID from the product
      const { data: productRow, error: productErr } = await supabase
        .from('products')
        .select('producteur_id')
        .eq('id', productId)
        .maybeSingle();

      if (productErr) {
        console.error('Erreur récupération produit:', productErr);
      }

      const producerIdToUse = productRow?.producteur_id || producer.id;

      // Create contact request (secure SQL function)
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

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💬 Votre demande sera envoyée au producteur. Une fois acceptée, vous pourrez discuter directement via la messagerie intégrée.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleContactRequest}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
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
