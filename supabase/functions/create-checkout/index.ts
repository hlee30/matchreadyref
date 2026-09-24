import Stripe from 'npm:stripe@^22';
import { createClient } from 'npm:@supabase/supabase-js@^2';

const origin = 'https://matchreadyref.com';
const cors = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const respond = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return respond({ error: 'Sign in required' }, 401);
  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user?.email) return respond({ error: 'Sign in required' }, 401);
  const { data: paid, error: paidError } = await admin.from('account_entitlements')
    .select('user_id').eq('user_id', user.id).maybeSingle();
  if (paidError) return respond({ error: 'Could not check purchase' }, 500);
  if (paid) return respond({ alreadyPurchased: true });
  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const price = Deno.env.get('STRIPE_PRICE_ID');
  if (!secret || !price) return respond({ error: 'Checkout is not configured yet' }, 503);
  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { user_id: user.id },
      success_url: `${origin}/login.html?payment=success`,
      cancel_url: `${origin}/login.html?payment=cancel`,
    });
    return respond({ url: session.url });
  } catch (error) {
    console.error('Checkout creation failed', error);
    return respond({ error: 'Could not start checkout' }, 500);
  }
});
