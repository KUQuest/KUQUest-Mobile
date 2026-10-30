/** Class strings shared by the Payout destination and request modals. */
const payoutStyles = {
  modalOverlay: "flex-1 justify-end bg-ku-overlay",
  modalCard:
    "max-h-[90%] rounded-tl-[24px] rounded-tr-[24px] bg-ku-surface pb-ku-lg",
  header:
    "flex-row items-center justify-between gap-ku-sm border-b border-ku-border-subtle px-ku-20 pb-ku-14 pt-ku-18",
  headerTitle: "flex-1 font-ku-bold text-ku-emphasis text-ku-text-strong",
  closeBtn:
    "h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface-muted",
  scrollContent: "gap-ku-md px-ku-20 pb-ku-md pt-ku-md",
  desc: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  card: "gap-ku-sm rounded-[16px] border border-ku-border-subtle bg-ku-surface-muted p-ku-14",
  cardTitle: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  row: "flex-row items-center justify-between gap-ku-sm",
  rowLabel: "flex-1 font-ku-medium text-ku-meta text-ku-text-secondary",
  rowValue:
    "flex-[1.5] text-right font-ku-semibold text-ku-meta text-ku-text-strong",
  rowValueStrong: "font-ku-bold text-ku-body text-ku-text-strong",
  note: "font-ku-regular text-ku-meta text-ku-text-secondary",
  hintError: "font-ku-medium text-ku-meta text-ku-danger",
  hintWarning: "font-ku-medium text-ku-meta text-ku-warning-dark",
  centered: "items-center justify-center gap-ku-sm py-ku-lg",
  inputLabel:
    "mb-ku-sm font-ku-semibold text-ku-body-small text-ku-text-strong",
  inputWrap:
    "min-h-[52px] flex-row items-center rounded-[14px] border-[1.5px] border-ku-border bg-ku-surface px-ku-14",
  inputWrapError: "border-ku-danger",
  inputWrapDisabled: "bg-ku-surface-muted opacity-70",
  inputPrefix: "mr-ku-6 font-ku-bold text-ku-subtitle text-ku-text-strong",
  textInput:
    "min-h-[48px] flex-1 py-ku-0 font-ku-bold text-ku-subtitle text-ku-text-strong",
  actionRow: "gap-ku-10",
  primaryBtn:
    "min-h-[50px] flex-row items-center justify-center gap-ku-sm rounded-[14px] bg-ku-worker-deep px-ku-md",
  primaryBtnDisabled: "bg-ku-text-muted",
  primaryBtnText: "font-ku-semibold text-ku-control text-ku-on-worker",
  secondaryBtn:
    "min-h-[48px] items-center justify-center rounded-[14px] bg-ku-surface-muted px-ku-md",
  secondaryBtnText: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  dangerBtn:
    "min-h-[48px] items-center justify-center rounded-[14px] border border-ku-danger px-ku-md",
  dangerBtnText: "font-ku-semibold text-ku-body-small text-ku-danger",
  linkBtn: "min-h-[48px] items-center justify-center px-ku-sm",
  linkBtnText: "font-ku-semibold text-ku-body-small text-ku-worker-deep",
} as const;

export default payoutStyles;
