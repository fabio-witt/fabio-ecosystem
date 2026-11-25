/**
 * Lingora Plus prices and checkout.
 *
 * Checkout uses Stripe Payment Links (no card data ever touches Lingora):
 * 1. Create two subscription Payment Links in the Stripe dashboard.
 * 2. Paste their URLs below.
 * 3. Deploy supabase/functions/stripe-webhook and set its two secrets
 *    (see docs/monetization.md). The webhook switches Plus on and off.
 *
 * While the links are empty the Plus page shows "coming soon" and nobody can pay.
 */
export const PLUS_CHECKOUT = {
  monthly: { url: '', price: 'CHF 9.90', per: 'month' },
  /** Set a 7-day free trial on this Payment Link in Stripe. */
  yearly: { url: '', price: 'CHF 59.90', per: 'year', note: 'Save 50%', monthly: 'CHF 4.99 / month', trial: '7 days free' },
  /** One-time payment, no subscription. Limited founder offer. */
  lifetime: { url: '', price: 'CHF 149', per: 'once', note: 'Founder offer' },
  /** Stripe customer portal link, so members can cancel themselves. */
  manageUrl: '',
} as const;

export const plusCheckoutReady = !!PLUS_CHECKOUT.monthly.url || !!PLUS_CHECKOUT.yearly.url || !!PLUS_CHECKOUT.lifetime.url;

/** Free-lesson limits only apply once people can actually buy Plus. */
export const paywallActive = plusCheckoutReady;

/** Adds the user id (to grant Plus to the right account) and the email to a payment link. */
export function checkoutUrl(base: string, userId: string, email?: string | null) {
  const url = new URL(base);
  url.searchParams.set('client_reference_id', userId);
  if (email) url.searchParams.set('prefilled_email', email);
  return url.toString();
}

/** What Plus members get today. Only list benefits that really work. */
export const PLUS_BENEFITS: [icon: string, title: string, text: string][] = [
  ['🚀', 'All levels, no daily limit', 'Every lesson from A1 to C2 in all languages, as many as you like.'],
  ['♾️', 'Unlimited hearts', 'Keep learning after mistakes. No waiting, no interruptions.'],
  ['🤖', '150 AI conversations a day', 'Role-play cafés, job interviews and more with gentle corrections (free: 10).'],
  ['💎', 'Double gems and season rewards', 'Every lesson, chest and season tier gives twice as much.'],
  ['👒', 'Exclusive Fabio outfits', 'Hats and glasses only Plus members can wear.'],
  ['✦', 'Plus badge on your profile', 'Show partners that you support Lingora.'],
];

/** Free vs Plus, for the comparison table. */
export const PLAN_COMPARISON: [feature: string, free: string, plus: string][] = [
  ['A1 lessons in every language', '✓', '✓'],
  ['Lessons from A2 to C2', '3 a day', '∞'],
  ['Hearts', '5', '∞'],
  ['AI conversation partner', '10 a day', '150 a day'],
  ['Word stations, reviews, level tests', '✓', '✓'],
  ['Partners, chats, forum, live rooms', '✓', '✓'],
  ['Gems and season rewards', '×1', '×2'],
  ['Plus outfits and badge', '–', '✓'],
];
