const styles = {
  container: 'items-stretch bg-ku-background px-[10px] pt-[6px]',
  bar: 'shadow-[0px_4px_4px_rgb(18_32_24_/0.06)] items-center bg-ku-surface-nav-translucent border-ku-border-nav rounded-[28px] border flex-row px-[6px] pt-[4px]',
  item: 'items-center flex-1 justify-center min-w-[48px] min-h-[48px] px-[2px] active:opacity-[0.62]',
  activeLabel: 'text-ku-success-bright font-ku-bold',
  label: 'text-ku-text-secondary text-[10px] font-ku-semibold leading-[12px] mt-[2px] text-center max-w-full',
  createItem: 'px-[4px]',
  createIcon: 'shadow-[0px_3px_4px_rgb(18_32_24_/0.18)] items-center bg-ku-primary border-ku-surface border-2 rounded-ku-pill justify-center',
  unreadBadge: 'bg-ku-danger-icon border-ku-surface rounded-[7px] border-2 h-[14px] absolute right-[24px] top-[9px] w-[14px]',
} as const;

export default styles;
