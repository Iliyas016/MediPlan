"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { loadSession, saveSession } from "@/lib/store/session";
import { useSession } from "@/lib/store/use-session";
import { isReturnPath, OFFER, SESSION_PARAM, TEST_CARD, type ReturnPath } from "./offer";

type Phase =
  | { kind: "idle" }
  | { kind: "redirecting" }
  | { kind: "verifying" }
  | { kind: "unlocked" }
  | { kind: "error"; message: string };

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
 * Shows `children` once the visitor has paid, and the paywall otherwise.
 * Use it around the paid parts of /result and /year.
 */
export function PaidGate({ children, returnPath }: { children: ReactNode; returnPath?: ReturnPath }) {
  const session = useSession();
  if (!session) return null;
  return session.paid ? <>{children}</> : <Paywall returnPath={returnPath} />;
}

/**
 * The $49/year offer with a Stripe test-mode checkout. When Stripe sends the
 * visitor back, it asks the server to verify the Checkout Session and only
 * then marks the session as paid. Without a Stripe key on the server it offers
 * a clearly labelled demo unlock instead, so the button is never dead.
 */
export function Paywall({ returnPath }: { returnPath?: ReturnPath }) {
  const pathname = usePathname();
  const paid = useSession()?.paid === true;
  const back: ReturnPath = returnPath ?? (isReturnPath(pathname) ? pathname : "/result");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
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

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(SESSION_PARAM);
    if (!sessionId) return;
    let active = true;
    const run = async () => {
      setPhase({ kind: "verifying" });
      try {
        const response = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`);
        if (!active) return;
        if (!response.ok) {
          setPhase({ kind: "error", message: await messageOf(response, "We could not confirm the payment.") });
          return;
        }
        const { paid } = (await response.json()) as { paid?: boolean };
        dropSessionParam();
        if (paid) {
          setPhase({ kind: "unlocked" });
          unlock();
        } else {
          setPhase({ kind: "error", message: "The payment was not completed. You have not been charged." });
        }
      } catch {
        if (active) setPhase({ kind: "error", message: "We could not confirm the payment. Check your connection and reload the page." });
      }
    };
    void run();
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

  const busy = phase.kind === "redirecting" || phase.kind === "verifying";

  return (
    <section aria-labelledby="paywall-title" className="space-y-5 rounded-xl border border-rule-strong bg-surface px-4 py-6 sm:px-6">
      <div className="space-y-2">
        <h2 id="paywall-title" className="text-2xl font-extrabold">
          See the whole picture
        </h2>
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tabular-nums">${OFFER.priceUsd}</span>
          <span className="text-ink-faint">per year, for the whole family</span>
        </p>
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

      {phase.kind === "verifying" && (
        <p role="status" className="text-sm text-ink-faint">
          Confirming your payment with Stripe…
        </p>
      )}
      {phase.kind === "unlocked" && (
        <p role="status" className="rounded-lg bg-save-wash px-4 py-3 text-sm text-save">
          Payment confirmed. Everything is unlocked in this browser.
        </p>
      )}
      {phase.kind === "error" && (
        <p role="alert" className="rounded-lg bg-risk-wash px-4 py-3 text-sm">
          {phase.message}
        </p>
      )}

      {paid && phase.kind !== "unlocked" && (
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
        Pay with Stripe&apos;s test card{" "}
        <span className="font-semibold whitespace-nowrap tabular-nums">{TEST_CARD.number}</span>,{" "}
        {TEST_CARD.expiry}, {TEST_CARD.cvc}, {TEST_CARD.zip}.
      </p>
      <button
        type="button"
        onClick={copy}
        className="cursor-pointer font-medium underline underline-offset-4"
      >
        {copied ? "Card number copied" : "Copy card number"}
      </button>
    </div>
  );
}
