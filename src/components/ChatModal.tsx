import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!contactRequestId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("contact_request_id", contactRequestId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
      scrollToBottom();
    }
    setLoading(false);
  }, [contactRequestId, scrollToBottom]);

  const markAsRead = useCallback(async () => {
    if (!currentProfileId || !contactRequestId) return;

    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("contact_request_id", contactRequestId)
      .eq("receiver_id", currentProfileId)
      .eq("read", false);

    if (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [contactRequestId, currentProfileId]);

  useEffect(() => {
    if (!open || !contactRequestId) return;

    fetchMessages();
    markAsRead();
  }, [open, contactRequestId, fetchMessages, markAsRead]);

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
        async () => {
          await fetchMessages();
          await markAsRead();
        }
      )
      .subscribe();

    const intervalId = window.setInterval(() => {
      fetchMessages();
      markAsRead();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [open, contactRequestId, fetchMessages, markAsRead]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.rpc("send_message", {
        contact_request_id_param: contactRequestId,
        content_param: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
      await fetchMessages();
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
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            <div className="flex flex-col">
              <span>{otherUserName || "Utilisateur"}</span>
              <span className="text-xs font-normal text-muted-foreground">{productName}</span>
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
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                          isMine ? "bg-emerald-600 text-white rounded-br-md" : "bg-muted rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-200" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
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
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
