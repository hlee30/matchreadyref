import Stripe from 'npm:stripe@^22';
import { createClient } from 'npm:@supabase/supabase-js@^2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const signature = req.headers.get('Stripe-Signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');
  if (!signature || !secret) return new Response('Missing signature', { status: 400 });
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret,
      undefined, Stripe.createSubtleCryptoProvider());
  } catch (error) {
    console.error('Invalid Stripe signature', error);
    return new Response('Invalid signature', { status: 400 });
  }
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    // A signed event only grants the exact one-time product and price we configured.
    if (session.mode !== 'payment' || session.payment_status !== 'paid' ||
        session.currency !== 'usd' || session.amount_total !== 499 ||
        !session.client_reference_id || session.client_reference_id !== session.metadata?.user_id) {
      return new Response('Ignored', { status: 200 });
    }
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
    if (items.data.length !== 1 || items.data[0].price?.id !== Deno.env.get('STRIPE_PRICE_ID') ||
        items.data[0].quantity !== 1) return new Response('Ignored', { status: 200 });
    const { error } = await admin.from('account_entitlements').upsert({
      user_id: session.client_reference_id,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
    }, { onConflict: 'user_id' });
    if (error) { console.error('Grant failed', error); return new Response('Grant failed', { status: 500 }); }
  }
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    if (charge.refunded && charge.payment_intent) {
      const intent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent.id;
      const { error } = await admin.from('account_entitlements').delete().eq('stripe_payment_intent_id', intent);
      if (error) { console.error('Revocation failed', error); return new Response('Revocation failed', { status: 500 }); }
    }
  }
  return new Response('OK', { status: 200 });
});
