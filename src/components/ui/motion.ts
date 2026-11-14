import type { CSSProperties } from "react";

/** Place in an entrance sequence, read by the .enter, .draw and .grow classes. */
export function stagger(i: number, style: CSSProperties = {}): CSSProperties {
  return { ...style, ["--i" as string]: i };
}
