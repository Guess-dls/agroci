import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactRequestId: string;
  otherUserName: string;
  productName: string;
  currentProfileId: string;
}

const getInitials = (name: string) => {
  const normalized = name.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
};

const formatMessageDate = (isoDate: string) =>
  new Date(isoDate).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const ChatModal = ({
  open,
  onOpenChange,
  contactRequestId,
  otherUserName,
  productName,
  currentProfileId,
}: ChatModalProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    });
  }, []);

  const fetchMessages = useCallback(
    async (silent = true) => {
      if (!contactRequestId) {
        if (!silent) setLoading(false);
        return;
      }
      if (!silent) setLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("contact_request_id", contactRequestId)
        .order("created_at", { ascending: true });

      if (error) {
        if (!silent) {
          toast({
            title: "Erreur",
            description: "Impossible de charger les messages",
            variant: "destructive",
          });
          setLoading(false);
        }
        return;
      }

      setMessages(data || []);
      scrollToBottom();
      if (!silent) setLoading(false);
    },
    [contactRequestId, scrollToBottom, toast]
  );

  const markAsRead = useCallback(async () => {
    if (!currentProfileId || !contactRequestId) return;

    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("contact_request_id", contactRequestId)
      .eq("receiver_id", currentProfileId)
      .eq("read", false);

    if (error) console.error("Error marking messages as read:", error);
  }, [contactRequestId, currentProfileId]);

  const refreshConversation = useCallback(
    async (silent = true) => {
      await fetchMessages(silent);
      await markAsRead();
    },
    [fetchMessages, markAsRead]
  );

  useEffect(() => {
    if (!open || !contactRequestId) return;

    setLoading(true);
    refreshConversation(false);
  }, [open, contactRequestId, refreshConversation]);

  useEffect(() => {
    if (!open || !contactRequestId) return;

    const channel = supabase
      .channel(`messages-${contactRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `contact_request_id=eq.${contactRequestId}`,
        },
        async (payload: any) => {
          const incoming = payload?.new as Message | undefined;
          if (payload?.eventType === "INSERT" && incoming?.receiver_id === currentProfileId) {
            toast({
              title: "Nouveau message",
              description: `${otherUserName || "Utilisateur"} vous a écrit`,
            });
          }
          await refreshConversation(true);
        }
      )
      .subscribe();

    const intervalId = window.setInterval(() => {
      refreshConversation(true);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [open, contactRequestId, currentProfileId, otherUserName, refreshConversation, toast]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.rpc("send_message", {
        contact_request_id_param: contactRequestId,
        content_param: content,
      });

      if (error) throw error;
      setNewMessage("");
      await refreshConversation(true);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] h-[82vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span>{otherUserName || "Utilisateur"}</span>
              <span className="text-xs font-normal text-muted-foreground">Produit: {productName}</span>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Messagerie intégrée pour discuter en privé à propos du produit {productName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Chargement...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun message pour le moment</p>
                <p className="text-xs mt-1">Envoyez le premier message !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === currentProfileId;

                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`flex items-end gap-2 max-w-[92%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {isMine ? "MO" : getInitials(otherUserName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                          <p className={`text-[11px] ${isMine ? "text-right" : "text-left"} text-muted-foreground`}>
                            {isMine ? "Vous" : otherUserName || "Utilisateur"}
                          </p>
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`mt-1 flex items-center gap-2 text-[10px] ${isMine ? "justify-end" : "justify-start"}`}>
                              <span className={isMine ? "text-primary-foreground/80" : "text-muted-foreground"}>
                                {formatMessageDate(msg.created_at)}
                              </span>
                              {isMine && msg.read && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Lu</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-3 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            className="flex-1"
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
