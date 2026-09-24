const styles = {
  headerRow: "flex-row items-center gap-ku-sm",
  backButton:
    "h-[48px] w-[48px] items-center justify-center rounded-[14px] border border-ku-border",
  headerCopy: "min-w-0 flex-1",
  title: "font-ku-bold text-ku-title leading-[30px]",
  subtitle: "mt-ku-2 font-ku-regular text-ku-body-small leading-[21px]",
  tabRow: "mt-ku-sm flex-row gap-ku-sm",
  tabButton:
    "min-h-[48px] flex-1 items-center justify-center rounded-ku-pill border border-ku-border px-ku-6",
  tabButtonText: "font-ku-semibold text-ku-label text-center leading-[18px]",
  list: "flex-1 px-ku-md",
  listHeader: "pb-ku-sm pt-ku-md",
  listTitle: "font-ku-bold text-ku-subtitle leading-[24px]",
  listHint: "mt-ku-2 font-ku-regular text-ku-label leading-[18px]",
  emptyTitle: "font-ku-semibold text-ku-body text-center leading-[24px]",
  emptyDescription:
    "mt-ku-xs font-ku-regular text-ku-body-small text-center leading-[21px]",
  emptyAction:
    "mt-ku-md min-h-[48px] items-center justify-center rounded-ku-pill px-ku-md",
  emptyActionText: "font-ku-semibold text-ku-body-small leading-[21px]",
  error: "flex-1 items-center justify-center px-ku-lg",
  errorText: "font-ku-semibold text-ku-body text-center leading-[24px]",
} as const;

export default styles;
