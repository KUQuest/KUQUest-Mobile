/** Class strings shared by the Payout sheet steps and the status section. */
const payoutStyles = {
  overlay: "flex-1 justify-end bg-ku-overlay",
  backdrop: "absolute bottom-0 left-0 right-0 top-0",
  sheet: "max-h-[92%] rounded-t-ku-sheet bg-ku-card",
  handle:
    "mb-ku-sm mt-ku-12 h-[4px] w-[40px] self-center rounded-ku-pill bg-ku-border-accent",
  header: "flex-row items-center gap-ku-sm px-ku-20 pb-ku-sm",
  headerTitle: "flex-1 font-ku-bold text-ku-title-small text-ku-text-strong",
  iconBtn:
    "h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface-muted",
  scrollContent: "gap-ku-md px-ku-20 pb-ku-md pt-ku-sm",
  footer:
    "gap-ku-sm border-t border-ku-border-subtle px-ku-20 pb-ku-sm pt-ku-md",
  card: "gap-ku-sm rounded-ku-card border border-ku-border-subtle bg-ku-surface-muted p-ku-14",
  cardTitle: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  row: "flex-row items-center justify-between gap-ku-sm",
  rowLabel: "flex-1 font-ku-medium text-ku-meta text-ku-text-secondary",
  rowValue:
    "flex-[1.5] text-right font-ku-semibold text-ku-meta text-ku-text-strong",
  rowValueStrong: "font-ku-bold text-ku-body text-ku-text-strong",
  divider: "h-px bg-ku-border-subtle",
  note: "font-ku-regular text-ku-meta text-ku-text-secondary",
  noteCentered:
    "text-center font-ku-regular text-ku-meta text-ku-text-secondary",
  hintError: "font-ku-medium text-ku-meta text-ku-danger",
  hintWarning: "font-ku-medium text-ku-meta text-ku-warning-dark",
  centered: "items-center justify-center gap-ku-sm py-ku-lg",
  amountWrap: "items-center gap-ku-sm pt-ku-sm",
  amountRow: "flex-row items-center justify-center gap-ku-xs",
  amountPrefix: "font-ku-bold text-ku-display text-ku-text-secondary",
  amountInput:
    "min-w-[120px] py-ku-0 text-center font-ku-bold text-ku-display text-ku-text-strong",
  availableRow: "flex-row items-center justify-center gap-ku-sm",
  availableText: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  maxChip:
    "min-h-[48px] items-center justify-center rounded-ku-pill border border-ku-primary-border bg-ku-primary-subtle px-ku-md",
  maxChipText: "font-ku-semibold text-ku-control text-ku-primary-dark",
  destinationRow:
    "min-h-[64px] flex-row items-center gap-ku-12 rounded-ku-card border border-ku-border-subtle bg-ku-surface-muted p-ku-14",
  destinationRowEmpty:
    "min-h-[64px] flex-row items-center gap-ku-12 rounded-ku-card border border-dashed border-ku-primary-border bg-ku-primary-subtle p-ku-14",
  eyebrow: "font-ku-medium text-ku-meta text-ku-text-secondary",
  receiptCard:
    "items-center gap-ku-xs rounded-ku-card bg-ku-primary-subtle p-ku-md",
  receiptAmount: "font-ku-bold text-ku-display text-ku-text-strong",
  doneBadge:
    "h-[72px] w-[72px] items-center justify-center rounded-ku-pill bg-ku-surface-success",
  dangerBtn:
    "min-h-[48px] w-full items-center justify-center rounded-ku-pill border-2 border-ku-danger px-ku-md py-ku-14",
  dangerBtnText: "font-ku-semibold text-ku-body text-ku-danger",
  timelineRow: "flex-row gap-ku-12",
  timelineRail: "w-[12px] items-center",
  timelineDot: "mt-ku-6 h-[12px] w-[12px] rounded-ku-pill",
  timelineLine: "w-[2px] flex-1 bg-ku-border-subtle",
  timelineBody: "flex-1 gap-ku-2 pb-ku-md",
  pill: "flex-row items-center gap-ku-sm self-start rounded-ku-pill border px-ku-12 py-ku-xs",
  pillText: "font-ku-semibold text-ku-meta text-ku-text-strong",
  pillDot: "h-[8px] w-[8px] rounded-ku-pill",
} as const;

export default payoutStyles;
