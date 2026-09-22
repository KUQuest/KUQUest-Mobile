const styles = {
  safeArea: "flex-1 bg-ku-background",
  container: "flex-1 justify-center items-center px-ku-lg",
  content: "flex-1 w-full max-w-[420px] justify-start py-ku-md",
  headerSection: "items-start mt-ku-sm",
  title:
    "font-ku-bold text-ku-heading text-ku-primary -tracking-[0.5px] text-left",
  subtitle:
    "font-ku-semibold text-ku-label font-ku-semibold text-ku-text-muted tracking-[2.5px] text-left uppercase mt-ku-6",
  formSection: "w-full gap-ku-md mt-ku-64",
  noticeCard:
    "bg-ku-surface-success border-ku-border-success border rounded-[16px] p-ku-md flex-row items-center gap-ku-12 mb-ku-xs",
  noticeText:
    "flex-1 font-ku-regular text-ku-body-small text-ku-text-secondary",
  noticeTextBold: "font-ku-bold font-bold text-ku-text-strong",
  errorCard:
    "bg-ku-surface-danger border-ku-border-danger border rounded-[16px] p-ku-md flex-row items-start gap-ku-12 mb-ku-xs",
  errorContent: "flex-1 gap-ku-10",
  errorText:
    "font-ku-medium text-ku-body-small text-ku-danger-dark font-ku-medium",
  retryButton: "self-start bg-ku-danger-dark px-ku-md py-ku-sm rounded-[8px]",
  retryButtonText: "font-ku-bold text-ku-on-primary text-ku-meta font-ku-bold",
  hostWrapper: "w-full self-stretch",
  footerSection: "items-start gap-ku-12 mb-ku-sm mt-auto",
  footerLinks: "items-start flex-col justify-center gap-ku-sm",
  footerLinkText:
    "font-ku-medium text-ku-meta font-ku-medium text-ku-text-muted",
  copyrightText: "font-ku-regular text-ku-label text-ku-text-faint text-left",
} as const;

export default styles;
