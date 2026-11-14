import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OFFER } from "@/components/paywall/offer";
import { createCheckout, isPaidCheckout, StripeError, stripeConfigured } from "./stripe";

// Test-only Stripe responses; no request leaves the machine.
const paidSession = {
  id: "cs_test_1",
  status: "complete",
  payment_status: "paid",
  amount_total: OFFER.amountCents,
  metadata: { product: OFFER.metadataProduct },
};

function stubStripe(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("stripeConfigured", () => {
  it("accepts only test-mode keys", () => {
    expect(stripeConfigured()).toBe(true);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_dummy");
    expect(stripeConfigured()).toBe(false);
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(stripeConfigured()).toBe(false);
  });

  it("refuses to call Stripe without a test key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_dummy");
    const fetchMock = stubStripe(paidSession);
    await expect(isPaidCheckout("cs_test_1")).rejects.toMatchObject({ code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("isPaidCheckout", () => {
  it("is true only for a complete, paid MediPlan session", async () => {
    stubStripe(paidSession);
    expect(await isPaidCheckout("cs_test_1")).toBe(true);
  });

  it.each([
    ["unpaid", { payment_status: "unpaid" }],
    ["still open", { status: "open" }],
    ["another amount", { amount_total: 100 }],
    ["another product", { metadata: { product: "something-else" } }],
  ])("is false when the session is %s", async (_, patch) => {
    stubStripe({ ...paidSession, ...patch });
    expect(await isPaidCheckout("cs_test_1")).toBe(false);
  });

  it("reports an unknown session as not found", async () => {
    stubStripe({ error: { message: "No such checkout.session" } }, 404);
    await expect(isPaidCheckout("cs_test_missing")).rejects.toBeInstanceOf(StripeError);
  });
});

describe("createCheckout", () => {
  it("asks for a $49 yearly subscription and returns to the same page", async () => {
    const fetchMock = stubStripe({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });

    const url = await createCheckout("https://mediplan.example", "/result");

    expect(url).toBe("https://checkout.stripe.com/c/pay/cs_test_1");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const form = new URLSearchParams(init.body as URLSearchParams);
    expect(form.get("mode")).toBe("subscription");
    expect(form.get("locale")).toBe("en");
    expect(form.get("adaptive_pricing[enabled]")).toBe("false");
    expect(form.get("line_items[0][price_data][unit_amount]")).toBe("4900");
    expect(form.get("line_items[0][price_data][recurring][interval]")).toBe("year");
    expect(form.get("success_url")).toBe(
      "https://mediplan.example/result?checkout_session={CHECKOUT_SESSION_ID}",
    );
    expect(form.get("cancel_url")).toBe("https://mediplan.example/result");
  });
});
