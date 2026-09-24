/** Class sets shared by the top-up steps on `TopUpScreen` and `QuestTopUpModal`. */
export const topUpStyles = {
  step: "gap-ku-lg",
  intro: "gap-ku-xs",
  headline: "font-ku-bold text-ku-title text-ku-text-strong",
  description: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  label: "font-ku-semibold text-ku-label text-ku-text-secondary",
  actions: "gap-ku-sm",
  receipt:
    "overflow-hidden rounded-ku-card border border-ku-border bg-ku-surface",
  receiptHero: "gap-ku-xs bg-ku-surface-accent px-ku-md py-ku-lg",
  receiptHeroLabel: "font-ku-semibold text-ku-label text-ku-primary-dark",
  receiptHeroValue: "font-ku-bold text-ku-display-small text-ku-text-strong",
} as const;
