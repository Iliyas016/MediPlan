import { connection } from "next/server";
import { isReturnPath } from "@/components/paywall/offer";
import { createCheckout, StripeError, stripeConfigured } from "./stripe";

/**
 * GET  /api/checkout -> { stripe: boolean }
 *      Whether real (test-mode) Stripe checkout is available on this server.
 *
 * POST /api/checkout  { returnPath: "/result" | "/year" | "/pricing" }
 *      -> 200 { url }  hosted Stripe Checkout page for the $49/year plan
 *      -> 4xx/5xx { error, message }
 *
 * After paying, Stripe sends the visitor back to returnPath with
 * ?checkout_session=<id>; the paywall then calls /api/checkout/verify.
 */
export async function GET() {
  // Read the key at request time, not at build time.
  await connection();
  return Response.json({ stripe: stripeConfigured() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { returnPath?: unknown } | null;
  if (!isReturnPath(body?.returnPath)) {
    return Response.json(
      { error: "bad_request", message: "Unknown page to return to after checkout." },
      { status: 400 },
    );
  }

  try {
    const url = await createCheckout(new URL(request.url).origin, body.returnPath);
    return Response.json({ url });
  } catch (error) {
    if (error instanceof StripeError) {
      return Response.json(
        { error: error.code, message: error.message },
        { status: error.code === "not_configured" ? 503 : 502 },
      );
    }
    throw error;
  }
}
