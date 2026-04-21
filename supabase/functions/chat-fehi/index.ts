import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import logoFehi from "@/assets/logo-fehi.png";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-fehi;

export const ChatBot = () => {
const [open, setOpen] = useState(false);
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);
const [messages, setMessages] = useState<Msg[]>([
{
role: "assistant",
content: "Bonjour 👋 Je suis l'assistant Fehi. Que cherchez-vous aujourd'hui ? Acheter, vendre, ou valoriser des déchets agricoles ?",
},
]);
const scrollRef = useRef<HTMLDivElement>(null);

useEffect(() => {
scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
}, [messages]);

const send = async () => {
const text = input.trim();
if (!text || loading) return;
setInput("");
const userMsg: Msg = { role: "user", content: text };
setMessages((p) => [...p, userMsg]);
setLoading(true);

try {  
  const resp = await fetch(CHAT_URL, {  
    method: "POST",  
    headers: {  
      "Content-Type": "application/json",  
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,  
    },  
    body: JSON.stringify({ messages: [...messages, userMsg].filter((m, i) => !(i === 0 && m.role === "assistant")) }),  
  });  

  if (resp.status === 429) {  
    toast.error("Trop de requêtes, réessaie dans un instant.");  
    setLoading(false);  
    return;  
  }  
  if (resp.status === 402) {  
    toast.error("Crédits IA épuisés.");  
    setLoading(false);  
    return;  
  }  
  if (!resp.ok || !resp.body) throw new Error("Erreur réseau");  

  setMessages((p) => [...p, { role: "assistant", content: "" }]);  

  const reader = resp.body.getReader();  
  const decoder = new TextDecoder();  
  let buffer = "";  
  let assistantText = "";  
  let done = false;  

  while (!done) {  
    const { done: d, value } = await reader.read();  
    if (d) break;  
    buffer += decoder.decode(value, { stream: true });  
    let nl: number;  
    while ((nl = buffer.indexOf("\n")) !== -1) {  
      let line = buffer.slice(0, nl);  
      buffer = buffer.slice(nl + 1);  
      if (line.endsWith("\r")) line = line.slice(0, -1);  
      if (line.startsWith(":") || line.trim() === "") continue;  
      if (!line.startsWith("data: ")) continue;  
      const json = line.slice(6).trim();  
      if (json === "[DONE]") { done = true; break; }  
      try {  
        const parsed = JSON.parse(json);  
        const content = parsed.choices?.[0]?.delta?.content;  
        if (content) {  
          assistantText += content;  
          setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m));  
        }  
      } catch {  
        buffer = line + "\n" + buffer;  
        break;  
      }  
    }  
  }  
} catch (e) {  
  console.error(e);  
  toast.error("Une erreur est survenue. Réessaie.");  
} finally {  
  setLoading(false);  
}

};

return (
<>
{!open && (
<Button
onClick={() => setOpen(true)}
size="lg"
className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-strong bg-gradient-primary hover:scale-110 transition-transform p-0"
aria-label="Ouvrir l'assistant Fehi"
>
<MessageCircle className="h-6 w-6" />
</Button>
)}

{open && (  
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[70vh] sm:h-[600px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-strong flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">  
      <div className="flex items-center justify-between p-4 bg-gradient-primary text-primary-foreground">  
        <div className="flex items-center gap-2">  
          <img src={logoFehi} alt="Fehi" className="h-8 w-8 rounded-lg bg-background/20 p-1" />  
          <div>  
            <h3 className="font-bold text-sm">Assistant Fehi</h3>  
            <p className="text-xs opacity-90">En ligne 🟢</p>  
          </div>  
        </div>  
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-primary-foreground hover:bg-background/20 h-8 w-8">  
          <X className="h-4 w-4" />  
        </Button>  
      </div>  

      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>  
        <div className="space-y-3">  
          {messages.map((m, i) => (  
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>  
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>  
                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">  
                  <ReactMarkdown>{m.content || "…"}</ReactMarkdown>  
                </div>  
              </div>  
            </div>  
          ))}  
          {loading && messages[messages.length - 1]?.role === "user" && (  
            <div className="flex justify-start">  
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">  
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />  
              </div>  
            </div>  
          )}  
        </div>  
      </ScrollArea>  

      <div className="p-3 border-t border-border bg-background">  
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">  
          <Input  
            value={input}  
            onChange={(e) => setInput(e.target.value)}  
            placeholder="Écris ton message…"  
            disabled={loading}  
            className="flex-1"  
          />  
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="bg-gradient-primary">  
            <Send className="h-4 w-4" />  
          </Button>  
        </form>  
      </div>  
    </div>  
  )}  
</>

);
};
