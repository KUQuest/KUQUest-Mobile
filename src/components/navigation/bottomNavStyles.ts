const styles = {
  container: 'absolute bottom-0 left-0 right-0 items-stretch px-[10px] pt-[6px]',
  tabletContainer: 'items-stretch justify-center px-[8px] py-[16px] pt-[16px]',
  bar: 'shadow-[0px_4px_4px_rgb(18_32_24_/0.06)] items-center bg-ku-surface-nav-translucent border-ku-border-nav rounded-[28px] border flex-row px-[6px] pt-[4px]',
  tabletBar: 'flex-1 flex-col items-stretch justify-center gap-[8px] px-[4px] py-[8px] pt-[8px]',
  item: 'items-center flex-1 justify-center min-w-[48px] min-h-[48px] px-[2px] active:opacity-[0.62]',
  activeItem: 'bg-ku-surface-accent rounded-[18px] mx-[2px] my-[4px]',
  tabletItem: 'flex-none min-h-[64px] w-full',
  activeLabel: 'text-ku-primary-deep font-ku-bold',
  label: 'text-ku-text-secondary text-ku-label font-ku-semibold mt-[2px] text-center max-w-full',
  createItem: 'px-[4px]',
  tabletCreateItem: 'my-[8px]',
  createIcon: 'shadow-[0px_3px_4px_rgb(18_32_24_/0.18)] items-center bg-ku-primary border-ku-surface border-2 rounded-ku-pill justify-center',
  activeIndicator: 'rounded-ku-pill h-[3px] mt-[3px] w-[24px]',
  unreadBadge: 'bg-ku-danger-icon border-ku-surface rounded-[7px] border-2 h-[14px] absolute right-[24px] top-[9px] w-[14px]',
} as const;

export default styles;
