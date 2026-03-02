import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validTypes = ['subscription', 'boost'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, email, profileId, productId } = await req.json();
    
    console.log('Creating Paystack payment:', { type, email: email?.substring(0, 3) + '***', profileId });

    // Validate email
    if (!email || typeof email !== 'string' || email.length > 255 || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Email invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate type
    if (!type || !validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: 'Type invalide. Choisissez subscription ou boost' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate profileId
    if (!profileId || !uuidRegex.test(profileId)) {
      return new Response(JSON.stringify({ error: 'ID de profil invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate productId for boost
    if (type === 'boost') {
      if (!productId || !uuidRegex.test(productId)) {
        return new Response(JSON.stringify({ error: 'ID de produit invalide pour le boost' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Pricing in kobo (1 XOF = 100 kobo for Paystack)
    const pricing = {
      'subscription': { amount: 300000, name: 'Abonnement mensuel AgroCI' },  // 3 000 FCFA
      'boost': { amount: 120000, name: 'Boost produit (1 semaine)' },          // 1 200 FCFA
    };

    const selected = pricing[type as keyof typeof pricing];

    const metadata: Record<string, any> = {
      type,
      profile_id: profileId,
      custom_fields: [
        {
          display_name: "Type de paiement",
          variable_name: "payment_type",
          value: selected.name
        }
      ]
    };

    if (type === 'boost' && productId) {
      metadata.product_id = productId;
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        amount: selected.amount,
        currency: 'XOF',
        metadata,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paystack-webhook`
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack API error:', paystackData);
      return new Response(JSON.stringify({ 
        error: paystackData.message || 'Erreur lors de l\'initialisation du paiement'
      }), {
        status: paystackResponse.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Payment initialized successfully:', paystackData.data?.reference);

    return new Response(JSON.stringify({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-paystack-payment function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Une erreur est survenue'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
