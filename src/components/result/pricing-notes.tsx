import { SERVICE_KEYS } from "@/lib/domain/plan";
import { REFERENCE_PRICES } from "@/lib/domain/reference-prices";
import { formatUsd, SERVICE_LABELS } from "@/lib/format";

/** The price per service the calculation used, so nothing is a black box. */
export function PricingNotes() {
  return (
    <details className="group rounded-xl border border-rule bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold">
        How we priced care
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-4 shrink-0 transition-transform duration-200 ease-out group-open:rotate-180"
        >
          <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="space-y-3 px-5 pb-5">
        <p className="max-w-prose text-sm text-ink-soft">
          Deductibles and coinsurance apply to the price your insurer has agreed with in-network
          providers. We use a typical agreed price for each service from published claims research.
          Where we found no reliable public figure, the price is our estimate and marked as such.
          Your plan&apos;s prices may differ.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule-strong text-left text-ink-faint">
              <th className="py-2 font-normal">Service</th>
              <th className="py-2 text-right font-normal">Typical price</th>
              <th className="py-2 pl-3 text-right font-normal">Source</th>
            </tr>
          </thead>
          <tbody>
            {SERVICE_KEYS.map((key) => {
              const price = REFERENCE_PRICES[key];
              return (
                <tr key={key} className="border-b border-rule last:border-0">
                  <td className="py-2">
                    {SERVICE_LABELS[key]}
                    <span className="block text-ink-faint">per {price.unit}</span>
                    {price.measured && (
                      <span className="block max-w-md text-xs text-ink-faint">{price.measured}</span>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatUsd(price.allowed)}</td>
                  <td className="py-2 pl-3 text-right">
                    {price.source ? (
                      <a href={price.source} className="underline">
                        Source
                      </a>
                    ) : (
                      <span className="text-ink-faint">Estimate</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
