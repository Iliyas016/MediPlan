import type { ReactNode } from "react";

/** Small line drawings for the three steps, in the same hand as the hero art. */
const Drawing = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 120 96" focusable="false" aria-hidden="true" className="hero-art__drawing step-art">
    {children}
  </svg>
);

/** Two plan summaries, one from each job. */
export function PlansArt() {
  return (
    <Drawing>
      <g transform="rotate(-8 44 50)">
        <rect x="18" y="14" width="50" height="66" rx="6" className="hero-art__paper" />
        <path d="M27 30h32M27 40h24M27 50h32M27 60h18" />
      </g>
      <g transform="rotate(6 76 50)">
        <path
          d="M54 12h32l12 12v52a6 6 0 0 1-6 6H54a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6Z"
          className="hero-art__paper"
        />
        <path d="M86 12v12h12" />
        <rect x="56" y="34" width="34" height="8" rx="2" className="hero-art__accent" />
        <path d="M56 50h34M56 59h22" />
        <rect x="56" y="66" width="22" height="10" rx="3" className="hero-art__solid" />
      </g>
    </Drawing>
  );
}

/** Two adults and a child. */
export function FamilyArt() {
  return (
    <Drawing>
      <circle cx="38" cy="28" r="10" className="hero-art__paper" />
      <path d="M20 84c0-16 8-27 18-27s18 11 18 27Z" className="hero-art__paper" />
      <circle cx="82" cy="28" r="10" className="hero-art__solid" />
      <path d="M64 84c0-16 8-27 18-27s18 11 18 27Z" className="hero-art__solid" />
      <circle cx="60" cy="50" r="7" className="hero-art__accent" />
      <path d="M48 84c0-11 5-19 12-19s12 8 12 19Z" className="hero-art__accent" />
    </Drawing>
  );
}

/** A receipt with the total marked and a tick on its corner. */
export function AnswerArt() {
  return (
    <Drawing>
      <path d="M32 12h52v70l-8.7-6-8.6 6-8.7-6-8.7 6-8.6-6-8.7 6Z" className="hero-art__paper" />
      <path d="M42 28h32M42 38h32M42 48h20" />
      <rect x="42" y="56" width="32" height="10" rx="2" className="hero-art__accent" />
      <circle cx="86" cy="22" r="14" className="hero-art__solid" />
      <path d="m79.5 22 5 5 8.5-10" className="step-art__tick" />
    </Drawing>
  );
}
