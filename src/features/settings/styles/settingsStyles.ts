const styles = {
  safeArea: 'flex-1 bg-ku-background',
  content: 'gap-[24px] px-[20px] pt-[20px]',
  section: 'gap-[8px]',
  sectionTitle: 'text-ku-text-secondary font-ku-semibold text-ku-meta px-[4px]',
  sectionBody: 'bg-ku-white border-ku-border-subtle rounded-[16px] border overflow-hidden',
  row: 'items-center flex-row min-h-[76px] px-[16px] py-[12px] active:bg-ku-surface-muted',
  rowWithDivider: 'border-b-ku-border-subtle border-b',
  iconContainer: 'items-center bg-ku-surface-accent rounded-[12px] h-[40px] justify-center mr-[12px] w-[40px]',
  rowContent: 'flex-1 min-w-0',
  rowTitle: 'text-ku-text-strong font-ku-semibold text-ku-control',
  rowDescription: 'text-ku-text-secondary font-ku-regular text-ku-meta mt-[2px]',
  rowValue: 'text-ku-text-muted font-ku-medium text-ku-meta mr-[8px]',
  chevron: 'ml-[8px]',
  switchHost: 'ml-[8px] min-w-[52px] items-end',
  version: 'text-ku-text-muted font-ku-regular text-ku-meta px-[4px] text-center',
  footer: 'gap-[4px] pb-[16px] pt-[4px]',
} as const;

export default styles;
