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

const KU_SPACING = [
  "ku-0",
  "ku-1",
  "ku-2",
  "ku-3",
  "ku-4",
  "ku-5",
  "ku-6",
  "ku-7",
  "ku-8",
  "ku-9",
  "ku-10",
  "ku-11",
  "ku-12",
  "ku-13",
  "ku-14",
  "ku-16",
  "ku-18",
  "ku-20",
  "ku-22",
  "ku-24",
  "ku-28",
  "ku-30",
  "ku-31",
  "ku-32",
  "ku-34",
  "ku-36",
  "ku-40",
  "ku-42",
  "ku-44",
  "ku-48",
  "ku-52",
  "ku-56",
  "ku-60",
  "ku-64",
  "ku-68",
  "ku-72",
  "ku-76",
  "ku-78",
  "ku-88",
  "ku-120",
  "ku-132",
  "ku-180",
  "ku-xs",
  "ku-sm",
  "ku-md",
  "ku-lg",
  "ku-xl",
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: KU_TEXT_SIZES,
      spacing: KU_SPACING,
      radius: [
        "ku-field",
        "ku-image",
        "ku-image-large",
        "ku-control",
        "ku-card",
        "ku-search",
        "ku-sheet",
        "ku-navigation",
        "ku-pill",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
