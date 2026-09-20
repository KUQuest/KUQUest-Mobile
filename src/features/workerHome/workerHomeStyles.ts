import type { ViewStyle } from "react-native";

export const workerHomeStyles = {
  screenContent: "px-ku-md pt-[14px]",
  screenHeader: "px-[4px] pb-[14px]",
  headerTopRow: "mb-ku-sm flex-row items-center justify-between",
  roleBadge:
    "flex-row items-center gap-ku-xs rounded-ku-pill border border-ku-border px-ku-sm py-[5px]",
  roleBadgeDot: "h-[7px] w-[7px] rounded-[4px]",
  roleBadgeText: "font-ku-semibold text-ku-label leading-[18px]",
  switchRoleButton:
    "min-h-[34px] flex-row items-center gap-ku-xs rounded-ku-pill border border-ku-border px-ku-sm py-[6px]",
  switchRoleText: "font-ku-medium text-ku-label leading-[16px]",
  screenTitle: "font-ku-bold text-[26px] leading-[34px]",
  screenSubtitle: "mt-[2px] font-ku-regular text-ku-body-small leading-[20px]",
  searchBarContainer:
    "mb-[10px] h-[48px] flex-row items-center gap-ku-sm rounded-[14px] border border-ku-border px-ku-sm",
  searchInput: "h-full flex-1 py-0 font-ku-regular text-ku-body-small",
  filterIconButton:
    "h-[34px] w-[34px] items-center justify-center rounded-[8px]",
  tagFilterScrollView: "mb-[14px]",
  tagFilterRow: "flex-row items-center gap-ku-sm px-[2px]",
  tagPill:
    "min-h-[34px] items-center justify-center rounded-ku-pill border border-ku-border px-[14px] py-[7px]",
  tagPillText: "font-ku-medium text-ku-meta leading-[18px]",
  quickAccessFloatingContainer:
    "absolute left-ku-md right-ku-md z-50 rounded-[16px] border-[1.5px] border-ku-border px-ku-md py-ku-sm",
  quickAccessTopRow: "flex-row items-center justify-between",
  quickAccessLeft: "mr-[10px] flex-1 flex-row items-center",
  quickAccessIndicator: "mr-[10px] h-[9px] w-[9px] rounded-[5px]",
  quickAccessTitle: "font-ku-semibold text-ku-body-small leading-[19px]",
  quickAccessSubtitle: "mt-[2px] font-ku-regular text-ku-label leading-[16px]",
  quickAccessProgressBar:
    "mt-ku-sm h-[3px] w-full overflow-hidden rounded-[2px]",
  quickAccessProgressFill: "h-full w-[70%] rounded-[2px]",
  statsContainer:
    "mb-ku-lg flex-row gap-[10px] rounded-[16px] border border-ku-border p-[14px]",
  statBox: "flex-1 items-center justify-center py-[4px]",
  statValue: "font-ku-bold text-ku-title-small leading-[28px]",
  statLabel: "mt-[2px] font-ku-medium text-ku-label text-center leading-[16px]",
  statDivider: "h-[70%] w-px self-center",
  sectionHeader: "mb-ku-md mt-[4px]",
  sectionTitle: "font-ku-semibold text-ku-subtitle leading-[24px]",
  sectionSubtitle: "mt-[2px] font-ku-regular text-ku-meta leading-[18px]",
  cardList: "mb-ku-lg gap-[12px]",
  assignmentCard: "rounded-[16px] border border-ku-border p-ku-md",
  cardHeader: "mb-ku-sm flex-row items-center justify-between",
  cardTitle: "mr-ku-sm flex-1 font-ku-semibold text-ku-body leading-[22px]",
  badgePill: "rounded-ku-pill border border-ku-border px-[10px] py-[3px]",
  badgeText: "font-ku-semibold text-ku-caption leading-[16px]",
  cardMetaRow: "mb-[12px] mt-[6px] flex-row items-center gap-[14px]",
  cardMetaItem: "flex-row items-center gap-[5px]",
  cardMetaText: "font-ku-regular text-ku-label leading-[16px]",
  actionButton:
    "min-h-[44px] items-center justify-center rounded-[10px] px-ku-md py-[10px]",
  actionButtonText: "font-ku-semibold text-ku-body-small leading-[20px]",
  feedCard: "rounded-[18px] border border-ku-border p-ku-md",
  feedCardTop: "flex-row items-start justify-between gap-[12px]",
  feedCardIdentity: "min-w-0 flex-1",
  feedCardTitle: "font-ku-semibold text-ku-body leading-[22px]",
  feedCardOwner: "mt-ku-sm flex-row items-center gap-[5px]",
  feedCardOwnerText: "flex-1 font-ku-regular text-ku-label leading-[16px]",
  feedRewardBlock: "min-w-[80px] items-end",
  feedRewardText: "font-ku-bold text-ku-subtitle leading-[24px]",
  feedRewardUnit: "mt-[1px] font-ku-regular text-ku-caption leading-[15px]",
  tagChip: "mb-[6px] self-start rounded-[6px] px-ku-sm py-[2px]",
  tagText: "font-ku-medium text-ku-caption leading-[15px]",
  feedMetaGrid: "mt-ku-md flex-row flex-wrap gap-[10px]",
  feedMetaItem: "max-w-full flex-row items-center gap-[5px]",
  feedMetaText: "shrink font-ku-medium text-ku-label leading-[16px]",
  feedCardFooter:
    "mt-[14px] flex-row items-center justify-between border-t border-ku-border pt-ku-sm",
  feedCardFooterText: "font-ku-semibold text-ku-meta leading-[18px]",
  emptyState:
    "mb-ku-lg min-h-[160px] items-center justify-center rounded-[16px] border border-ku-border px-ku-md py-ku-md",
  emptyIconCircle:
    "mb-[10px] h-[44px] w-[44px] items-center justify-center rounded-[22px]",
  emptyTitle: "font-ku-semibold text-ku-control text-center leading-[20px]",
  emptyDescription:
    "mt-[4px] font-ku-regular text-ku-meta text-center leading-[18px]",
  emptyActionBtn:
    "mt-[14px] min-h-[38px] items-center justify-center rounded-ku-pill border border-ku-border px-ku-md py-ku-sm",
  emptyActionBtnText: "font-ku-semibold text-ku-meta leading-[18px]",
  errorState:
    "mb-ku-md items-center rounded-[16px] border border-ku-border p-[18px]",
  errorText:
    "mb-ku-sm font-ku-medium text-ku-body-small text-center leading-[20px]",
  retryButton:
    "min-h-[38px] items-center justify-center rounded-[8px] px-ku-md py-ku-sm",
  retryText: "font-ku-semibold text-ku-meta leading-[18px]",
  currentQuestCard:
    "mb-ku-md rounded-[18px] border-[1.5px] border-ku-border p-ku-md",
  currentQuestTop: "mb-[10px] flex-row items-center justify-between",
  currentQuestLabel:
    "font-ku-semibold text-ku-label uppercase leading-[16px] tracking-[0.5px]",
  currentQuestBody: "flex-row gap-[12px]",
  currentQuestLeft: "flex-[1.2] justify-between",
  currentQuestRight:
    "flex-[0.9] justify-center border-l border-ku-border pl-[12px]",
  hirerRow: "mt-ku-sm flex-row items-center gap-ku-sm",
  hirerAvatar: "h-[34px] w-[34px] items-center justify-center rounded-[17px]",
  hirerName: "font-ku-medium text-ku-meta leading-[18px]",
  timelineTitle:
    "mb-[6px] font-ku-semibold text-ku-caption uppercase leading-[15px] tracking-[0.3px]",
  timelineStepRow: "my-[3px] flex-row items-center gap-ku-sm",
  timelineDot: "h-[10px] w-[10px] rounded-[5px] border-2",
  timelineStepText: "font-ku-medium text-ku-caption leading-[15px]",
  noWorkPromptCard:
    "mb-[18px] items-center rounded-[18px] border border-ku-border p-[22px]",
  noWorkIconCircle:
    "mb-[10px] h-[48px] w-[48px] items-center justify-center rounded-[24px]",
  noWorkTitle: "font-ku-semibold text-ku-body text-center leading-[22px]",
  noWorkDesc:
    "mt-[4px] font-ku-regular text-ku-meta text-center leading-[18px]",
  findQuestsBtn:
    "mt-[14px] min-h-[42px] items-center justify-center rounded-[10px] px-ku-lg py-[10px]",
  findQuestsBtnText: "font-ku-semibold text-ku-body-small leading-[20px]",
  managementTabsRow: "mb-[14px] flex-row items-center justify-between",
  tabsGroup: "flex-row items-center gap-ku-sm",
  managementTabItem:
    "min-h-[36px] flex-row items-center gap-ku-xs rounded-ku-pill border border-ku-border px-[14px] py-ku-sm",
  managementTabText: "font-ku-semibold text-ku-meta leading-[18px]",
  tabCountBadge:
    "rounded-[10px] px-[6px] py-[1px] font-ku-bold text-ku-caption",
  refreshIconButton:
    "h-[36px] w-[36px] items-center justify-center rounded-[18px]",
  workingNowBar:
    "absolute left-ku-md right-ku-md z-50 flex-row items-center justify-between rounded-[16px] border-[1.5px] border-ku-border px-ku-md py-ku-sm",
  workingNowLeft: "flex-1 flex-row items-center gap-[10px]",
  workingNowTitle: "font-ku-semibold text-ku-body-small leading-[19px]",
  workingNowElapsed: "mt-[2px] font-ku-regular text-ku-label leading-[16px]",
} as const;

export const workerHomeQuickAccessShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 8,
} satisfies ViewStyle;

export const workerHomeWorkingNowShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 8,
} satisfies ViewStyle;
