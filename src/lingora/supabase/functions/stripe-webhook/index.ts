// Stripe → Lingora Plus.
//
// Stripe calls this function after a checkout and whenever a subscription
// changes. It verifies Stripe's signature and then switches Plus on or off
// in public.plus_members. Deploy with JWT verification OFF (Stripe cannot
// send a Supabase token); the signature check below is the protection.
//
// Secrets (supabase secrets set …):
//   STRIPE_WEBHOOK_SECRET  – "whsec_…" of the webhook endpoint
//   STRIPE_SECRET_KEY      – restricted key that may read subscriptions
//   STRIPE_LIFETIME_LINK   – optional, "plink_…" id of the lifetime Payment Link
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const encoder = new TextEncoder();

async function validSignature(payload: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((part) => part.split('=') as [string, string]));
  const timestamp = Number(parts.t);
  // Reject events older than five minutes (replay protection).
  if (!timestamp || !parts.v1 || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${parts.t}.${payload}`));
  const expected = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (expected.length !== parts.v1.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ parts.v1.charCodeAt(index);
  return difference === 0;
}

async function subscriptionEnd(subscriptionId: string, stripeKey: string) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!response.ok) throw new Error(`Stripe subscription lookup failed (${response.status}).`);
  const subscription = await response.json();
  const end = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  // Two days of grace so a renewal that arrives late does not interrupt Plus.
  return end ? new Date((end + 2 * 86400) * 1000).toISOString() : null;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!webhookSecret || !stripeKey) return new Response('Stripe is not configured.', { status: 503 });

  // Optional: id of the lifetime Payment Link ("plink_…"), not a secret.
  const lifetimeLink = Deno.env.get('STRIPE_LIFETIME_LINK');
  const payload = await request.text();
  if (!(await validSignature(payload, request.headers.get('stripe-signature'), webhookSecret))) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(payload);
  const object = event.data?.object ?? {};
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    if (event.type === 'checkout.session.completed' && object.mode === 'subscription') {
      const userId = object.client_reference_id;
      const subscriptionId = object.subscription;
      if (!/^[0-9a-f-]{36}$/i.test(userId ?? '') || !subscriptionId) {
        return Response.json({ ignored: 'checkout without a Lingora user' });
      }
      const { error } = await admin.from('plus_members').upsert({
        user_id: userId, tier: 'plus', source: 'stripe', external_id: subscriptionId,
        started_at: new Date().toISOString(), expires_at: await subscriptionEnd(subscriptionId, stripeKey),
      });
      if (error) throw error;
    } else if (event.type === 'checkout.session.completed' && object.mode === 'payment'
      && object.payment_status === 'paid' && lifetimeLink && object.payment_link === lifetimeLink) {
      // Lifetime Plus: a one-time payment through the lifetime Payment Link.
      const userId = object.client_reference_id;
      if (!/^[0-9a-f-]{36}$/i.test(userId ?? '')) return Response.json({ ignored: 'payment without a Lingora user' });
      const { error } = await admin.from('plus_members').upsert({
        user_id: userId, tier: 'plus', source: 'stripe', external_id: object.id,
        started_at: new Date().toISOString(), expires_at: null,
      });
      if (error) throw error;
    } else if (event.type === 'invoice.paid' && (object.subscription || object.parent?.subscription_details?.subscription)) {
      // Renewal: move the end date forward. Newer Stripe API versions keep the
      // subscription id under parent.subscription_details.
      const subscriptionId = object.subscription ?? object.parent.subscription_details.subscription;
      const { error } = await admin.from('plus_members')
        .update({ expires_at: await subscriptionEnd(subscriptionId, stripeKey) })
        .eq('external_id', subscriptionId);
      if (error) throw error;
    } else if (event.type === 'customer.subscription.deleted') {
      const { error } = await admin.from('plus_members')
        .update({ expires_at: new Date().toISOString() })
        .eq('external_id', object.id);
      if (error) throw error;
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('stripe-webhook', error);
    // A 500 makes Stripe retry later.
    return new Response('Could not update the membership.', { status: 500 });
  }
});
