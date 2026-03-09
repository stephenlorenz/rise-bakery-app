import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { customerId, pickupDate, pickupTime, items: itemsJson } = pi.metadata;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if order already created (idempotency)
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', pi.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const items: Array<{ productId: string; quantity: number }> = JSON.parse(itemsJson);

    // Fetch authoritative prices
    const { data: products } = await supabase
      .from('products')
      .select('id, price_cents')
      .in('id', items.map((i) => i.productId));

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        total_cents: pi.amount,
        stripe_payment_intent_id: pi.id,
        status: 'confirmed',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      return new Response(JSON.stringify({ error: orderError.message }), { status: 500 });
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price_cents: products?.find((p: any) => p.id === item.productId)?.price_cents ?? 0,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
