import { SERVICE_KEYS } from "@/lib/domain/plan";
import { REFERENCE_PRICES } from "@/lib/domain/reference-prices";
import { formatUsd, SERVICE_LABELS } from "@/lib/format";

/** The price per service the calculation used, so nothing is a black box. */
export function PricingNotes() {
  return (
    <details className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <summary className="cursor-pointer font-medium">How we priced care</summary>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Deductibles and coinsurance apply to the price your insurer has agreed with in-network
        providers. We use a typical agreed price for each service. Your plan&apos;s prices may
        differ.
      </p>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="py-1 font-normal">Service</th>
            <th className="py-1 text-right font-normal">Typical price</th>
            <th className="py-1 pl-3 text-right font-normal">Source</th>
          </tr>
        </thead>
        <tbody>
          {SERVICE_KEYS.map((key) => {
            const price = REFERENCE_PRICES[key];
            return (
              <tr key={key} className="border-t border-zinc-100 dark:border-zinc-900">
                <td className="py-1.5">
                  {SERVICE_LABELS[key]}
                  <span className="text-zinc-500"> · per {price.unit}</span>
                </td>
                <td className="py-1.5 text-right tabular-nums">{formatUsd(price.allowed)}</td>
                <td className="py-1.5 pl-3 text-right">
                  {price.source ? (
                    <a href={price.source} className="underline underline-offset-4">
                      Link
                    </a>
                  ) : (
                    <span className="text-zinc-500">Estimate</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
}
