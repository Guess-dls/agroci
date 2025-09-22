import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    // Handle Paystack webhook
    const body = await req.text();
    const data = JSON.parse(body);
    
    console.log('Paystack webhook received:', data);

    if (data.event === 'charge.success') {
      const { reference, metadata, customer } = data.data;
      const { plan, profile_id } = metadata;
      
      console.log('Processing successful payment:', { reference, plan, profile_id });

      // Verify the transaction with Paystack
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.status && verifyData.data.status === 'success') {
        // Calculate subscription end date based on plan
        const now = new Date();
        const endDate = new Date(now);
        
        if (plan === 'premium') {
          endDate.setMonth(endDate.getMonth() + 1); // 1 month
        } else if (plan === 'pro') {
          endDate.setMonth(endDate.getMonth() + 3); // 3 months
        }

        // Update or create subscription
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: profile_id,
            plan: plan,
            status: 'actif',
            start_date: now.toISOString(),
            end_date: endDate.toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }

        console.log('Subscription updated successfully for profile:', profile_id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in paystack-webhook function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});