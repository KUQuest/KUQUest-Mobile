import type { ViewStyle } from "react-native";

export const workerHomeStyles = {
  screenHeader: "px-ku-xs pb-ku-22",
  screenTitle: "font-ku-bold text-[26px] leading-[34px]",
  screenSubtitle: "mt-ku-2 font-ku-regular text-ku-body-small leading-[20px]",
  roleBadgeDot: "h-[7px] w-[7px] rounded-[4px]",
  searchBarContainer:
    "mb-ku-10 h-[48px] flex-row items-center gap-ku-sm rounded-[14px] border border-ku-border px-ku-sm",
  searchInput: "h-full flex-1 py-ku-0 font-ku-regular text-ku-body-small",
  filterIconButton:
    "h-[34px] w-[34px] items-center justify-center rounded-[8px]",
  tagFilterScrollView: "mb-ku-14",
  tagFilterRow: "flex-row items-center gap-ku-sm px-ku-2",
  tagPill:
    "min-h-[34px] items-center justify-center rounded-ku-pill border border-ku-border px-ku-14 py-ku-7",
  tagPillText: "font-ku-medium text-ku-meta leading-[18px]",
  quickAccessFloatingContainer:
    "absolute left-ku-md right-ku-md z-50 rounded-[16px] border-[1.5px] border-ku-border px-ku-md py-ku-sm",
  quickAccessTopRow: "flex-row items-center justify-between",
  quickAccessLeft: "mr-ku-10 flex-1 flex-row items-center",
  quickAccessIndicator: "mr-ku-10 h-[9px] w-[9px] rounded-[5px]",
  quickAccessTitle: "font-ku-semibold text-ku-body-small leading-[19px]",
  quickAccessSubtitle: "mt-ku-2 font-ku-regular text-ku-label leading-[16px]",
  quickAccessProgressBar:
    "mt-ku-sm h-[3px] w-full overflow-hidden rounded-[2px]",
  quickAccessProgressFill: "h-full w-[70%] rounded-[2px]",
  statsContainer:
    "mb-ku-lg flex-row gap-ku-10 rounded-[16px] border border-ku-border p-ku-14",
  statBox: "flex-1 items-center justify-center py-ku-xs",
  statValue: "font-ku-bold text-ku-title-small leading-[28px]",
  statLabel: "mt-ku-2 font-ku-medium text-ku-label text-center leading-[16px]",
  statDivider: "h-[70%] w-px self-center",
  sectionHeader: "mb-ku-md mt-ku-xs",
  sectionTitle: "font-ku-semibold text-ku-subtitle leading-[24px]",
  sectionSubtitle: "mt-ku-2 font-ku-regular text-ku-meta leading-[18px]",
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
  feedCard: "rounded-[18px] border border-ku-border p-ku-md",
  feedCardTop: "flex-row items-start justify-between gap-ku-12",
  feedCardIdentity: "min-w-0 flex-1",
  feedCardTitle: "font-ku-semibold text-ku-body leading-[22px]",
  feedCardOwner: "mt-ku-sm flex-row items-center gap-ku-5",
  feedCardOwnerText: "flex-1 font-ku-regular text-ku-label leading-[16px]",
  feedRewardBlock: "min-w-[80px] items-end",
  feedRewardText: "font-ku-bold text-ku-subtitle leading-[24px]",
  feedRewardUnit: "mt-ku-1 font-ku-regular text-ku-caption leading-[15px]",
  tagChip: "mb-ku-6 self-start rounded-[6px] px-ku-sm py-ku-2",
  tagText: "font-ku-medium text-ku-caption leading-[15px]",
  feedMetaGrid: "mt-ku-md flex-row flex-wrap gap-ku-10",
  feedMetaItem: "max-w-full flex-row items-center gap-ku-5",
  feedMetaText: "shrink font-ku-medium text-ku-label leading-[16px]",
  feedCardFooter:
    "mt-ku-14 flex-row items-center justify-between border-t border-ku-border pt-ku-sm",
  feedCardFooterText: "font-ku-semibold text-ku-meta leading-[18px]",
  emptyState:
    "mb-ku-lg min-h-[160px] items-center justify-center rounded-[16px] border border-ku-border px-ku-md py-ku-md",
  emptyIconCircle:
    "mb-ku-10 h-[44px] w-[44px] items-center justify-center rounded-[22px]",
  emptyTitle: "font-ku-semibold text-ku-control text-center leading-[20px]",
  emptyDescription:
    "mt-ku-xs font-ku-regular text-ku-meta text-center leading-[18px]",
  emptyActionBtn:
    "mt-ku-14 min-h-[38px] items-center justify-center rounded-ku-pill border border-ku-border px-ku-md py-ku-sm",
  emptyActionBtnText: "font-ku-semibold text-ku-meta leading-[18px]",
  errorState:
    "mb-ku-md items-center rounded-[16px] border border-ku-border p-ku-18",
  errorText:
    "mb-ku-sm font-ku-medium text-ku-body-small text-center leading-[20px]",
  retryButton:
    "min-h-[38px] items-center justify-center rounded-[8px] px-ku-md py-ku-sm",
  retryText: "font-ku-semibold text-ku-meta leading-[18px]",
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

export const workerHomeQuickAccessShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 8,
} satisfies ViewStyle;
