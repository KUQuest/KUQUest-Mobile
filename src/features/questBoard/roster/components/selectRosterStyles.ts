const selectRosterStyles = {
  content: "gap-ku-lg px-ku-md pb-ku-xl pt-ku-sm",
  questTitle: "font-ku-semibold text-ku-title text-ku-text-strong",
  section:
    "gap-ku-12 rounded-ku-card border border-ku-border bg-ku-surface p-ku-md",
  sectionHeader: "flex-row flex-wrap items-center justify-between gap-ku-sm",
  sectionTitle: "font-ku-semibold text-ku-subtitle text-ku-text-strong",
  sectionMeta: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  sectionSubtitle: "text-ku-body-small text-ku-text-secondary",
  countPill:
    "rounded-ku-pill bg-ku-primary-subtle px-ku-sm py-ku-xs font-ku-semibold text-ku-label text-ku-primary-deep",
  progressTrack: "h-ku-8 overflow-hidden rounded-ku-pill bg-ku-surface-high",
  progressFill: "h-full rounded-ku-pill bg-ku-primary",
  emptyText: "py-ku-sm text-ku-body-small text-ku-text-secondary",
  memberRow: "min-h-[56px] flex-row items-center gap-ku-12",
  memberText: "flex-1",
  memberName: "font-ku-semibold text-ku-body text-ku-text-strong",
  memberIdentity: "flex-row flex-wrap items-center gap-ku-xs",
  memberRating: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  memberDetail: "text-ku-body-small text-ku-text-secondary",
  avatar: "bg-ku-primary-subtle",
  avatarText: "font-ku-semibold text-ku-body text-ku-primary-deep",
  divider: "h-px bg-ku-divider",
  proposalCard: "gap-ku-12 rounded-ku-card bg-ku-surface-raised p-ku-12",
  actions: "flex-row gap-ku-sm",
  actionBase:
    "min-h-[48px] flex-1 flex-row items-center justify-center gap-ku-sm rounded-ku-pill px-ku-md",
  selectAction: "bg-ku-primary",
  selectText: "font-ku-semibold text-ku-body text-ku-on-primary",
  rejectAction: "border border-ku-border-danger bg-ku-surface",
  rejectText: "font-ku-semibold text-ku-body text-ku-danger-dark",
  disabled: "opacity-[0.55]",
  automaticNote:
    "flex-row items-center gap-ku-12 rounded-ku-card bg-ku-primary-subtle p-ku-md",
  automaticText: "flex-1 text-ku-body-small text-ku-primary-deep",
  loading: "flex-1 items-center justify-center gap-ku-12 p-ku-lg",
  loadingText: "text-ku-body-small text-ku-text-secondary",
} as const;

export default selectRosterStyles;
