const styles = {
  safeArea: 'flex-1 bg-ku-surface',
  content: 'w-full px-[16px] pt-[32px] gap-[32px]',
  tabletContent: 'self-center max-w-[720px] px-[32px]',
  statusText: 'p-[24px] text-ku-text-secondary text-center',
  errorState: 'items-center p-[24px]',
  retryButton: 'min-h-[44px] min-w-[140px] items-center justify-center rounded-ku-pill bg-ku-primary px-[24px]',
  retryButtonText: 'text-ku-white font-semibold',
} as const;

export default styles;
