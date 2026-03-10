import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

async function verifyStripeSignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  const pairs = sigHeader.split(',');
  const timestamp = pairs.find((p) => p.startsWith('t='))?.slice(2);
  const signatures = pairs.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  // Reject events older than 5 minutes
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatures.some((sig) => sig === expected);
}

serve(async (req) => {
  const body = await req.text();
  const sigHeader = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
  if (!valid) {
    console.error('Webhook signature verification failed');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { customerId, pickupDate, pickupTime, items: itemsJson } = pi.metadata;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Idempotency check
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', pi.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const items: Array<{ productId: string; quantity: number }> = JSON.parse(itemsJson);

    const { data: products } = await supabase
      .from('products')
      .select('id, price_cents')
      .in('id', items.map((i) => i.productId));

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
