import type { ReactNode } from "react";
import type { PersonRole } from "@/lib/domain/profile";

/*
 * Line drawings shared by the flow screens, in the same hand as the landing
 * art: an ink outline, paper fills and one highlighter accent.
 */
const Drawing = ({ viewBox, className = "", children }: { viewBox: string; className?: string; children: ReactNode }) => (
  <svg viewBox={viewBox} focusable="false" aria-hidden="true" className={`hero-art__drawing ${className}`}>
    {children}
  </svg>
);

const FIGURE_FILL: Record<PersonRole, string> = {
  adultA: "hero-art__paper",
  adultB: "hero-art__solid",
  child: "hero-art__accent",
};

/** One family member: you in paper, your partner in ink, children in highlighter. */
export function PersonFigure({ role, className = "" }: { role: PersonRole; className?: string }) {
  return (
    <span className={`block shrink-0 ${className}`}>
      <Drawing viewBox="0 0 48 56" className="person-figure">
        <circle cx="24" cy="13" r="9" className={FIGURE_FILL[role]} />
        <path d="M8 54c0-13 7-22 16-22s16 9 16 22Z" className={FIGURE_FILL[role]} />
      </Drawing>
    </span>
  );
}

/** A plan summary sheet. While `scanning`, a highlighter bar sweeps over its lines. */
export function DocumentArt({ scanning = false, className = "" }: { scanning?: boolean; className?: string }) {
  return (
    <span className={`block shrink-0 ${className}`}>
      <Drawing viewBox="0 0 64 80" className="step-art">
        <path d="M12 6h28l14 14v50a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z" className="hero-art__paper" />
        <path d="M40 6v14h14" />
        <rect x="12" y="29" width="40" height="9" rx="2" className={`hero-art__accent ${scanning ? "doc-scan" : ""}`} />
        <path d="M16 33.5h32M16 44h32M16 54.5h22M16 65h28" />
      </Drawing>
    </span>
  );
}

/** A clipboard with a pulse line: the care a family expects. */
export function CareArt() {
  return (
    <Drawing viewBox="0 0 120 96" className="step-art">
      <rect x="32" y="16" width="56" height="70" rx="7" className="hero-art__paper" />
      <rect x="47" y="9" width="26" height="13" rx="5" className="hero-art__solid" />
      <path d="M41 50h10l5-13 9 24 6-11h8" />
      <rect x="41" y="68" width="38" height="8" rx="2" className="hero-art__accent" />
    </Drawing>
  );
}

/** A savings jar: the cushion for a bad year. */
export function CushionArt() {
  return (
    <Drawing viewBox="0 0 120 96" className="step-art">
      <circle cx="60" cy="11" r="7" className="hero-art__accent" />
      <rect x="34" y="26" width="52" height="11" rx="4" className="hero-art__solid" />
      <path d="M38 37h44v41a8 8 0 0 1-8 8H46a8 8 0 0 1-8-8Z" className="hero-art__paper" />
      <ellipse cx="60" cy="76" rx="15" ry="5" className="hero-art__accent" />
      <ellipse cx="60" cy="68" rx="15" ry="5" className="hero-art__accent" />
      <ellipse cx="60" cy="60" rx="15" ry="5" className="hero-art__accent" />
      <path d="M44 46v12" className="hero-art__shine" />
    </Drawing>
  );
}
