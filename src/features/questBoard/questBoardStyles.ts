const styles = {
  safeArea: "bg-ku-background flex-1",
  scrollContent: "",
  boardIntro: "pb-ku-md pt-ku-sm",
  boardIntroRow: "items-start flex-row justify-between",
  boardIntroActions: "items-center flex-row ml-ku-sm",
  roleplayShortcut:
    "items-center bg-ku-surface-accent border-ku-border-accent border min-h-[44px] justify-center mr-ku-sm px-ku-10 rounded-ku-pill",
  roleplayShortcutText: "font-ku-semibold text-ku-label text-ku-primary",
  boardIntroCopy: "flex-1 min-w-0 pr-ku-sm",
  boardTitle: "text-ku-text-strong font-ku-bold text-ku-title",
  boardSubtitle:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-xs",
  searchField:
    "items-center bg-ku-surface border-ku-border-accent rounded-[18px] border flex-row min-h-[56px] px-ku-md",
  searchInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body min-h-[54px] px-ku-sm",
  iconButton: "items-center h-[48px] justify-center w-[48px]",
  toolbar: "items-center flex-row justify-between mt-ku-md",
  toolbarButton:
    "items-center rounded-ku-pill flex-row min-h-[48px] px-ku-sm py-ku-xs active:bg-ku-surface-muted",
  toolbarButtonActive: "bg-ku-primary",
  toolbarButtonRight: "justify-end",
  toolbarText: "text-ku-text-strong font-ku-semibold text-ku-control ml-ku-xs",
  toolbarTextActive: "text-ku-on-primary",
  filterCount:
    "items-center bg-ku-primary rounded-ku-pill h-[20px] justify-center ml-ku-xs min-w-[20px] px-ku-5",
  filterCountText: "text-ku-on-primary font-ku-bold text-ku-caption",
  activeFilters: "flex-row flex-wrap gap-ku-sm mt-ku-xs",
  filterChip:
    "items-center bg-ku-surface-success border-ku-border-success rounded-ku-pill border flex-row min-h-[48px] px-ku-10",
  filterChipText: "text-ku-success font-ku-medium text-ku-label",
  cards: "gap-ku-sm mt-ku-md",
  cardSeparator: "h-[8px]",
  card: "shadow-[0px_2px_5px_rgb(18_32_24_/0.06)] bg-ku-card border-ku-border-accent rounded-[16px] border p-ku-md active:bg-ku-surface-muted",
  cardBody: "rounded-[10px]",
  ownerRow: "flex-row items-center mb-ku-sm gap-ku-sm",
  ownerAvatar:
    "w-[28px] h-[28px] rounded-ku-pill bg-ku-surface-accent border border-ku-border-accent items-center justify-center overflow-hidden",
  ownerAvatarText: "text-ku-primary font-ku-bold text-ku-caption",
  ownerName: "text-ku-text-secondary font-ku-medium text-ku-body-small flex-1",
  cardTopRow: "items-start flex-row justify-between",
  cardTitleColumn: "flex-1 min-w-0 mr-ku-sm",
  cardTitle: "text-ku-text-strong font-ku-bold text-ku-subtitle",
  cardCategory:
    "items-center bg-ku-surface-accent rounded-ku-pill flex-row self-start min-h-[32px] mt-ku-sm px-ku-sm",
  cardCategoryText: "text-ku-primary font-ku-medium text-ku-label ml-ku-xs",
  rewardBlock:
    "bg-ku-surface-success border-ku-border-success rounded-[14px] border shrink-0 min-w-[88px] px-ku-10 py-ku-sm",
  rewardAmount: "text-ku-primary font-ku-bold text-ku-emphasis-large",
  rewardUnit: "text-ku-text-secondary font-ku-regular text-ku-caption",
  cardDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-12",
  cardDivider: "bg-ku-border-subtle h-[1px] mt-ku-md mb-ku-12 w-full",
  infoList: "gap-ku-xs",
  infoRow: "items-center flex-row min-h-[36px]",
  infoIcon:
    "items-center bg-ku-surface-muted rounded-[11px] h-[36px] justify-center shrink-0 w-[36px]",
  infoIconMuted: "bg-ku-surface-muted",
  infoText:
    "text-ku-text-secondary font-ku-regular text-ku-body-small ml-ku-sm",
  infoTextPrimary: "text-ku-text-strong font-ku-medium",
  infoTextFlexible: "flex-1 min-w-0",
  participantCount:
    "items-center bg-ku-surface-accent rounded-[12px] justify-center min-h-[32px] min-w-[48px] ml-ku-sm px-ku-sm",
  participantCountText: "text-ku-primary font-ku-medium text-ku-body-small",
  spotsLeftText:
    "text-ku-success flex-1 font-ku-medium text-ku-label ml-ku-sm text-right",
  locationContent: "flex-1 min-w-0 ml-ku-sm",
  locationText:
    "text-ku-text-strong font-ku-regular text-ku-body-small min-w-0",
  cardFooter:
    "items-center border-ku-border-subtle border-t flex-row justify-end mt-ku-12 pt-ku-12",
  cardAccessibilityMeta: "absolute h-0 opacity-0 w-0",
  retryStatus:
    "text-ku-success font-ku-medium text-ku-meta text-center mt-ku-sm",
  state: "items-center justify-center min-h-[330px] px-ku-lg",
  stateIcon:
    "items-center bg-ku-surface-accent rounded-ku-pill h-[68px] justify-center mb-ku-md w-[68px]",
  stateTitle:
    "text-ku-text-strong font-ku-semibold text-ku-emphasis-large text-center",
  stateDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-xs text-center",
  stateAction:
    "bg-ku-primary rounded-ku-pill mt-ku-md min-h-[48px] justify-center px-ku-lg",
  stateActionText: "text-ku-on-primary font-ku-semibold text-ku-body-small",
  skeletonCard:
    "bg-ku-card border-ku-border-accent rounded-[16px] border p-ku-md",
  modalBackdrop: "bg-ku-overlay flex-1 justify-end",
  sheet:
    "bg-ku-background rounded-tl-[24px] rounded-tr-[24px] max-h-[88%] px-ku-lg pt-ku-sm",
  sheetScroll: "flex-1",
  sheetHandle:
    "self-center bg-ku-border rounded-ku-pill h-[4px] mb-ku-md w-[42px]",
  sheetHeader: "items-center flex-row justify-between mb-ku-lg",
  sheetHeaderCopy: "flex-1 min-w-0",
  sheetTitle: "text-ku-text-strong font-ku-bold text-ku-title-small",
  sheetSummary: "text-ku-text-muted font-ku-regular text-ku-label mt-ku-2",
  sheetCloseButton:
    "items-center rounded-ku-pill h-[48px] justify-center ml-ku-sm w-[48px] active:bg-ku-surface-muted",
  sheetScrollContent: "pb-ku-sm",
  sheetSection: "mb-ku-md",
  sheetSectionTitle:
    "text-ku-text-secondary font-ku-semibold text-ku-meta mb-ku-xs",
  selectedTags: "flex-row flex-wrap gap-ku-xs mb-ku-sm",
  selectedTag:
    "items-center bg-ku-surface-success border-ku-border-success rounded-ku-pill border flex-row min-h-[48px] px-ku-10",
  selectedTagText: "text-ku-success font-ku-medium text-ku-label mr-ku-xs",
  tagSearchField:
    "items-center bg-ku-surface border-ku-border-muted rounded-[8px] border flex-row min-h-[48px] px-ku-12",
  tagSearchInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body-small min-h-[46px] px-ku-sm",
  tagSuggestions: "flex-row flex-wrap gap-ku-xs mt-ku-sm",
  noTagResults:
    "text-ku-text-muted font-ku-regular text-ku-body-small mt-ku-sm",
  optionList: "flex-row flex-wrap gap-ku-xs",
  option:
    "bg-ku-surface border-ku-border rounded-ku-pill border min-h-[48px] justify-center px-ku-md active:bg-ku-surface-muted",
  optionSelected: "bg-ku-surface-accent border-ku-primary",
  optionText: "text-ku-text-secondary font-ku-medium text-ku-meta",
  optionTextSelected: "text-ku-primary font-ku-semibold",
  rewardInputs: "flex-row gap-ku-sm",
  rewardField: "flex-1 gap-ku-xs",
  rewardFieldLabel: "text-ku-text-secondary font-ku-semibold text-ku-label",
  rewardInput:
    "bg-ku-surface border-ku-border-muted rounded-[8px] border font-ku-regular text-ku-text-strong min-h-[48px] px-ku-12",
  rewardError: "text-ku-danger font-ku-regular text-ku-label mt-ku-xs",
  sheetActions:
    "items-center border-t-ku-border-subtle border-t flex-row gap-ku-sm mt-ku-sm pt-ku-md",
  cancelAction: "items-center justify-center min-h-[48px] px-ku-sm",
  cancelActionText: "text-ku-text-secondary font-ku-semibold text-ku-meta",
  secondaryAction:
    "items-center border-ku-border rounded-ku-pill border flex-[0.9] justify-center min-h-[48px] px-ku-sm",
  secondaryActionText: "text-ku-text-strong font-ku-semibold text-ku-meta",
  primaryAction:
    "items-center bg-ku-primary rounded-ku-pill flex-[1.4] justify-center min-h-[48px] px-ku-sm",
  primaryActionDisabled: "opacity-[0.5]",
  primaryActionText: "text-ku-on-primary font-ku-semibold text-ku-body-small",
  alertIcon: "bg-ku-surface-danger",
} as const;

export default styles;
