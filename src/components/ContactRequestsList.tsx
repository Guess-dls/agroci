import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, X, MessageSquare } from "lucide-react";

interface ContactRequest {
  id: string;
  buyer_id: string;
  product_id: string;
  status: string;
  message: string | null;
  created_at: string;
  buyer_profile?: {
    nom?: string;
    prenom?: string;
    pays?: string;
    region?: string | null;
  } | null;
  product: {
    nom: string;
    image_url: string | null;
  };
}

export const ContactRequestsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('contact_requests')
        .select(`
          *,
          buyer_profile:profiles!contact_requests_buyer_id_fkey(nom, prenom, pays, region),
          product:products!contact_requests_product_id_fkey(nom, image_url)
        `)
        .eq('producer_id', profile.id)
        .eq('status', 'en_attente')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validRequests = (data || []).map(req => ({
        ...req,
        buyer_profile: Array.isArray(req.buyer_profile) ? req.buyer_profile[0] : (req.buyer_profile || null),
        product: Array.isArray(req.product) ? req.product[0] : req.product,
      })).filter(req => req.product);

      setRequests(validRequests);
    } catch (error: any) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);

    try {
      const { data, error } = await supabase
        .rpc('accept_contact_request', {
          request_id_param: requestId
        });

      if (error) throw error;

      toast({
        title: "Demande acceptée ✅",
        description: "Vous pouvez maintenant discuter avec l'acheteur dans la messagerie.",
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);

    try {
      const { error } = await supabase
        .rpc('reject_contact_request', {
          request_id_param: requestId
        });

      if (error) throw error;

      toast({
        title: "Demande refusée",
        description: "La demande de contact a été refusée",
      });

      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Demandes de contact
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
          Demandes de contact
          {requests.length > 0 && (
            <Badge variant="default" className="ml-2">{requests.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Acceptez les demandes pour discuter via la messagerie intégrée
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Aucune demande de contact en attente
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
                          {request.buyer_profile?.prenom ? `${request.buyer_profile.prenom} ${request.buyer_profile.nom}` : 'Acheteur intéressé'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.buyer_profile?.pays ? `${request.buyer_profile.pays}${request.buyer_profile?.region ? `, ${request.buyer_profile.region}` : ''}` : 'Profil privé'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">
                      <strong>Produit:</strong> {request.product.nom}
                    </p>
                    {request.message && (
                      <p className="text-sm text-muted-foreground mb-3">
                        "{request.message}"
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAccept(request.id)}
                        disabled={processingId === request.id}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accepter
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
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
