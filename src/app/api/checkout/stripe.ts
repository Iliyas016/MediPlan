import { OFFER, SESSION_PARAM } from "@/components/paywall/offer";

/**
 * The two Stripe calls MediPlan needs, over plain HTTPS: create a hosted
 * Checkout Session and read it back. Test mode only: a live key is refused.
 */
const API = "https://api.stripe.com/v1/checkout/sessions";
const VERSION = "2026-10-28.endive";

export class StripeError extends Error {
  constructor(
    readonly code: "not_configured" | "stripe_unavailable" | "not_found",
    message: string,
  ) {
    super(message);
    this.name = "StripeError";
  }
}

/** True only for a test-mode secret key, so the demo can never take real money. */
export function stripeConfigured(): boolean {
  return /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "");
}

async function call(url: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  if (!stripeConfigured()) {
    throw new StripeError("not_configured", "Payments are not set up on this server.");
  }
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Stripe-Version": VERSION,
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new StripeError("stripe_unavailable", "Could not reach the payment provider. Try again in a minute.");
  }
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (response.status === 404) {
    throw new StripeError("not_found", "This checkout was not found.");
  }
  if (!response.ok) {
    const detail = (body.error as { message?: string } | undefined)?.message ?? `HTTP ${response.status}`;
    console.error("Stripe request failed:", detail);
    throw new StripeError("stripe_unavailable", "The payment provider returned an error. Try again in a minute.");
  }
  return body;
}

/** A hosted Checkout page for the annual subscription. Returns the URL to send the visitor to. */
export async function createCheckout(origin: string, returnPath: string): Promise<string> {
  const back = `${origin}${returnPath}`;
  const form = new URLSearchParams({
    mode: "subscription",
    // A US product: always show English and the dollar price, whatever the visitor's browser says.
    locale: "en",
    "adaptive_pricing[enabled]": "false",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(OFFER.amountCents),
    "line_items[0][price_data][recurring][interval]": OFFER.interval,
    "line_items[0][price_data][product_data][name]": OFFER.name,
    "metadata[product]": OFFER.metadataProduct,
    "subscription_data[metadata][product]": OFFER.metadataProduct,
    success_url: `${back}?${SESSION_PARAM}={CHECKOUT_SESSION_ID}`,
    cancel_url: back,
  });
  const session = await call(API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (typeof session.url !== "string") {
    throw new StripeError("stripe_unavailable", "The payment provider returned an error. Try again in a minute.");
  }
  return session.url;
}

/** Whether this Checkout Session is a completed, paid MediPlan subscription. */
export async function isPaidCheckout(sessionId: string): Promise<boolean> {
  const session = await call(`${API}/${encodeURIComponent(sessionId)}`);
  const metadata = session.metadata as Record<string, string> | null;
  return (
    session.status === "complete" &&
    session.payment_status === "paid" &&
    session.amount_total === OFFER.amountCents &&
    metadata?.product === OFFER.metadataProduct
  );
}
