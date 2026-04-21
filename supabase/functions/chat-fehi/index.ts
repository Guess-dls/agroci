import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🔐 ENV
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// 🧩 CLIENT DB
const supabase = createClient(supabaseUrl, supabaseKey);

// 🧠 SYSTEM PROMPT (PROPRE + CORRIGÉ)
const SYSTEM_PROMPT = `Tu es l'assistant officiel de FEHI.

🚨 DOMAINE AUTORISÉ :
https://fehi.vercel.app

LIENS AUTORISÉS :
- https://fehi.vercel.app
- https://fehi.vercel.app/products

RÈGLES :
- Ne jamais inventer de lien
- Toujours utiliser ce domaine
- Réponses courtes et claires
- Demander la ville si absente
- Proposer contact WhatsApp

FEHI :
- Plateforme de mise en relation
- Pas de paiement
- Pas de livraison

Produits : Riz, Maïs, Manioc, Igname, Banane plantain, Tomates, Oignons
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content.toLowerCase();

    // 🔎 RECHERCHE PRODUITS
    let products: any[] = [];

    const keywords = ["tomate", "riz", "maïs", "manioc", "igname", "oignon", "banane"];

    for (const keyword of keywords) {
      if (userMessage.includes(keyword)) {
        const { data } = await supabase
          .from("products")
          .select("id, name, city, price")
          .ilike("name", `%${keyword}%`)
          .limit(5);

        products = data || [];
        break;
      }
    }

    // 🧠 CONTEXTE PRODUITS POUR IA
    let productContext = "";

    if (products.length > 0) {
      productContext = "Produits disponibles:\n";

      for (const p of products) {
        productContext += `- ${p.name} (${p.city}) - ${p.price} FCFA\n`;
        productContext += `https://fehi.vercel.app/product/${p.id}\n`;
      }
    }

    // 🤖 APPEL IA
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: productContext || "Aucun produit trouvé" },
          ...messages,
        ],
        stream: true,
      }),
    });

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
