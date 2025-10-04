import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Clock, CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react";

interface ContactRequest {
  id: string;
  producer_id: string;
  product_id: string;
  status: string;
  message: string | null;
  created_at: string;
  producer_profile: {
    nom: string;
    prenom: string;
    whatsapp: string;
    pays: string;
    region: string | null;
  };
  product: {
    nom: string;
    image_url: string | null;
  };
}

export const BuyerContactRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!user) return;

    try {
      console.log('BuyerContactRequests - Chargement des demandes...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('Profile trouvé:', profile);
      
      if (profileError) {
        console.error('Erreur profile:', profileError);
        return;
      }
      
      if (!profile) return;

      const { data, error } = await supabase
        .from('contact_requests')
        .select(`
          id,
          producer_id,
          product_id,
          status,
          message,
          created_at,
          profiles!producer_id(nom, prenom, whatsapp, pays, region),
          products!product_id(nom, image_url)
        `)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      console.log('Demandes chargées:', data);
      console.log('Erreur:', error);

      if (error) throw error;

      // Transform data to match interface and filter out invalid entries
      const transformedData = data?.map(req => {
        const producerProfile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
        const product = Array.isArray(req.products) ? req.products[0] : req.products;
        
        return {
          id: req.id,
          producer_id: req.producer_id,
          product_id: req.product_id,
          status: req.status,
          message: req.message,
          created_at: req.created_at,
          producer_profile: producerProfile,
          product: product,
        };
      }).filter(req => req.producer_profile && req.product) || [];

      console.log('Demandes transformées:', transformedData);
      setRequests(transformedData);
    } catch (error: any) {
      console.error('Erreur lors du chargement des demandes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos demandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleWhatsAppContact = (request: ContactRequest) => {
    const producer = request.producer_profile;
    
    // Format WhatsApp number
    let whatsappNumber = producer.whatsapp.replace(/[^\d+]/g, '');
    if (!whatsappNumber.startsWith('+')) {
      whatsappNumber = '+' + whatsappNumber;
    }

    // Generate WhatsApp message
    const message = encodeURIComponent(
      `Bonjour ${producer.prenom} ${producer.nom},\n\nJe suis intéressé(e) par votre produit "${request.product.nom}" sur AgroConnect. Pouvons-nous en discuter ?\n\nMerci !`
    );

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  const handleRetry = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: 'en_attente' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Demande relancée",
        description: "Le producteur a été notifié de votre nouvelle demande",
      });

      loadRequests();
    } catch (error: any) {
      console.error('Erreur lors de la relance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de relancer la demande",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;

    try {
      const { error } = await supabase
        .from('contact_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Demande supprimée",
        description: "La demande a été supprimée avec succès",
      });

      loadRequests();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la demande",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'acceptee':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Acceptée
          </Badge>
        );
      case 'refusee':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Refusée
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mes demandes de contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mes demandes de contact
        </CardTitle>
        <CardDescription>
          Suivez vos demandes et contactez les producteurs qui ont accepté
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Vous n'avez envoyé aucune demande de contact
          </p>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {request.product.image_url && (
                    <img 
                      src={request.product.image_url} 
                      alt={request.product.nom}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {request.producer_profile.prenom} {request.producer_profile.nom}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.producer_profile.pays}
                          {request.producer_profile.region && `, ${request.producer_profile.region}`}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm mb-2">
                      <strong>Produit:</strong> {request.product.nom}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    
                    {request.status === 'acceptee' && (
                      <div className="space-y-2">
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                          <p className="text-sm text-green-800 mb-2">
                            ✅ Le producteur a accepté votre demande ! Vous pouvez maintenant le contacter.
                          </p>
                          <p className="text-xs text-green-700">
                            <strong>WhatsApp:</strong> {request.producer_profile.whatsapp}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleWhatsAppContact(request)}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contacter sur WhatsApp
                        </Button>
                      </div>
                    )}
                    
                    
                    {request.status === 'refusee' && (
                      <div className="space-y-2">
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <p className="text-sm text-red-800">
                            ❌ Le producteur a refusé cette demande
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRetry(request.id)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Relancer
                          </Button>
                          <Button
                            onClick={() => handleDelete(request.id)}
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    )}

                    {request.status === 'en_attente' && (
                      <div className="space-y-2">
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⏳ En attente de la réponse du producteur
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDelete(request.id)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Annuler la demande
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};
