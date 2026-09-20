import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Tailwind v4 derives utilities from the `@theme` block in `src/global.css`, so
 * `--text-ku-body` (font size) and `--color-ku-text-secondary` (colour) both
 * land in the `text-` namespace. Default `tailwind-merge` treats that namespace
 * as one conflict group and deletes the font size:
 * `twMerge("text-ku-title text-ku-text-strong") === "text-ku-text-strong"`.
 *
 * Registering the custom scales splits the group again. Colours need no list —
 * a `text-` suffix that is not a known size falls back to the colour group.
 * Keep these in sync with `src/global.css`.
 */
const KU_TEXT_SIZES = [
  "ku-display",
  "ku-display-small",
  "ku-headline",
  "ku-title-large",
  "ku-title",
  "ku-title-small",
  "ku-section",
  "ku-emphasis-large",
  "ku-subtitle",
  "ku-emphasis",
  "ku-body",
  "ku-control",
  "ku-body-small",
  "ku-meta",
  "ku-label",
  "ku-caption",
  "ku-nav",
  "ku-heading",
];

const KU_SPACING = ["ku-xs", "ku-sm", "ku-md", "ku-lg", "ku-xl"];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: KU_TEXT_SIZES,
      spacing: KU_SPACING,
      radius: ["ku-pill"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
