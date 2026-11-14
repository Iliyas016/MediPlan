"use client";

import { useLayoutEffect, useRef } from "react";

const DURATION_MS = 900;
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * A figure that counts up from zero when it first appears. It renders the
 * final value, so it reads right without JavaScript; screen readers get the
 * final value only. The animation rewrites the visible text, and is skipped
 * when the visitor prefers reduced motion.
 */
export function CountUp({
  value,
  format,
  className = "",
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      el.textContent = format(value * easeOutExpo(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    el.textContent = format(0);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = format(value);
    };
  }, [value, format]);

  return (
    <span className={`tabular-nums ${className}`}>
      <span ref={ref} aria-hidden>
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
