import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatModal } from "./ChatModal";

interface Conversation {
  id: string; // contact_request id
  product_name: string;
  product_image: string | null;
  other_user_name: string;
  other_user_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  status: string;
}

interface ConversationsListProps {
  userType: 'producteur' | 'acheteur';
}

export const ConversationsList = ({ userType }: ConversationsListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      setProfileId(profile.id);

      const idField = userType === 'producteur' ? 'producer_id' : 'buyer_id';
      const otherField = userType === 'producteur' ? 'buyer_id' : 'producer_id';

      const { data: requests, error } = await supabase
        .from('contact_requests')
        .select(`
          id, status, created_at,
          product:products!contact_requests_product_id_fkey(nom, image_url),
          buyer:profiles!contact_requests_buyer_id_fkey(id, nom, prenom),
          producer:profiles!contact_requests_producer_id_fkey(id, nom, prenom)
        `)
        .eq(idField, profile.id)
        .eq('status', 'acceptee')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unread counts and last messages
      const convs: Conversation[] = [];
      for (const req of (requests || [])) {
        const product = Array.isArray(req.product) ? req.product[0] : req.product;
        const buyer = Array.isArray(req.buyer) ? req.buyer[0] : req.buyer;
        const producer = Array.isArray(req.producer) ? req.producer[0] : req.producer;
        const otherUser = userType === 'producteur' ? buyer : producer;

        if (!product || !otherUser) continue;

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('contact_request_id', req.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('contact_request_id', req.id)
          .eq('receiver_id', profile.id)
          .eq('read', false);

        convs.push({
          id: req.id,
          product_name: product.nom,
          product_image: product.image_url,
          other_user_name: `${otherUser.prenom} ${otherUser.nom}`,
          other_user_id: otherUser.id,
          last_message: lastMsg?.content || null,
          last_message_at: lastMsg?.created_at || req.created_at,
          unread_count: unreadCount || 0,
          status: req.status,
        });
      }

      // Sort by most recent message
      convs.sort((a, b) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });

      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  // Subscribe to new messages for notification badges
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${profileId}` },
        () => { loadConversations(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  const openChat = (conv: Conversation) => {
    setSelectedConv(conv);
    setChatOpen(true);
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
              <Badge variant="destructive" className="ml-2">{totalUnread}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Vos conversations avec les {userType === 'producteur' ? 'acheteurs' : 'producteurs'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune conversation</p>
              <p className="text-xs mt-1">
                {userType === 'acheteur' 
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
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm truncate">{conv.other_user_name}</h4>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs ml-2 shrink-0">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.product_name}</p>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.last_message}
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
            if (!open) {
              loadConversations(); // Refresh unread counts
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
