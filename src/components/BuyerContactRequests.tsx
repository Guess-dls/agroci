import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Clock, CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { ChatModal } from "./ChatModal";

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
  const [profileId, setProfileId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setProfileId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setRequests([]);
        setProfileId(null);
        return;
      }

      setProfileId(profile.id);

      const { data, error } = await supabase
        .from("contact_requests")
        .select(`
          id, producer_id, product_id, status, message, created_at,
          producer_profile:profiles!contact_requests_producer_id_fkey(nom, prenom, pays, region),
          product:products!contact_requests_product_id_fkey(nom, image_url)
        `)
        .eq("buyer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedData =
        data
          ?.map((request) => {
            const producerProfile = Array.isArray(request.producer_profile)
              ? request.producer_profile[0]
              : request.producer_profile;
            const product = Array.isArray(request.product) ? request.product[0] : request.product;
            return { ...request, producer_profile: producerProfile, product };
          })
          .filter((request) => request.producer_profile && request.product) || [];

      setRequests(transformedData);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Impossible de charger vos demandes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`buyer-requests-${profileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_requests", filter: `buyer_id=eq.${profileId}` },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, loadRequests]);

  const handleOpenChat = (request: ContactRequest) => {
    setSelectedRequest(request);
    setChatOpen(true);
  };

  const handleRetry = async (requestId: string) => {
    try {
      const { error } = await supabase.from("contact_requests").update({ status: "en_attente" }).eq("id", requestId);
      if (error) throw error;
      toast({ title: "Demande relancée", description: "Le producteur a été notifié" });
      loadRequests();
    } catch {
      toast({ title: "Erreur", description: "Impossible de relancer", variant: "destructive" });
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm("Supprimer cette demande ?")) return;
    try {
      const { error } = await supabase.from("contact_requests").delete().eq("id", requestId);
      if (error) throw error;
      toast({ title: "Supprimée" });
      loadRequests();
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "en_attente":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />En attente
          </Badge>
        );
      case "acceptee":
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />Acceptée
          </Badge>
        );
      case "refusee":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />Refusée
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
            <MessageSquare className="h-5 w-5" />Mes demandes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mes demandes de contact
          </CardTitle>
          <CardDescription>Suivez vos demandes et discutez avec les producteurs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune demande envoyée</p>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {request.product.image_url && (
                      <img src={request.product.image_url} alt={request.product.nom} className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{request.producer_profile.prenom} {request.producer_profile.nom}</h4>
                          <p className="text-sm text-muted-foreground">
                            {request.producer_profile.pays}{request.producer_profile.region && `, ${request.producer_profile.region}`}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm mb-2"><strong>Produit:</strong> {request.product.nom}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Demandé le {new Date(request.created_at).toLocaleDateString("fr-FR")}
                      </p>

                      {request.status === "acceptee" && (
                        <div className="space-y-2">
                          <div className="bg-muted border border-border p-3 rounded-lg">
                            <p className="text-sm text-foreground">✅ Le producteur a accepté ! Discutez via la messagerie.</p>
                          </div>
                          <Button onClick={() => handleOpenChat(request)} className="w-full" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ouvrir la conversation
                          </Button>
                        </div>
                      )}

                      {request.status === "refusee" && (
                        <div className="space-y-2">
                          <div className="bg-muted border border-border p-3 rounded-lg">
                            <p className="text-sm text-foreground">❌ Demande refusée</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleRetry(request.id)} variant="outline" size="sm" className="flex-1">
                              <RefreshCw className="h-4 w-4 mr-2" />Relancer
                            </Button>
                            <Button onClick={() => handleDelete(request.id)} variant="destructive" size="sm" className="flex-1">
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </Button>
                          </div>
                        </div>
                      )}

                      {request.status === "en_attente" && (
                        <div className="space-y-2">
                          <div className="bg-muted border border-border p-3 rounded-lg">
                            <p className="text-sm text-foreground">⏳ En attente de réponse</p>
                          </div>
                          <Button onClick={() => handleDelete(request.id)} variant="outline" size="sm" className="w-full">
                            <Trash2 className="h-4 w-4 mr-2" />Annuler
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

      {selectedRequest && profileId && (
        <ChatModal
          open={chatOpen}
          onOpenChange={setChatOpen}
          contactRequestId={selectedRequest.id}
          otherUserName={`${selectedRequest.producer_profile.prenom} ${selectedRequest.producer_profile.nom}`}
          productName={selectedRequest.product.nom}
          currentProfileId={profileId}
        />
      )}
    </>
  );
};
