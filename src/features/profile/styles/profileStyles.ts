const styles = {
  safeArea: "flex-1 bg-ku-background",
  content: "w-full gap-ku-12",
  profileChrome: "w-full gap-ku-md",
  tabletContent: "self-center max-w-[720px]",
  statusText: "p-ku-lg text-ku-text-secondary text-center",
  errorState: "items-center p-ku-lg",
  retryButton:
    "min-h-[48px] min-w-[140px] items-center justify-center rounded-ku-pill bg-ku-primary px-ku-lg",
  retryButtonText: "text-ku-on-primary font-ku-semibold",
} as const;

export default styles;
