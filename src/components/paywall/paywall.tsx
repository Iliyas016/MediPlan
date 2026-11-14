"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { loadSession, saveSession } from "@/lib/store/session";
import { useSession } from "@/lib/store/use-session";
import { isReturnPath, OFFER, SESSION_PARAM, TEST_CARD, type ReturnPath } from "./offer";

/** What happened to a checkout the visitor just came back from. */
type ReturnState =
  | { kind: "none" }
  | { kind: "verifying" }
  | { kind: "confirmed" }
  | { kind: "failed"; message: string };

type CheckoutPhase = { kind: "idle" } | { kind: "redirecting" } | { kind: "error"; message: string };

const unlock = () => saveSession({ ...loadSession(), paid: true });

/** Removes ?checkout_session=… from the address bar without reloading. */
function dropSessionParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(SESSION_PARAM);
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

async function messageOf(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  return typeof body?.message === "string" ? body.message : fallback;
}

/**
 * When Stripe sends the visitor back with ?checkout_session=…, asks the server
 * to verify that Checkout Session and only then marks the session as paid.
 */
function useCheckoutReturn(enabled: boolean): ReturnState {
  const [state, setState] = useState<ReturnState>({ kind: "none" });

  useEffect(() => {
    if (!enabled) return;
    const sessionId = new URLSearchParams(window.location.search).get(SESSION_PARAM);
    if (!sessionId) return;
    let active = true;
    const run = async () => {
      setState({ kind: "verifying" });
      try {
        const response = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`);
        if (!active) return;
        if (!response.ok) {
          setState({ kind: "failed", message: await messageOf(response, "We could not confirm the payment.") });
          return;
        }
        const { paid } = (await response.json()) as { paid?: boolean };
        if (!active) return;
        dropSessionParam();
        if (paid) {
          setState({ kind: "confirmed" });
          unlock();
        } else {
          setState({ kind: "failed", message: "The payment was not completed. You have not been charged." });
        }
      } catch {
        if (active) {
          setState({
            kind: "failed",
            message: "We could not confirm the payment. Check your connection and reload the page.",
          });
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [enabled]);

  return state;
}

/**
 * Shows `children` once the visitor has paid, and the paywall otherwise.
 * Wrap the paid parts of a page in it. `teaser` is one sentence about what is
 * behind the paywall on this page, built from the visitor's own result.
 */
export function PaidGate({
  children,
  returnPath,
  teaser,
  title,
}: {
  children: ReactNode;
  returnPath?: ReturnPath;
  teaser?: string;
  /** Pass when the paywall is the whole page: it becomes the page's h1. */
  title?: string;
}) {
  const session = useSession();
  const back = useCheckoutReturn(true);
  if (!session) return null;
  if (!session.paid) {
    return <Paywall returnPath={returnPath} teaser={teaser} title={title} returnState={back} />;
  }
  return (
    <>
      {back.kind === "confirmed" && (
        <p role="status" className="rounded-lg bg-save-wash px-4 py-3 text-save">
          Payment confirmed. Welcome to MediPlan Family: everything below is unlocked in this browser.
        </p>
      )}
      {children}
    </>
  );
}

/**
 * The $49/year offer with a Stripe test-mode checkout. Without a Stripe key on
 * the server it offers a clearly labelled demo unlock instead, so the button is
 * never dead. Inside PaidGate it gets the checkout return state from the gate;
 * on its own it checks for a returning checkout itself.
 */
export function Paywall({
  returnPath,
  teaser,
  title,
  returnState,
}: {
  returnPath?: ReturnPath;
  teaser?: string;
  /** Pass when the paywall is the whole page: it becomes the page's h1. */
  title?: string;
  returnState?: ReturnState;
}) {
  const Heading = title ? "h1" : "h2";
  const pathname = usePathname();
  const paid = useSession()?.paid === true;
  const back: ReturnPath = returnPath ?? (isReturnPath(pathname) ? pathname : "/result");
  const ownReturn = useCheckoutReturn(returnState === undefined);
  const returning = returnState ?? ownReturn;
  const [phase, setPhase] = useState<CheckoutPhase>({ kind: "idle" });
  const [stripe, setStripe] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/checkout")
      .then((r) => r.json() as Promise<{ stripe?: boolean }>)
      .then((body) => active && setStripe(body.stripe === true))
      .catch(() => active && setStripe(false));
    return () => {
      active = false;
    };
  }, []);

  const checkout = async () => {
    setPhase({ kind: "redirecting" });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: back }),
      });
      if (!response.ok) {
        setPhase({ kind: "error", message: await messageOf(response, "Checkout is unavailable right now.") });
        return;
      }
      const { url } = (await response.json()) as { url: string };
      window.location.assign(url);
    } catch {
      setPhase({ kind: "error", message: "Checkout is unavailable right now. Check your connection and try again." });
    }
  };

  const busy = phase.kind === "redirecting" || returning.kind === "verifying";

  return (
    <section aria-labelledby="paywall-title" className="space-y-5 rounded-xl border border-rule-strong bg-surface px-4 py-6 sm:px-6">
      <div className="space-y-2">
        <Heading id="paywall-title" className={title ? "text-3xl font-extrabold sm:text-4xl" : "text-2xl font-extrabold"}>
          {title ?? "See the whole picture"}
        </Heading>
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tabular-nums">${OFFER.priceUsd}</span>
          <span className="text-ink-faint">per year, for the whole family</span>
        </p>
        {teaser && <p className="text-ink-soft">{teaser}</p>}
      </div>

      <ul className="space-y-2">
        {OFFER.includes.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden className="mt-0.5 text-save">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {returning.kind === "verifying" && (
        <p role="status" className="text-sm text-ink-faint">
          Confirming your payment with Stripe…
        </p>
      )}
      {returning.kind === "confirmed" && (
        <p role="status" className="rounded-lg bg-save-wash px-4 py-3 text-sm text-save">
          Payment confirmed. Everything is unlocked in this browser.
        </p>
      )}
      {returning.kind === "failed" && (
        <p role="alert" className="rounded-lg bg-risk-wash px-4 py-3 text-sm">
          {returning.message}
        </p>
      )}
      {phase.kind === "error" && (
        <p role="alert" className="rounded-lg bg-risk-wash px-4 py-3 text-sm">
          {phase.message}
        </p>
      )}

      {paid && returning.kind !== "confirmed" && (
        <p className="rounded-lg bg-save-wash px-4 py-3 text-sm text-save">
          You have full access in this browser.
        </p>
      )}

      {!paid && stripe === true && (
        <div className="space-y-4">
          <Button type="button" onClick={checkout} disabled={busy} className="w-full sm:w-auto">
            {phase.kind === "redirecting" ? "Opening checkout…" : `Pay $${OFFER.priceUsd} with Stripe`}
          </Button>
          <TestCard />
        </div>
      )}

      {!paid && stripe === false && (
        <div className="space-y-3">
          <p className="text-sm text-ink-faint">
            Payments are not connected on this server yet. This demo button unlocks everything without
            charging you.
          </p>
          <Button type="button" variant="secondary" onClick={unlock} className="w-full sm:w-auto">
            Unlock demo (no payment)
          </Button>
        </div>
      )}
    </section>
  );
}

function TestCard() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(TEST_CARD.number.replace(/\s/g, ""))
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-rule-strong px-4 py-3 text-sm">
      <p className="font-semibold">Test mode: no real money is charged</p>
      <p>
        Pay with Stripe’s test card{" "}
        <span className="font-semibold whitespace-nowrap tabular-nums">{TEST_CARD.number}</span>,{" "}
        {TEST_CARD.expiry}, {TEST_CARD.cvc}, {TEST_CARD.zip}.
      </p>
      <button
        type="button"
        onClick={copy}
        className="cursor-pointer py-3 font-medium underline underline-offset-4"
      >
        {copied ? "Card number copied" : "Copy card number"}
      </button>
    </div>
  );
}
