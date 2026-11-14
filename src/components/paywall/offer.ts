/** The one thing MediPlan sells. Shared by the paywall UI and the checkout route. */
export const OFFER = {
  name: "MediPlan Family, annual",
  priceUsd: 49,
  /** Stripe amounts are in cents. */
  amountCents: 4900,
  interval: "year",
  /** Stamped on every Checkout Session so verification can tell it is ours. */
  metadataProduct: "mediplan-annual",
  includes: [
    "Every way to cover your family, side by side",
    "The bad-year stress test: what a surprise hospital stay would cost on each plan",
    "The plan-year tracker: progress toward your deductible, logged bills and key dates",
  ],
} as const;

/** Stripe's published test card. Shown on screen so anyone can try the checkout. */
export const TEST_CARD = {
  number: "4242 4242 4242 4242",
  expiry: "any future date",
  cvc: "any 3 digits",
  zip: "any ZIP",
} as const;

/** Pages the checkout may send the visitor back to. */
export const RETURN_PATHS = ["/result", "/year", "/pricing"] as const;
export type ReturnPath = (typeof RETURN_PATHS)[number];

export const isReturnPath = (value: unknown): value is ReturnPath =>
  typeof value === "string" && (RETURN_PATHS as readonly string[]).includes(value);

/** Query parameter Stripe appends on the way back, holding the Checkout Session id. */
export const SESSION_PARAM = "checkout_session";
