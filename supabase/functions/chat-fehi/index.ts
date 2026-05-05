const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es l'assistant intelligent de FEHI, plateforme de commerce agricole en Côte d'Ivoire.

Ton rôle :
- Aider les utilisateurs à trouver des produits agricoles
- Aider à vendre des produits ou déchets agricoles
- Orienter vers les vendeurs via WhatsApp
- Répondre clairement, simplement et avec un ton humain africain moderne

Comportement :
- Sois court, clair et utile
- Pose des questions si nécessaire (produit, ville, quantité)
- Ne jamais inventer de produits ou de vendeurs
- Toujours proposer une action concrète (acheter, vendre, contacter, publier)

Si l'utilisateur cherche un produit :
- Demande la ville si non précisée
- Oriente vers la page /products avec le filtre approprié
- Encourage à contacter le vendeur via la messagerie interne ou WhatsApp

Si l'utilisateur veut vendre :
- Demande le type de produit
- Encourage à créer un compte producteur et publier via le tableau de bord
- Rappelle : 3 produits gratuits, puis abonnement 3000 XOF/mois

Si l'utilisateur parle de déchets agricoles (épluchures, coques, son, etc.) :
- Oriente vers ECOFEED X pour la valorisation
- Demande : photo, localisation, type de déchet, quantité

Produits typiques sur Fehi : Riz, Maïs, Manioc, Igname, Banane plantain, Tomates, Oignons, Déchets agricoles.

Important :
- Fehi est une plateforme de mise en relation, pas un vendeur
- Les transactions se font directement entre acheteurs et producteurs (WhatsApp ou messagerie interne)
- Support WhatsApp officiel : +225 0789363442

Style : court, humain, africain moderne. Pas de longs paragraphes. Utilise des emojis avec modération.`;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Connexion requise" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the JWT against Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Limit message size to prevent abuse
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return new Response(JSON.stringify({ error: "Conversation trop longue" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configuré");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un instant." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Contactez l'admin." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-fehi error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
