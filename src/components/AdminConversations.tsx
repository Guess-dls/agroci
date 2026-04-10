import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, ChevronDown, ChevronUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContactRequest {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  buyer: { nom: string; prenom: string };
  producer: { nom: string; prenom: string };
  product: { nom: string };
  messageCount: number;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_id: string;
  sender: { nom: string; prenom: string };
}

export const AdminConversations = () => {
  const [conversations, setConversations] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConv, setSelectedConv] = useState<ContactRequest | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data: requests, error } = await supabase
        .from("contact_requests")
        .select(`
          id, status, message, created_at, updated_at,
          buyer:profiles!contact_requests_buyer_id_fkey(nom, prenom),
          producer:profiles!contact_requests_producer_id_fkey(nom, prenom),
          product:products!contact_requests_product_id_fkey(nom)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: msgCounts, error: msgError } = await supabase
        .from("messages")
        .select("contact_request_id");

      if (msgError) throw msgError;

      const countMap = new Map<string, number>();
      msgCounts?.forEach((m: any) => {
        const key = m.contact_request_id;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });

      const formatted = (requests || []).map((r: any) => ({
        id: r.id,
        status: r.status,
        message: r.message,
        created_at: r.created_at,
        updated_at: r.updated_at,
        buyer: r.buyer,
        producer: r.producer,
        product: r.product,
        messageCount: countMap.get(r.id) || 0,
      }));

      setConversations(formatted);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conv: ContactRequest) => {
    if (expandedId === conv.id) {
      setExpandedId(null);
      setSelectedConv(null);
      return;
    }
    setExpandedId(conv.id);
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id, content, created_at, read, sender_id,
          sender:profiles!messages_sender_id_fkey(nom, prenom)
        `)
        .eq("contact_request_id", conv.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(
        (data || []).map((m: any) => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          read: m.read,
          sender_id: m.sender_id,
          sender: m.sender,
        }))
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "accepte": return { label: "Acceptée", variant: "default" as const };
      case "refuse": return { label: "Refusée", variant: "destructive" as const };
      default: return { label: "En attente", variant: "secondary" as const };
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleString("fr-FR", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {conversations.filter((c) => c.status === "accepte").length}
            </div>
            <p className="text-xs text-muted-foreground">Acceptées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {conversations.filter((c) => c.status === "en_attente").length}
            </div>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">
              {conversations.filter((c) => c.status === "refuse").length}
            </div>
            <p className="text-xs text-muted-foreground">Refusées</p>
          </CardContent>
        </Card>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune conversation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const st = statusLabel(conv.status);
            const isExpanded = expandedId === conv.id;
            return (
              <div key={conv.id} className="border rounded-xl overflow-hidden">
                {/* Conversation header */}
                <div
                  className="p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => loadMessages(conv)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {conv.buyer.prenom} {conv.buyer.nom}
                        </span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="font-medium text-sm">
                          {conv.producer.prenom} {conv.producer.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          📦 {conv.product.nom}
                        </Badge>
                        <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {conv.messageCount} msg · {formatTime(conv.created_at)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Chat view */}
                {isExpanded && (
                  <div className="border-t bg-muted/20">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[400px]">
                        <div className="p-3 md:p-4 space-y-3">
                          {/* Initial message */}
                          {conv.message && (
                            <div className="text-center">
                              <span className="inline-block text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground italic">
                                Message initial : "{conv.message}"
                              </span>
                            </div>
                          )}

                          {messages.length === 0 && !conv.message ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Aucun message échangé</p>
                          ) : (
                            messages.map((msg, idx) => {
                              const isBuyer = selectedConv && 
                                `${msg.sender.prenom} ${msg.sender.nom}` === `${selectedConv.buyer.prenom} ${selectedConv.buyer.nom}`;
                              return (
                                <div key={msg.id} className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}>
                                  <div className={`max-w-[80%] space-y-1 ${isBuyer ? '' : 'items-end flex flex-col'}`}>
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${isBuyer ? 'bg-blue-500' : 'bg-green-500'}`}>
                                        {msg.sender.prenom?.[0]}{msg.sender.nom?.[0]}
                                      </div>
                                      <span className="text-[10px] font-medium text-muted-foreground">
                                        {msg.sender.prenom} {msg.sender.nom}
                                      </span>
                                    </div>
                                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                                      isBuyer 
                                        ? 'bg-muted rounded-tl-sm' 
                                        : 'bg-primary text-primary-foreground rounded-tr-sm'
                                    }`}>
                                      {msg.content}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted-foreground">
                                        {formatTime(msg.created_at)}
                                      </span>
                                      {!msg.read && (
                                        <Badge variant="secondary" className="text-[8px] px-1 py-0">Non lu</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
