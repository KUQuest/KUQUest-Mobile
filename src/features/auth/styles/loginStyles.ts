const styles = {
  safeArea: "flex-1 bg-ku-background",
  scrollContent: "flex-grow items-center px-ku-lg py-ku-md",
  content: "flex-1 w-full max-w-[420px]",
  hero: "bg-ku-primary rounded-ku-sheet px-ku-lg pt-ku-xl pb-ku-lg",
  heroMark:
    "bg-ku-on-primary rounded-ku-pill h-[56px] w-[56px] items-center justify-center",
  title:
    "font-ku-bold text-ku-display text-ku-on-primary -tracking-[0.5px] mt-ku-lg",
  subtitle:
    "font-ku-semibold text-ku-label text-ku-on-primary tracking-[2px] uppercase mt-ku-xs",
  formSection: "w-full gap-ku-md mt-auto pt-ku-xl",
  noticeCard:
    "bg-ku-primary-subtle border-ku-primary-border border rounded-ku-card p-ku-md flex-row items-center gap-ku-12",
  noticeText: "flex-1 font-ku-regular text-ku-body-small text-ku-text",
  noticeTextBold: "font-ku-bold text-ku-text-strong",
  errorCard:
    "bg-ku-surface-danger border-ku-border-danger border rounded-ku-card p-ku-md flex-row items-start gap-ku-12",
  errorContent: "flex-1 gap-ku-10",
  errorText: "font-ku-medium text-ku-body-small text-ku-danger-dark",
  retryButton:
    "self-start min-h-[48px] justify-center bg-ku-danger-dark px-ku-md rounded-ku-pill",
  retryButtonText: "font-ku-bold text-ku-on-primary text-ku-meta",
  hostWrapper: "w-full self-stretch",
  stagingTestSection: "w-full gap-ku-xs",
  stagingTestHeading: "font-ku-medium text-ku-label text-ku-text-muted",
  stagingTestRow: "flex-row gap-ku-xs",
  stagingTestButton:
    "flex-1 min-h-[48px] items-center justify-center rounded-ku-pill border border-ku-border py-ku-sm",
  stagingTestButtonText:
    "font-ku-medium text-ku-body-small text-ku-text-secondary",
  footerSection: "gap-ku-sm mt-ku-xl pt-ku-md border-t border-ku-divider",
  footerLinks: "flex-row flex-wrap gap-x-ku-md gap-y-ku-xs",
  footerLinkText: "font-ku-medium text-ku-meta text-ku-text-muted",
  copyrightText: "font-ku-regular text-ku-label text-ku-text-muted",
} as const;

export default styles;
