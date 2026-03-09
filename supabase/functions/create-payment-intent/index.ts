import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { items, pickupDate, pickupTime } = await req.json();

    if (!items || !items.length || !pickupDate || !pickupTime) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch products from DB to get authoritative prices
    const productIds = items.map((i: any) => i.productId);
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price_cents, daily_limit, is_active')
      .in('id', productIds);

    if (productsError) throw productsError;

    // Validate all products exist and are active
    for (const item of items) {
      const product = products?.find((p: any) => p.id === item.productId);
      if (!product || !product.is_active) {
        return new Response(JSON.stringify({ error: `Product ${item.productId} is unavailable` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check daily limits
    for (const product of products ?? []) {
      const { data: usageData } = await supabaseAdmin
        .from('order_items')
        .select('quantity, orders!inner(pickup_date, status)')
        .eq('product_id', product.id)
        .eq('orders.pickup_date', pickupDate)
        .neq('orders.status', 'cancelled');

      const alreadyOrdered = usageData?.reduce((sum: number, row: any) => sum + row.quantity, 0) ?? 0;
      const requestedQty = items.find((i: any) => i.productId === product.id)?.quantity ?? 0;

      if (alreadyOrdered + requestedQty > product.daily_limit) {
        return new Response(JSON.stringify({ error: `"${product.name}" exceeds daily limit for this date` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Calculate total from DB prices (never trust client)
    const totalCents = items.reduce((sum: number, item: any) => {
      const product = products?.find((p: any) => p.id === item.productId);
      return sum + (product?.price_cents ?? 0) * item.quantity;
    }, 0);

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      metadata: {
        customerId: user.id,
        pickupDate,
        pickupTime,
        items: JSON.stringify(items),
      },
    });

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
