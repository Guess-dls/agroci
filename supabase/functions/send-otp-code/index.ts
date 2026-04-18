import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, type } = await req.json();
    if (!email || !["signup", "recovery"].includes(type)) {
      return new Response(JSON.stringify({ error: "Paramètres invalides" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const emailLower = email.toLowerCase().trim();

    // Anti-spam : vérifier qu'aucun code n'a été envoyé dans les 60 dernières secondes
    const { data: recent } = await supabase
      .from("verification_codes")
      .select("created_at")
      .eq("email", emailLower)
      .eq("type", type)
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .limit(1);

    if (recent && recent.length > 0) {
      return new Response(
        JSON.stringify({ error: "Veuillez attendre 60 secondes avant de demander un nouveau code" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pour 'recovery', vérifier que l'utilisateur existe
    if (type === "recovery") {
      const { data: users } = await supabase.auth.admin.listUsers();
      const exists = users?.users?.some((u) => u.email?.toLowerCase() === emailLower);
      if (!exists) {
        // Réponse silencieuse pour ne pas révéler l'existence des comptes
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Invalider les anciens codes non consommés
    await supabase
      .from("verification_codes")
      .update({ consumed: true })
      .eq("email", emailLower)
      .eq("type", type)
      .eq("consumed", false);

    // Insérer le nouveau code
    const { error: insertError } = await supabase.from("verification_codes").insert({
      email: emailLower,
      code_hash: codeHash,
      type,
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    // Envoyer l'email via la fonction send-email existante
    const subject = type === "signup" ? "Code de vérification Fehi" : "Réinitialisation de mot de passe Fehi";
    const html = `
      <!DOCTYPE html>
      <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #16a34a, #f59e0b); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Fehi</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <h2 style="color: #16a34a;">${type === "signup" ? "Bienvenue sur Fehi !" : "Réinitialisation de mot de passe"}</h2>
          <p>Votre code de vérification est :</p>
          <div style="background: #f0fdf4; border: 2px dashed #16a34a; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      </body></html>
    `;

    // Envoyer l'email via Resend directement
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY non configurée");
      return new Response(JSON.stringify({ error: "Service email non configuré. Contactez l'administrateur." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Fehi <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend send failed:", errText);
      return new Response(JSON.stringify({ error: "Échec d'envoi de l'email. Vérifiez votre adresse." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-otp-code error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
