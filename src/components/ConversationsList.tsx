import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatModal } from "./ChatModal";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  product_name: string;
  product_image: string | null;
  other_user_name: string;
  other_user_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  status: string;
}

interface ConversationsListProps {
  userType: "producteur" | "acheteur";
}

export const ConversationsList = ({ userType }: ConversationsListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
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
        .single();

      if (profileError) throw profileError;
      if (!profile) {
        setConversations([]);
        setProfileId(null);
        setLoading(false);
        return;
      }

      setProfileId(profile.id);

      const idField = userType === "producteur" ? "producer_id" : "buyer_id";

      const { data: requests, error } = await supabase
        .from("contact_requests")
        .select(`
          id, status, created_at,
          product:products!contact_requests_product_id_fkey(nom, image_url),
          buyer:profiles!contact_requests_buyer_id_fkey(id, nom, prenom),
          producer:profiles!contact_requests_producer_id_fkey(id, nom, prenom)
        `)
        .eq(idField, profile.id)
        .eq("status", "acceptee")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const fallbackOtherLabel = userType === "producteur" ? "Acheteur" : "Producteur";

      const convs = await Promise.all(
        (requests || []).map(async (req) => {
          const product = Array.isArray(req.product) ? req.product[0] : req.product;
          const buyer = Array.isArray(req.buyer) ? req.buyer[0] : req.buyer;
          const producer = Array.isArray(req.producer) ? req.producer[0] : req.producer;
          const otherUser = userType === "producteur" ? buyer : producer;

          if (!product) return null;

          const [lastMsgResult, unreadResult] = await Promise.all([
            supabase
              .from("messages")
              .select("content, created_at")
              .eq("contact_request_id", req.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("contact_request_id", req.id)
              .eq("receiver_id", profile.id)
              .eq("read", false),
          ]);

          const displayName = otherUser
            ? `${otherUser.prenom || ""} ${otherUser.nom || ""}`.trim() || fallbackOtherLabel
            : fallbackOtherLabel;

          return {
            id: req.id,
            product_name: product.nom,
            product_image: product.image_url,
            other_user_name: displayName,
            other_user_id: otherUser?.id ?? null,
            last_message: lastMsgResult.data?.content || null,
            last_message_at: lastMsgResult.data?.created_at || req.created_at,
            unread_count: unreadResult.count || 0,
            status: req.status,
          } as Conversation;
        })
      );

      const normalizedConvs = convs.filter((conv): conv is Conversation => conv !== null);

      normalizedConvs.sort((a, b) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });

      setConversations(normalizedConvs);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user, userType]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`conversations-updates-${profileId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        loadConversations();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_requests" }, () => {
        loadConversations();
      })
      .subscribe();

    const intervalId = window.setInterval(() => {
      loadConversations();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [profileId, loadConversations]);

  const openChat = (conv: Conversation) => {
    setSelectedConv(conv);
    setChatOpen(true);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm("Supprimer cette discussion ? Cette action est irréversible.")) return;

    setDeletingId(conversationId);
    try {
      const { error } = await supabase.rpc("delete_conversation", {
        contact_request_id_param: conversationId,
      });

      if (error) throw error;

      if (selectedConv?.id === conversationId) {
        setChatOpen(false);
        setSelectedConv(null);
      }

      toast({ title: "Discussion supprimée" });
      await loadConversations();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la discussion",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messagerie
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
            <MessageCircle className="h-5 w-5" />
            Messagerie
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Vos conversations avec les {userType === "producteur" ? "acheteurs" : "producteurs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune conversation</p>
              <p className="text-xs mt-1">
                {userType === "acheteur"
                  ? "Envoyez une demande de contact pour démarrer"
                  : "Acceptez des demandes pour commencer à discuter"}
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => openChat(conv)}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {conv.product_image ? (
                  <img
                    src={conv.product_image}
                    alt={conv.product_name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm truncate">{conv.other_user_name}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                        disabled={deletingId === conv.id}
                        className="h-7 w-7"
                        aria-label="Supprimer la discussion"
                      >
                        {deletingId === conv.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.product_name}</p>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {selectedConv && profileId && (
        <ChatModal
          open={chatOpen}
          onOpenChange={(open) => {
            setChatOpen(open);
            if (!open) {
              loadConversations();
            }
          }}
          contactRequestId={selectedConv.id}
          otherUserName={selectedConv.other_user_name}
          productName={selectedConv.product_name}
          currentProfileId={profileId}
        />
      )}
    </>
  );
};
