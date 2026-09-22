const styles = {
  safeArea: "flex-1 bg-ku-background",
  content: "gap-ku-lg px-ku-20 pt-ku-20",
  section: "gap-ku-sm",
  sectionTitle: "text-ku-text-secondary font-ku-semibold text-ku-meta px-ku-xs",
  sectionBody:
    "bg-ku-card border-ku-border-subtle rounded-[16px] border overflow-hidden",
  row: "items-center flex-row min-h-[76px] px-ku-md py-ku-12 active:bg-ku-surface-muted",
  rowWithDivider: "border-b-ku-border-subtle border-b",
  iconContainer:
    "items-center bg-ku-surface-accent rounded-[12px] h-[40px] justify-center mr-ku-12 w-[40px]",
  rowContent: "flex-1 min-w-0",
  rowTitle: "text-ku-text-strong font-ku-semibold text-ku-control",
  rowDescription: "text-ku-text-secondary font-ku-regular text-ku-meta mt-ku-2",
  rowValue: "text-ku-text-muted font-ku-medium text-ku-meta mr-ku-sm",
  chevron: "ml-ku-sm",
  switchHost: "ml-ku-sm min-w-[52px] items-end",
  version:
    "text-ku-text-muted font-ku-regular text-ku-meta px-ku-xs text-center",
  footer: "gap-ku-xs pb-ku-md pt-ku-xs",
} as const;

export default styles;
