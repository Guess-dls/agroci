import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Read raw body for signature verification
    const body = await req.text();
    
    // CRITICAL SECURITY: Verify Paystack signature BEFORE processing
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      console.error('Missing Paystack signature');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature using HMAC SHA512
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(paystackSecretKey),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );
    
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedSignature !== signature) {
      console.error('Invalid Paystack signature');
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate webhook payload
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.error('Invalid JSON payload:', e);
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Validated webhook received:', data.event);

    // Only process successful charges
    if (data.event !== 'charge.success') {
      console.log('Ignoring non-success event:', data.event);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!data.data?.reference || !data.data?.metadata) {
      console.error('Missing required fields in webhook payload');
      return new Response(JSON.stringify({ error: 'Invalid payload structure' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reference, metadata } = data.data;
    const { plan, credits, profile_id } = metadata;

    // Validate metadata fields
    if (!plan || typeof credits !== 'number' || credits <= 0 || !profile_id) {
      console.error('Invalid metadata:', metadata);
      return new Response(JSON.stringify({ error: 'Invalid metadata' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format for profile_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(profile_id)) {
      console.error('Invalid profile_id format:', profile_id);
      return new Response(JSON.stringify({ error: 'Invalid profile_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if reference already exists (prevent duplicate processing)
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('reference_paiement', reference)
      .maybeSingle();

    if (existingTransaction) {
      console.log('Transaction already processed:', reference);
      return new Response(JSON.stringify({ received: true, message: 'Already processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Double-check payment with Paystack API
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error('Paystack verification failed');
      return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const verificationData = await verifyResponse.json();
    
    if (verificationData.data?.status !== 'success') {
      console.error('Payment not successful:', verificationData.data?.status);
      return new Response(JSON.stringify({ error: 'Payment not successful' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add credits to user profile
    const { error: creditError } = await supabase.rpc('increment_user_credits', {
      user_profile_id: profile_id,
      credits_to_add: credits
    });

    if (creditError) {
      console.error('Error updating user credits:', creditError);
      throw creditError;
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: profile_id,
        type_transaction: 'achat_credits',
        credits_ajoutes: credits,
        montant: verificationData.data.amount / 100, // Convert from kobo to CFA
        description: `Achat de ${credits} crédits (${plan})`,
        statut: 'valide',
        reference_paiement: reference
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      throw transactionError;
    }

    console.log(`Successfully processed payment: ${reference}, added ${credits} credits to ${profile_id}`);

    return new Response(JSON.stringify({ received: true, message: 'Payment processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
