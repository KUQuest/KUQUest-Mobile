const styles = {
  safeArea: 'flex-1 bg-ku-background',
  container: 'flex-1 justify-center items-center px-[24px]',
  content: 'flex-1 w-full max-w-[420px] justify-start py-[16px]',
  headerSection: 'items-start mt-[8px]',
  title: 'font-ku-bold text-ku-heading text-ku-primary -tracking-[0.5px] text-left',
  subtitle: 'font-ku-semibold text-ku-label font-ku-semibold text-ku-text-muted tracking-[2.5px] text-left uppercase mt-[6px]',
  formSection: 'w-full gap-[16px] mt-[64px]',
  noticeCard: 'bg-ku-surface-success border-ku-border-success border rounded-[16px] p-[16px] flex-row items-center gap-[12px] mb-[4px]',
  noticeText: 'flex-1 font-ku-regular text-ku-body-small text-ku-text-secondary',
  noticeTextBold: 'font-ku-bold font-bold text-ku-text-strong',
  errorCard: 'bg-ku-surface-danger border-ku-border-danger border rounded-[16px] p-[16px] flex-row items-start gap-[12px] mb-[4px]',
  errorContent: 'flex-1 gap-[10px]',
  errorText: 'font-ku-medium text-ku-body-small text-ku-danger-dark font-ku-medium',
  retryButton: 'self-start bg-ku-danger-dark px-[16px] py-[8px] rounded-[8px]',
  retryButtonText: 'font-ku-bold text-ku-white text-ku-meta font-ku-bold',
  hostWrapper: 'w-full self-stretch',
  footerSection: 'items-start gap-[12px] mb-[8px] mt-auto',
  footerLinks: 'items-start flex-col justify-center gap-[8px]',
  footerLinkText: 'font-ku-medium text-ku-meta font-ku-medium text-ku-text-muted',
  copyrightText: 'font-ku-regular text-ku-label text-ku-text-faint text-left',
} as const;

export default styles;
