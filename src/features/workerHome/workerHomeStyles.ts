import type { ViewStyle } from "react-native";

export const workerHomeStyles = {
  masthead: "gap-ku-md rounded-ku-card bg-ku-worker-subtle pt-ku-md",
  mastheadCopy: "gap-ku-xs px-ku-md",
  screenTitle: "font-ku-bold text-ku-headline text-ku-text-strong",
  screenSubtitle: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  roleBadgeDot: "h-[7px] w-[7px] rounded-[4px]",
  searchBarContainer:
    "mx-ku-md min-h-[52px] flex-row items-center gap-ku-sm rounded-ku-pill border border-ku-border bg-ku-surface pl-ku-md pr-ku-xs",
  searchInput:
    "min-h-[48px] flex-1 py-ku-0 font-ku-regular text-ku-body-small text-ku-text-strong",
  searchIconButton: "h-[44px] w-[44px] items-center justify-center",
  filterIconButton:
    "h-[44px] w-[44px] items-center justify-center rounded-ku-pill bg-ku-worker-subtle",
  tagFilterRow: "flex-row items-center gap-ku-sm px-ku-md pb-ku-md",
  tagPill:
    "min-h-[40px] items-center justify-center rounded-ku-pill border px-ku-md",
  tagPillIdle: "border-ku-border bg-ku-surface",
  tagPillSelected: "border-ku-worker-dark bg-ku-worker-dark",
  tagPillText: "font-ku-medium text-ku-meta text-ku-text-secondary",
  tagPillTextSelected: "font-ku-semibold text-ku-on-worker",
  dock: "absolute left-ku-md right-ku-md z-50 min-h-[64px] flex-row items-center gap-ku-12 rounded-ku-card bg-ku-worker-dark py-ku-sm pl-ku-sm pr-ku-12",
  dockIcon:
    "h-[44px] w-[44px] items-center justify-center rounded-ku-pill bg-ku-worker",
  dockCopy: "min-w-0 flex-1",
  dockStateRow: "flex-row items-center gap-ku-6",
  dockLiveDot: "h-[8px] w-[8px] rounded-ku-pill bg-ku-on-worker",
  dockState: "font-ku-medium text-ku-label text-ku-on-worker",
  dockTitle: "font-ku-semibold text-ku-body text-ku-on-worker",
  dockAction:
    "min-h-[36px] shrink-0 flex-row items-center gap-ku-2 rounded-ku-pill bg-ku-surface pl-ku-12 pr-ku-sm",
  dockActionText: "font-ku-semibold text-ku-label text-ku-worker-dark",
  statsContainer:
    "mb-ku-lg flex-row gap-ku-10 rounded-[16px] border border-ku-border p-ku-14",
  statBox: "flex-1 items-center justify-center py-ku-xs",
  statValue: "font-ku-bold text-ku-title-small leading-[28px]",
  statLabel: "mt-ku-2 font-ku-medium text-ku-label text-center leading-[16px]",
  statDivider: "h-[70%] w-px self-center",
  sectionHeader: "mb-ku-12 mt-ku-lg gap-ku-2 px-ku-xs",
  sectionTitleRow: "flex-row items-center gap-ku-sm",
  sectionTitle: "font-ku-bold text-ku-subtitle text-ku-text-strong",
  sectionCount:
    "rounded-ku-pill bg-ku-worker-subtle px-ku-sm py-ku-2 font-ku-semibold text-ku-label text-ku-worker-dark",
  sectionSubtitle: "font-ku-regular text-ku-meta text-ku-text-secondary",
  cardList: "mb-ku-lg gap-ku-12",
  assignmentCard: "rounded-[16px] border border-ku-border p-ku-md",
  cardHeader: "mb-ku-sm flex-row items-center justify-between",
  cardTitle: "mr-ku-sm flex-1 font-ku-semibold text-ku-body leading-[22px]",
  badgePill: "rounded-ku-pill border border-ku-border px-ku-10 py-ku-3",
  badgeText: "font-ku-semibold text-ku-caption leading-[16px]",
  cardMetaRow: "mb-ku-12 mt-ku-6 flex-row items-center gap-ku-14",
  cardMetaItem: "flex-row items-center gap-ku-5",
  cardMetaText: "font-ku-regular text-ku-label leading-[16px]",
  actionButton:
    "min-h-[44px] items-center justify-center rounded-[10px] px-ku-md py-ku-10",
  actionButtonText: "font-ku-semibold text-ku-body-small leading-[20px]",
  feedCard:
    "gap-ku-md rounded-ku-card border border-ku-border bg-ku-surface p-ku-md active:bg-ku-surface-raised",
  feedCardTop: "flex-row items-start gap-ku-12",
  feedCardIdentity: "min-w-0 flex-1 gap-ku-6",
  feedCardTitle: "font-ku-semibold text-ku-body text-ku-text-strong",
  feedCardOwner: "flex-row items-center gap-ku-6",
  feedCardOwnerText:
    "flex-1 font-ku-regular text-ku-label text-ku-text-secondary",
  feedReward:
    "min-w-[76px] items-end rounded-ku-field bg-ku-worker-subtle px-ku-10 py-ku-6",
  feedRewardText: "font-ku-bold text-ku-subtitle text-ku-worker-dark",
  feedRewardUnit: "font-ku-regular text-ku-caption text-ku-text-secondary",
  tagChip:
    "self-start rounded-ku-pill border border-ku-worker-border px-ku-sm py-ku-2",
  tagText: "font-ku-medium text-ku-caption text-ku-worker-dark",
  feedMetaRow:
    "flex-row items-center gap-ku-12 border-t border-ku-divider pt-ku-12",
  feedMetaItem: "shrink flex-row items-center gap-ku-6",
  feedMetaGrow: "min-w-0 flex-1",
  feedMetaText: "shrink font-ku-medium text-ku-label text-ku-text",
  emptyState:
    "mb-ku-lg items-center gap-ku-sm rounded-ku-card border border-ku-border bg-ku-surface px-ku-lg py-ku-xl",
  emptyIconCircle:
    "mb-ku-xs h-[56px] w-[56px] items-center justify-center rounded-ku-pill bg-ku-worker-subtle",
  emptyTitle:
    "text-center font-ku-semibold text-ku-subtitle text-ku-text-strong",
  emptyDescription:
    "text-center font-ku-regular text-ku-body-small text-ku-text-secondary",
  emptyActionBtn:
    "mt-ku-14 min-h-[38px] items-center justify-center rounded-ku-pill border border-ku-border px-ku-md py-ku-sm",
  emptyActionBtnText: "font-ku-semibold text-ku-meta leading-[18px]",
  feedError: "mb-ku-lg overflow-hidden rounded-ku-card bg-ku-surface",
  currentQuestCard:
    "mb-ku-md rounded-[18px] border-[1.5px] border-ku-border p-ku-md",
  currentQuestTop: "mb-ku-10 flex-row items-center justify-between",
  currentQuestLabel:
    "font-ku-semibold text-ku-label uppercase leading-[16px] tracking-[0.5px]",
  currentQuestBody: "flex-row gap-ku-12",
  currentQuestLeft: "flex-[1.2] justify-between",
  currentQuestRight:
    "flex-[0.9] justify-center border-l border-ku-border pl-ku-12",
  hirerRow: "mt-ku-sm flex-row items-center gap-ku-sm",
  hirerAvatar: "h-[34px] w-[34px] items-center justify-center rounded-[17px]",
  hirerName: "font-ku-medium text-ku-meta leading-[18px]",
  timelineTitle:
    "mb-ku-6 font-ku-semibold text-ku-caption uppercase leading-[15px] tracking-[0.3px]",
  timelineStepRow: "my-ku-3 flex-row items-center gap-ku-sm",
  timelineDot: "h-[10px] w-[10px] rounded-[5px] border-2",
  timelineStepText: "font-ku-medium text-ku-caption leading-[15px]",
  noWorkPromptCard:
    "mb-ku-18 items-center rounded-[18px] border border-ku-border p-ku-22",
  noWorkIconCircle:
    "mb-ku-10 h-[48px] w-[48px] items-center justify-center rounded-[24px]",
  noWorkTitle: "font-ku-semibold text-ku-body text-center leading-[22px]",
  noWorkDesc:
    "mt-ku-xs font-ku-regular text-ku-meta text-center leading-[18px]",
  findQuestsBtn:
    "mt-ku-14 min-h-[42px] items-center justify-center rounded-[10px] px-ku-lg py-ku-10",
  findQuestsBtnText: "font-ku-semibold text-ku-body-small leading-[20px]",
  managementTabsRow: "mb-ku-14 flex-row items-center justify-between",
  tabsGroup: "flex-row items-center gap-ku-sm",
  managementTabItem:
    "min-h-[36px] flex-row items-center gap-ku-xs rounded-ku-pill border border-ku-border px-ku-14 py-ku-sm",
  managementTabText: "font-ku-semibold text-ku-meta leading-[18px]",
  tabCountBadge: "rounded-[10px] px-ku-6 py-ku-1 font-ku-bold text-ku-caption",
  refreshIconButton:
    "h-[36px] w-[36px] items-center justify-center rounded-[18px]",
  workingNowBar:
    "absolute left-ku-md right-ku-md z-50 flex-row items-center justify-between rounded-[16px] border-[1.5px] border-ku-border px-ku-md py-ku-sm",
  workingNowLeft: "flex-1 flex-row items-center gap-ku-10",
  workingNowTitle: "font-ku-semibold text-ku-body-small leading-[19px]",
  workingNowElapsed: "mt-ku-2 font-ku-regular text-ku-label leading-[16px]",
} as const;

// DESIGN.md "Quiet Lift" for floating elements.
export const workerHomeDockShadow = {
  shadowColor: "#18201B",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
} satisfies ViewStyle;
