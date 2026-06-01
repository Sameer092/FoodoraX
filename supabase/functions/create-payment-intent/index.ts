import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { amount, currency = 'usd' } = await req.json();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    let customerId: string;
    const existingCustomers = await stripe.customers.list({ email: profile?.email, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: profile?.email,
        name: profile?.full_name,
        metadata: { supabase_uid: user.id },
      });
      customerId = customer.id;
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
    });

    return new Response(JSON.stringify({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
