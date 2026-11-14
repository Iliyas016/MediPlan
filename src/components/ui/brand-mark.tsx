/** Brand lime of the logo. Fixed in both themes: it is the logo, not a UI state. */
export const BRAND_LIME = "#E0F48E";

/**
 * The MediPlan "M": an M whose right stroke is a highlighter swipe, read as a
 * check mark on a form line. Traced from public/brand/mediplan-m-avatar.png.
 * The dark parts follow the text color, so the mark works in dark mode.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 849 574" aria-hidden className={className}>
      <path fill="currentColor" d="M0 26h196l331 407-109 141-217-269v269H0Z" />
      <path fill="currentColor" d="M651 285 849 47v527H651Z" />
      <path fill={BRAND_LIME} d="M658 0h191v47L527 433 419 299Z" />
    </svg>
  );
}
