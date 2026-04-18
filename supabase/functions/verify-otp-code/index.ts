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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, code, type, newPassword } = await req.json();

    if (!email || !code || !["signup", "recovery"].includes(type)) {
      return new Response(JSON.stringify({ error: "Paramètres invalides" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "recovery" && (!newPassword || newPassword.length < 6)) {
      return new Response(JSON.stringify({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const emailLower = email.toLowerCase().trim();
    const codeHash = await hashCode(code.toString().trim());

    // Récupérer le dernier code non consommé
    const { data: codes } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", emailLower)
      .eq("type", type)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!codes || codes.length === 0) {
      return new Response(JSON.stringify({ error: "Aucun code valide trouvé. Demandez un nouveau code." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const record = codes[0];

    // Vérifier l'expiration
    if (new Date(record.expires_at) < new Date()) {
      await supabase.from("verification_codes").update({ consumed: true }).eq("id", record.id);
      return new Response(JSON.stringify({ error: "Code expiré. Demandez un nouveau code.", expired: true }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérifier le nombre de tentatives
    if (record.attempts >= 5) {
      await supabase.from("verification_codes").update({ consumed: true }).eq("id", record.id);
      return new Response(JSON.stringify({ error: "Trop de tentatives. Demandez un nouveau code." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérifier le code
    if (record.code_hash !== codeHash) {
      await supabase
        .from("verification_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);
      return new Response(
        JSON.stringify({ error: `Code incorrect. ${4 - record.attempts} tentative(s) restante(s).` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Code valide → consommer
    await supabase.from("verification_codes").update({ consumed: true }).eq("id", record.id);

    // Trouver l'utilisateur
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const user = usersList?.users?.find((u) => u.email?.toLowerCase() === emailLower);

    if (!user) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "signup") {
      // Confirmer l'email + marquer profil comme vérifié
      await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
      await supabase.from("profiles").update({ email_verified: true }).eq("user_id", user.id);
    } else if (type === "recovery") {
      // Mettre à jour le mot de passe
      const { error: pwError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
      if (pwError) throw pwError;
      // S'assurer que l'email est confirmé
      await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
      await supabase.from("profiles").update({ email_verified: true }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("verify-otp-code error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
