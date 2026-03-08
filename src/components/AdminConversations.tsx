import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  sender: { nom: string; prenom: string };
}

export const AdminConversations = () => {
  const [conversations, setConversations] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

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

      // Get message counts
      const { data: msgCounts, error: msgError } = await supabase
        .from("messages")
        .select("contact_request_id");

      if (msgError) throw msgError;

      const countMap = new Map<string, number>();
      msgCounts?.forEach((m) => {
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

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id, content, created_at, read,
          sender:profiles!messages_sender_id_fkey(nom, prenom)
        `)
        .eq("contact_request_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(
        (data || []).map((m: any) => ({
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          read: m.read,
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
      case "acceptee": return { label: "Acceptée", variant: "default" as const };
      case "refusee": return { label: "Refusée", variant: "destructive" as const };
      default: return { label: "En attente", variant: "secondary" as const };
    }
  };

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
              {conversations.filter((c) => c.status === "acceptee").length}
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
              {conversations.filter((c) => c.status === "refusee").length}
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
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {conversations.map((conv) => {
              const st = statusLabel(conv.status);
              return (
                <div key={conv.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Acheteur</p>
                      <p className="font-medium text-sm">{conv.buyer.prenom} {conv.buyer.nom}</p>
                    </div>
                    <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Producteur</p>
                    <p className="text-sm">{conv.producer.prenom} {conv.producer.nom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Produit</p>
                    <p className="text-sm">{conv.product.nom}</p>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{conv.messageCount} message(s)</span>
                    <span>{new Date(conv.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {conv.message && (
                    <p className="text-xs bg-muted p-2 rounded italic">"{conv.message}"</p>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => toggleExpand(conv.id)}
                  >
                    {expandedId === conv.id ? <><ChevronUp className="h-3 w-3 mr-1" />Masquer</> : <><ChevronDown className="h-3 w-3 mr-1" />Voir messages</>}
                  </Button>
                  {expandedId === conv.id && (
                    <div className="border-t pt-2 space-y-2">
                      {loadingMessages ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      ) : messages.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center">Aucun message</p>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className="bg-muted/50 p-2 rounded text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">{msg.sender.prenom} {msg.sender.nom}</span>
                              <span className="text-muted-foreground">
                                {new Date(msg.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p>{msg.content}</p>
                            {!msg.read && <Badge variant="secondary" className="text-[8px]">Non lu</Badge>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acheteur</TableHead>
                  <TableHead>Producteur</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conv) => {
                  const st = statusLabel(conv.status);
                  return (
                    <>
                      <TableRow key={conv.id} className="cursor-pointer" onClick={() => toggleExpand(conv.id)}>
                        <TableCell className="font-medium">{conv.buyer.prenom} {conv.buyer.nom}</TableCell>
                        <TableCell>{conv.producer.prenom} {conv.producer.nom}</TableCell>
                        <TableCell>{conv.product.nom}</TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline">{conv.messageCount}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(conv.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          {expandedId === conv.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </TableCell>
                      </TableRow>
                      {expandedId === conv.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            {loadingMessages ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            ) : messages.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center">Aucun message échangé</p>
                            ) : (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {conv.message && (
                                  <div className="text-xs italic text-muted-foreground mb-2 p-2 bg-muted rounded">
                                    Message initial: "{conv.message}"
                                  </div>
                                )}
                                {messages.map((msg) => (
                                  <div key={msg.id} className="flex justify-between items-start p-2 rounded bg-background border text-sm">
                                    <div className="space-y-1">
                                      <span className="font-medium text-xs">{msg.sender.prenom} {msg.sender.nom}</span>
                                      <p className="text-sm">{msg.content}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(msg.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                      {!msg.read && <Badge variant="secondary" className="text-[8px]">Non lu</Badge>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
