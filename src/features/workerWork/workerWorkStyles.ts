export const workerWorkStyles = {
  // Padding lives on this wrapper: the ScrollView's runtime
  // `contentContainerStyle` would replace a `contentContainerClassName`.
  content: "w-full max-w-[720px] self-center px-ku-md pt-ku-md",
  header: "px-ku-xs pb-ku-md",
  title: "font-ku-bold text-ku-title text-ku-text-strong",
  subtitle: "mt-ku-2 font-ku-regular text-ku-body-small text-ku-text-secondary",
  tabList:
    "mb-ku-md flex-row gap-ku-xs rounded-ku-pill bg-ku-surface-muted p-ku-xs",
  tab: "min-h-[48px] flex-1 flex-row items-center justify-center gap-ku-6 rounded-ku-pill px-ku-sm",
  tabSelected: "bg-ku-surface",
  tabText: "font-ku-semibold text-ku-body-small text-ku-text-secondary",
  tabTextSelected: "text-ku-text-strong",
  tabBadge:
    "min-w-[24px] items-center justify-center rounded-ku-pill bg-ku-surface px-ku-6 py-ku-1",
  tabBadgeSelected: "bg-ku-worker",
  tabBadgeText: "font-ku-bold text-ku-caption text-ku-text-secondary",
  tabBadgeTextSelected: "text-ku-on-worker",
  sectionHeading:
    "mb-ku-sm mt-ku-xs px-ku-xs font-ku-semibold text-ku-subtitle text-ku-text-strong",
  sectionList: "mb-ku-lg gap-ku-sm",

  card: "min-h-[48px] flex-row items-center gap-ku-12 rounded-[16px] border border-ku-border-subtle bg-ku-surface p-ku-md active:bg-ku-surface-muted",
  cardCopy: "min-w-0 flex-1 items-start gap-ku-sm",
  statusPill:
    "min-h-[28px] flex-row items-center gap-ku-xs rounded-ku-pill border px-ku-10",
  statusText: "flex-shrink font-ku-semibold text-ku-label",
  cardTitle: "self-stretch font-ku-semibold text-ku-body text-ku-text-strong",
  metaRow: "flex-row items-center gap-ku-sm self-stretch",
  metaText: "flex-1 font-ku-regular text-ku-label text-ku-text-secondary",

  stateBox:
    "items-center rounded-[16px] border border-dashed border-ku-border-subtle bg-ku-surface-muted px-ku-lg py-ku-28",
  stateIcon:
    "mb-ku-10 h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface-accent",
  stateTitle: "text-center font-ku-semibold text-ku-body text-ku-text-strong",
  stateDescription:
    "mt-ku-xs text-center font-ku-regular text-ku-body-small text-ku-text-secondary",
  stateAction:
    "mt-ku-md min-h-[48px] items-center justify-center rounded-ku-pill bg-ku-worker px-ku-lg active:bg-ku-worker-dark",
  stateActionText: "font-ku-semibold text-ku-body-small text-ku-on-worker",
  errorTitle: "text-center font-ku-semibold text-ku-body text-ku-danger-dark",
} as const;
