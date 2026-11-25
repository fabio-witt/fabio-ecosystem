/**
 * Donation link for the VIP page.
 *
 * Put your PayPal.me name here, e.g. 'fabiowitt' for https://paypal.me/fabiowitt.
 * The amount buttons open https://paypal.me/<name>/<amount>EUR.
 * Leave it empty to hide the PayPal buttons.
 */
export const PAYPAL_ME_NAME = 'fabbels';

export const DONATION_AMOUNTS = [3, 5, 10, 25] as const;

export function paypalLink(amount?: number) {
  if (!PAYPAL_ME_NAME) return null;
  const base = `https://paypal.me/${encodeURIComponent(PAYPAL_ME_NAME)}`;
  return amount ? `${base}/${amount}EUR` : base;
}
