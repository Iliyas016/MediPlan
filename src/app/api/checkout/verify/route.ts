import { isPaidCheckout, StripeError } from "../stripe";

/**
 * GET /api/checkout/verify?session_id=cs_test_...
 *   -> 200 { paid: boolean }
 *   -> 4xx/5xx { error, message }
 *
 * Asks Stripe whether the Checkout Session is a completed, paid MediPlan
 * subscription. The paywall sets `paid: true` in the session only after this
 * says so.
 */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) {
    return Response.json({ error: "bad_request", message: "Missing or invalid checkout id." }, { status: 400 });
  }

  try {
    return Response.json({ paid: await isPaidCheckout(sessionId) });
  } catch (error) {
    if (error instanceof StripeError) {
      const status = error.code === "not_configured" ? 503 : error.code === "not_found" ? 404 : 502;
      return Response.json({ error: error.code, message: error.message }, { status });
    }
    throw error;
  }
}
