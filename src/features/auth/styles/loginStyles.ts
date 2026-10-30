const styles = {
  safeArea: "flex-1 bg-ku-background",
  scrollContent: "flex-grow items-center px-ku-lg py-ku-md",
  content: "flex-1 w-full max-w-[420px]",
  hero: "flex-1 min-h-[280px] overflow-hidden justify-end bg-ku-primary rounded-ku-sheet px-ku-lg pb-ku-xl",
  heroOrbLarge:
    "absolute -right-[72px] -top-[72px] h-[240px] w-[240px] rounded-ku-pill bg-ku-primary-dark",
  heroOrbSmall:
    "absolute right-ku-lg top-[168px] h-[72px] w-[72px] rounded-ku-pill bg-ku-primary-deep",
  heroMark:
    "bg-ku-on-primary rounded-ku-pill h-[64px] w-[64px] items-center justify-center",
  title:
    "font-ku-bold text-ku-display text-ku-on-primary -tracking-[0.5px] mt-ku-lg",
  subtitle:
    "font-ku-semibold text-ku-label text-ku-on-primary tracking-[2px] uppercase mt-ku-xs",
  formSection: "w-full gap-ku-md pt-ku-lg",
  noticeText:
    "font-ku-regular text-ku-body-small text-ku-text-secondary text-center",
  noticeTextBold: "font-ku-bold text-ku-text-strong",
  errorCard:
    "bg-ku-surface-danger border-ku-border-danger border rounded-ku-card p-ku-md flex-row items-start gap-ku-12",
  errorContent: "flex-1 gap-ku-10",
  errorText: "font-ku-medium text-ku-body-small text-ku-danger-dark",
  retryButton:
    "self-start min-h-[48px] justify-center bg-ku-danger-dark px-ku-md rounded-ku-pill",
  retryButtonText: "font-ku-bold text-ku-on-primary text-ku-meta",
  hostWrapper: "w-full self-stretch",
  stagingTestSection:
    "w-full overflow-hidden rounded-ku-card border border-dashed border-ku-border",
  stagingTestToggle:
    "min-h-[48px] flex-row items-center gap-ku-sm px-ku-md py-ku-sm",
  stagingTestHeading:
    "flex-1 font-ku-medium text-ku-label text-ku-text-secondary",
  stagingTestRow: "flex-row flex-wrap gap-ku-xs px-ku-sm pb-ku-sm",
  stagingTestButton:
    "min-h-[56px] w-[48.5%] flex-row items-center gap-ku-sm rounded-ku-card bg-ku-surface px-ku-sm py-ku-xs active:opacity-80",
  stagingTestAvatar:
    "h-[32px] w-[32px] items-center justify-center rounded-ku-pill bg-ku-primary-subtle",
  stagingTestAvatarText: "font-ku-bold text-ku-label text-ku-primary-dark",
  stagingTestButtonText:
    "flex-1 font-ku-medium text-ku-body-small text-ku-text-strong",
  footerSection:
    "gap-ku-xs mt-ku-lg pt-ku-md border-t border-ku-divider items-center",
  footerLinks: "flex-row flex-wrap justify-center gap-x-ku-md gap-y-ku-xs",
  footerLinkText: "font-ku-medium text-ku-meta text-ku-text-muted",
  copyrightText: "font-ku-regular text-ku-label text-ku-text-muted",
} as const;

export default styles;
