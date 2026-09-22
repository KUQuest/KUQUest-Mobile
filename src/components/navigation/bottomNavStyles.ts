const styles = {
  container: "absolute bottom-0 left-0 right-0 items-stretch px-ku-xl pt-ku-6",
  tabletContainer: "items-stretch justify-center px-ku-sm py-ku-md pt-ku-md",
  bar: "shadow-[0px_4px_4px_rgb(18_32_24_/0.06)] items-center bg-ku-surface-nav-translucent border-ku-border-accent rounded-[22px] border flex-row px-ku-xs py-ku-3",
  tabletBar:
    "flex-1 flex-col items-stretch justify-center gap-ku-xs px-ku-xs py-ku-6 pt-ku-6",
  item: "items-center flex-1 justify-center min-w-[48px] min-h-[48px] px-ku-1 active:opacity-[0.62]",
  iconSlot: "items-center justify-center",
  activeItem: "bg-ku-surface-accent rounded-[14px] mx-ku-2 my-ku-3",
  tabletItem: "flex-none min-h-[56px] w-full",
  createItem: "px-ku-2",
  tabletCreateItem: "my-ku-xs",
  createIcon:
    "shadow-[0px_3px_4px_rgb(18_32_24_/0.18)] items-center bg-ku-primary border-ku-surface border-2 rounded-ku-pill justify-center",
  workIcon: "rounded-[14px]",
  activeIndicator: "rounded-ku-pill h-[2px] mt-ku-2 w-[18px]",
  unreadBadge:
    "bg-ku-danger-icon border-ku-surface rounded-[7px] border-2 h-[14px] absolute right-[10px] top-[7px] w-[14px]",
} as const;

export default styles;
