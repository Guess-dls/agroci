import { useState, useEffect, useCallback, useRef } from "react";
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
  request_message: string | null;
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
  const inFlightRef = useRef(false);
  const initializedUnreadRef = useRef(false);
  const previousUnreadByConversationRef = useRef<Record<string, number>>({});

  const loadConversations = useCallback(
    async (silent = false) => {
      if (inFlightRef.current) return;

      if (!user) {
        setConversations([]);
        setProfileId(null);
        setLoading(false);
        return;
      }

      inFlightRef.current = true;
      if (!silent) setLoading(true);

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
          setConversations([]);
          setProfileId(null);
          setLoading(false);
          return;
        }

        setProfileId(profile.id);

        // Fetch accepted conversations, excluding soft-deleted ones for current user
        const { data: requests, error: requestsError } = await supabase
          .from("contact_requests")
          .select(`
            id, status, message, created_at, buyer_id, producer_id,
            deleted_by_buyer, deleted_by_producer,
            product:products!contact_requests_product_id_fkey(nom, image_url),
            buyer:profiles!contact_requests_buyer_id_fkey(id, nom, prenom),
            producer:profiles!contact_requests_producer_id_fkey(id, nom, prenom)
          `)
          .or(`buyer_id.eq.${profile.id},producer_id.eq.${profile.id}`)
          .eq("status", "acceptee")
          .order("created_at", { ascending: false });

        if (requestsError) throw requestsError;

        // Filter out conversations soft-deleted by this user
        const requestRows = (requests || []).filter((r: any) => {
          if (r.buyer_id === profile.id && r.deleted_by_buyer) return false;
          if (r.producer_id === profile.id && r.deleted_by_producer) return false;
          return true;
        });
        if (requestRows.length === 0) {
          setConversations([]);
          previousUnreadByConversationRef.current = {};
          initializedUnreadRef.current = true;
          return;
        }

        const requestIds = requestRows.map((row) => row.id);

        const { data: messageRows, error: messagesError } = await supabase
          .from("messages")
          .select("contact_request_id, content, created_at, receiver_id, read")
          .in("contact_request_id", requestIds)
          .order("created_at", { ascending: false });

        if (messagesError) throw messagesError;

        const lastMessageByConversation: Record<string, { content: string; created_at: string }> = {};
        const unreadCountByConversation: Record<string, number> = {};

        (messageRows || []).forEach((message) => {
          if (!lastMessageByConversation[message.contact_request_id]) {
            lastMessageByConversation[message.contact_request_id] = {
              content: message.content,
              created_at: message.created_at,
            };
          }

          if (message.receiver_id === profile.id && !message.read) {
            unreadCountByConversation[message.contact_request_id] =
              (unreadCountByConversation[message.contact_request_id] || 0) + 1;
          }
        });

        const fallbackOtherLabel = "Interlocuteur";

        const normalizedConversations: Conversation[] = requestRows.map((request) => {
          const product = Array.isArray(request.product) ? request.product[0] : request.product;
          const buyer = Array.isArray(request.buyer) ? request.buyer[0] : request.buyer;
          const producer = Array.isArray(request.producer) ? request.producer[0] : request.producer;
          const isCurrentBuyer = request.buyer_id === profile.id;
          const otherUser = isCurrentBuyer ? producer : buyer;

          const displayName = otherUser
            ? `${otherUser.prenom || ""} ${otherUser.nom || ""}`.trim() || fallbackOtherLabel
            : fallbackOtherLabel;

          return {
            id: request.id,
            product_name: product?.nom || "Conversation privée",
            product_image: product?.image_url || null,
            other_user_name: displayName,
            other_user_id: otherUser?.id ?? null,
            request_message: request.message || null,
            last_message: lastMessageByConversation[request.id]?.content || request.message || null,
            last_message_at: lastMessageByConversation[request.id]?.created_at || request.created_at,
            unread_count: unreadCountByConversation[request.id] || 0,
            status: request.status,
          };
        });

        normalizedConversations.sort((a, b) => {
          const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return dateB - dateA;
        });

        if (initializedUnreadRef.current) {
          normalizedConversations.forEach((conversation) => {
            const previousCount = previousUnreadByConversationRef.current[conversation.id] || 0;
            if (conversation.unread_count > previousCount && conversation.last_message) {
              toast({
                title: "Nouveau message",
                description: `${conversation.other_user_name}: ${conversation.last_message}`,
              });
            }
          });
        }

        previousUnreadByConversationRef.current = Object.fromEntries(
          normalizedConversations.map((conversation) => [conversation.id, conversation.unread_count])
        );
        initializedUnreadRef.current = true;

        setConversations(normalizedConversations);
      } catch (error: any) {
        console.error("Error loading conversations:", error);
        if (!silent) {
          toast({
            title: "Erreur",
            description: error.message || "Impossible de charger les conversations",
            variant: "destructive",
          });
        }
        setConversations([]);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [toast, user, userType]
  );

  useEffect(() => {
    loadConversations(false);
  }, [loadConversations]);

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`conversations-updates-${profileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${profileId}` },
        () => loadConversations(true)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `sender_id=eq.${profileId}` },
        () => loadConversations(true)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_requests", filter: `buyer_id=eq.${profileId}` },
        () => loadConversations(true)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_requests", filter: `producer_id=eq.${profileId}` },
        () => loadConversations(true)
      )
      .subscribe();

    const intervalId = window.setInterval(() => {
      loadConversations(true);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [profileId, loadConversations]);

  const openChat = (conversation: Conversation) => {
    setSelectedConv(conversation);
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
      await loadConversations(true);
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

  const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unread_count, 0);

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
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => openChat(conversation)}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {conversation.product_image ? (
                  <img
                    src={conversation.product_image}
                    alt={conversation.product_name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm truncate">{conversation.other_user_name}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                        disabled={deletingId === conversation.id}
                        className="h-7 w-7"
                        aria-label="Supprimer la discussion"
                      >
                        {deletingId === conversation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conversation.product_name}</p>
                  {conversation.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conversation.last_message}</p>
                  )}
                  {conversation.last_message_at && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(conversation.last_message_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
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
            if (!open) loadConversations(true);
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
