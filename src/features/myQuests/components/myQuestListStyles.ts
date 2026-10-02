const styles = {
  headerRow: "flex-row items-start gap-ku-12",
  backButton:
    "min-h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface",
  headerCopy: "min-w-0 flex-1",
  title: "font-ku-semibold text-ku-headline text-ku-text-strong",
  tabRow:
    "mt-ku-lg flex-row gap-ku-xs rounded-ku-card bg-ku-surface-muted p-ku-xs",
  tabButton:
    "min-h-[48px] flex-1 items-center justify-center rounded-ku-card px-ku-sm py-ku-sm",
  tabButtonText: "font-ku-semibold text-ku-body-small text-center",
  list: "flex-1",
  listHeader: "px-ku-lg pt-ku-lg pb-ku-md",
  listTitle: "font-ku-semibold text-ku-subtitle text-ku-text-strong",
  emptyAction:
    "mt-ku-md min-h-[48px] items-center justify-center rounded-ku-pill px-ku-md",
  emptyActionText: "font-ku-semibold text-ku-body-small leading-[21px]",
  errorText: "font-ku-semibold text-ku-body text-center leading-[24px]",
} as const;

export default styles;
