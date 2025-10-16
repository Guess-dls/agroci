import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validPlans = ['starter', 'premium', 'pro'];

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

    const { plan, email, profileId } = await req.json();
    
    console.log('Creating Paystack payment for:', { plan, email: email?.substring(0, 3) + '***', profileId });

    // Input validation
    if (!email || typeof email !== 'string' || email.length > 255) {
      return new Response(JSON.stringify({ error: 'Email invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Format d\'email invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!plan || !validPlans.includes(plan)) {
      return new Response(JSON.stringify({ error: 'Plan invalide. Choisissez starter, premium ou pro' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profileId || !uuidRegex.test(profileId)) {
      return new Response(JSON.stringify({ error: 'ID de profil invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Plan pricing (in kobo - Paystack uses kobo for CFA)
    const planPricing = {
      'starter': { amount: 500000, credits: 50, name: 'Pack Starter' },   // 5,000 CFA = 50 crédits
      'premium': { amount: 1000000, credits: 100, name: 'Pack Premium' }, // 10,000 CFA = 100 crédits
      'pro': { amount: 2000000, credits: 200, name: 'Pack Pro' }          // 20,000 CFA = 200 crédits
    };

    const selectedPlan = planPricing[plan as keyof typeof planPricing];

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        amount: selectedPlan.amount,
        currency: 'XOF', // CFA Franc
        metadata: {
          plan: plan,
          credits: selectedPlan.credits,
          profile_id: profileId,
          custom_fields: [
            {
              display_name: "Pack de crédits",
              variable_name: "credit_pack",
              value: selectedPlan.name
            }
          ]
        },
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
