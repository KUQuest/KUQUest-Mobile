const styles = {
  safeArea: "bg-ku-background flex-1",
  scrollContent: "pb-ku-132 px-ku-lg",
  header: "pt-ku-md",
  tagRow: "flex-row flex-wrap gap-ku-xs mt-ku-12",
  tag: "bg-ku-surface-accent rounded-ku-pill px-ku-sm py-ku-xs text-ku-primary font-ku-medium text-ku-label",
  title: "text-ku-text-strong font-ku-bold text-ku-title-large mt-ku-xs",
  canonicalStatus: "text-ku-primary font-ku-semibold text-ku-label mt-ku-xs",
  creatorRow: "items-center flex-row mt-ku-12",
  creatorAvatar:
    "items-center bg-ku-surface-success rounded-ku-pill h-[32px] justify-center w-[32px]",
  creatorCopy: "flex-1 min-w-0 ml-ku-sm",
  creatorLabel: "text-ku-text-muted font-ku-regular text-ku-label",
  creatorValue: "text-ku-text-strong font-ku-medium text-ku-body-small mt-ku-1",
  imageGallery: "gap-ku-sm mt-ku-18",
  imageThumbnailRow: "flex-row gap-ku-sm",
  questImage: "bg-ku-surface-image rounded-[16px] overflow-hidden",
  questImageFeatured: "h-[196px] w-full",
  questImageThumbnail: "flex-1 h-[76px] min-w-0",
  questImageFallback: "items-center bg-ku-surface-muted justify-center p-ku-sm",
  questImageFallbackFeatured: "h-[196px] w-full",
  questImageFallbackThumbnail: "flex-1 h-[76px] min-w-0",
  questImageFallbackText:
    "text-ku-text-muted font-ku-regular text-ku-label text-center mt-ku-xs",
  heroCard:
    "bg-ku-surface-accent border-ku-border-accent rounded-[18px] border mt-ku-20 p-ku-md",
  heroPrimary: "items-center flex-row justify-between pb-ku-14",
  heroRewardValue: "text-ku-primary font-ku-bold text-ku-title mt-ku-2",
  heroSpots: "bg-ku-card rounded-[12px] min-w-[78px] px-ku-12 py-ku-sm",
  heroSpotsLabel: "text-ku-text-secondary font-ku-regular text-ku-label",
  heroSpotsValue: "text-ku-primary font-ku-bold text-ku-subtitle mt-ku-1",
  heroDetails: "border-ku-border-accent border-t flex-row pt-ku-14",
  heroItem: "flex-1 flex-row min-w-0",
  heroItemDivider: "border-l-ku-border-accent border-l ml-ku-10 pl-ku-12",
  heroItemIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[30px] justify-center shrink-0 w-[30px]",
  heroItemCopy: "flex-1 min-w-0 ml-ku-sm",
  heroLabel: "text-ku-text-secondary font-ku-regular text-ku-label",
  heroValue: "text-ku-primary font-ku-bold text-ku-body mt-ku-2",
  heroDetail: "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  heroLocation:
    "items-start border-ku-border-accent border-t flex-row gap-ku-10 mt-ku-14 pt-ku-14",
  heroLocationCopy: "flex-1 min-w-0",
  heroLocationValue: "text-ku-text-strong font-ku-medium text-ku-body mt-ku-2",
  participantRosterCard:
    "bg-ku-surface border-ku-border-subtle rounded-[16px] border mt-ku-md p-ku-14",
  participantRosterHeader: "items-center flex-row justify-between",
  participantRosterTitle: "text-ku-text-strong font-ku-bold text-ku-body",
  participantRosterCount: "text-ku-primary font-ku-bold text-ku-body-small",
  participantRosterList: "gap-ku-10 pt-ku-12",
  participantRosterItem: "items-center min-h-[56px] w-[64px]",
  participantRosterAvatar:
    "items-center bg-ku-surface-success border-ku-border-accent border rounded-ku-pill h-[44px] justify-center overflow-hidden w-[44px]",
  participantRosterAvatarText: "text-ku-primary font-ku-bold text-ku-label",
  participantRosterName:
    "text-ku-text-secondary font-ku-medium text-ku-label mt-ku-xs max-w-[64px] text-center",
  participationCard:
    "bg-ku-primary rounded-[18px] flex-row items-center justify-between mt-ku-md p-ku-md",
  participationCopy: "flex-1 min-w-0 mr-ku-12",
  participationTitle: "text-ku-on-primary font-ku-bold text-ku-body",
  participationDescription:
    "text-ku-on-primary font-ku-regular text-ku-label mt-ku-xs",
  participationAction:
    "items-center bg-ku-on-primary rounded-ku-pill flex-row gap-ku-6 justify-center min-h-[44px] px-ku-12",
  participationActionDisabled: "opacity-60",
  participationActionText: "text-ku-primary font-ku-semibold text-ku-label",
  scheduleCard:
    "bg-ku-surface border-ku-border-subtle rounded-[16px] border mt-ku-lg p-ku-md",
  scheduleHeader: "items-center flex-row",
  scheduleHeaderIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[36px] justify-center shrink-0 w-[36px]",
  scheduleHeaderCopy: "flex-1 min-w-0 ml-ku-10",
  scheduleTitle: "text-ku-text-strong font-ku-bold text-ku-section",
  scheduleDescription:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-1",
  scheduleTimeline: "flex-row mt-ku-20",
  timelineRail: "items-center w-[16px]",
  timelineDotActive: "bg-ku-primary rounded-ku-pill h-[10px] w-[10px]",
  timelineDot:
    "bg-ku-border-accent border-ku-primary border-[2px] rounded-ku-pill h-[10px] w-[10px]",
  timelineLine: "bg-ku-border-accent flex-1 w-[2px]",
  timelineEvents: "flex-1 gap-ku-lg ml-ku-12",
  timelineEvent: "min-h-[64px]",
  timelineLabel: "text-ku-text-secondary font-ku-medium text-ku-label",
  timelineDate: "text-ku-text-strong font-ku-bold text-ku-body mt-ku-2",
  timelineTimeRow: "items-center flex-row flex-wrap gap-ku-xs mt-ku-6",
  timelineTimeLabel: "text-ku-text-secondary font-ku-regular text-ku-label",
  timelineTime: "text-ku-primary font-ku-bold text-ku-body-small ml-ku-2",
  timelineDescription:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-6",
  section: "mt-ku-xl",
  sectionTitle: "text-ku-text-strong font-ku-bold text-ku-section mb-ku-sm",
  body: "text-ku-text-secondary font-ku-regular text-ku-body",
  descriptionCard:
    "bg-ku-surface border-ku-border-subtle rounded-[14px] border p-ku-md",
  requirementCard:
    "bg-ku-surface border-ku-border-subtle rounded-[14px] border gap-ku-10 p-ku-12",
  requirementRow:
    "items-start bg-ku-surface-accent rounded-[12px] flex-row p-ku-12",
  requirementIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[32px] justify-center shrink-0 w-[32px]",
  requirementCopy: "flex-1 min-w-0 ml-ku-10",
  requirementLabel: "text-ku-text-muted font-ku-medium text-ku-label",
  requirementValue: "text-ku-text-strong font-ku-medium text-ku-body-small",
  requirementDescription:
    "text-ku-text-secondary font-ku-regular text-ku-meta mt-ku-2",
  confirmHeader: "items-center flex-row justify-between",
  sheetCloseButton:
    "items-center rounded-ku-pill h-[44px] justify-center ml-ku-sm w-[44px] active:bg-ku-surface-muted",
  statusCard:
    "items-center bg-ku-surface-success border-ku-border-success rounded-[16px] border mt-ku-lg p-ku-md",
  statusCardBlocked: "bg-ku-surface-muted border-ku-border-subtle",
  statusCardOwner: "bg-ku-surface-accent border-ku-border-accent",
  statusCardMuted: "bg-ku-surface-muted border-ku-border-subtle",
  statusTitle: "text-ku-primary font-ku-bold text-ku-emphasis text-center",
  statusDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-xs text-center",
  statusAction:
    "items-center border-ku-primary rounded-ku-pill border mt-ku-12 min-h-[48px] justify-center px-ku-md",
  statusActionDisabled: "opacity-60",
  statusActionText: "text-ku-primary font-ku-semibold text-ku-body-small",
  errorState:
    "items-center bg-ku-surface-danger border-ku-border-danger rounded-[16px] border mt-ku-lg p-ku-20",
  errorTitle: "text-ku-danger-dark font-ku-bold text-ku-emphasis text-center",
  errorDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-6 text-center",
  errorAction:
    "items-center bg-ku-danger rounded-ku-pill justify-center min-h-[48px] mt-ku-md px-ku-20",
  errorActionText: "text-ku-on-primary font-ku-semibold text-ku-body-small",
  prototypeCard:
    "bg-ku-surface border-ku-border-subtle rounded-[16px] border mt-ku-md p-ku-14",
  prototypeCardWarning: "bg-ku-surface-accent border-ku-border-accent",
  prototypeCardDanger: "bg-ku-surface-danger border-ku-border-danger",
  prototypeCardSuccess: "bg-ku-surface-success border-ku-border-success",
  prototypeHeader: "items-center flex-row gap-ku-sm",
  prototypeTitle: "text-ku-text-strong flex-1 font-ku-bold text-ku-body",
  prototypeStatus: "text-ku-primary font-ku-semibold text-ku-label mt-ku-xs",
  prototypeCopy:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-6",
  prototypeMeta: "text-ku-text-muted font-ku-medium text-ku-label mt-ku-6",
  prototypeActions: "flex-row flex-wrap gap-ku-sm mt-ku-12",
  prototypeAction:
    "items-center border-ku-primary rounded-ku-pill border min-h-[44px] justify-center px-ku-14",
  prototypeActionPrimary: "bg-ku-primary",
  prototypeActionText: "text-ku-primary font-ku-semibold text-ku-label",
  prototypeActionTextPrimary: "text-ku-on-primary",
  prototypeActionDanger: "border-ku-danger-dark",
  prototypeActionTextDanger: "text-ku-danger-dark",
  reportCard:
    "bg-ku-surface-danger border-ku-border-danger rounded-[16px] mt-ku-md p-ku-14",
  reportHeader: "items-start flex-row gap-ku-10",
  reportIcon:
    "items-center bg-ku-on-primary rounded-ku-pill h-[36px] justify-center shrink-0 w-[36px]",
  reportCopy: "flex-1 min-w-0",
  reportTitle: "text-ku-danger-dark font-ku-bold text-ku-body",
  reportDescription:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-xs",
  reportAction:
    "items-center bg-ku-danger rounded-ku-pill justify-center min-h-[48px] mt-ku-14 px-ku-md",
  reportActionText: "text-ku-on-primary font-ku-semibold text-ku-body-small",
  prototypeProgress:
    "bg-ku-border-accent rounded-ku-pill h-[6px] mt-ku-10 overflow-hidden w-full",
  prototypeProgressFill: "bg-ku-primary h-full",
  prototypeList: "gap-ku-6 mt-ku-sm",
  prototypeListItem: "text-ku-text-secondary font-ku-regular text-ku-label",
  actionBar:
    "bg-ku-background border-t-ku-border-subtle border-t bottom-0 left-0 p-ku-md absolute right-0",
  actionRow: "flex-row gap-ku-sm",
  messageOwnerAction:
    "items-center border-ku-primary rounded-ku-pill border flex-1 flex-row gap-ku-6 justify-center min-h-[52px] px-ku-10",
  messageOwnerActionDisabled: "opacity-60",
  primaryAction:
    "items-center bg-ku-primary rounded-ku-pill flex-[1.4] justify-center min-h-[52px] px-ku-12",
  primaryActionDisabled: "opacity-60",
  primaryActionText: "text-ku-on-primary font-ku-semibold text-ku-control",
  leaveAction:
    "items-center border-ku-danger-dark rounded-ku-pill border flex-1 flex-row gap-ku-sm justify-center min-h-[52px] px-ku-12",
  leaveActionDisabled: "opacity-60",
  leaveActionText: "text-ku-danger-dark font-ku-semibold text-ku-control",
  modalBackdrop: "bg-ku-overlay flex-1 justify-end",
  confirmSheet: "bg-ku-background rounded-tl-[24px] rounded-tr-[24px] p-ku-lg",
  confirmTitle: "text-ku-text-strong font-ku-bold text-ku-title-small",
  confirmDescription:
    "text-ku-text-secondary font-ku-regular text-ku-control mt-ku-xs",
  confirmSummary:
    "bg-ku-surface-accent rounded-[14px] gap-ku-6 mt-ku-md p-ku-md",
  confirmSummaryText: "text-ku-text-strong font-ku-medium text-ku-body-small",
  confirmActions: "flex-row gap-ku-sm mt-ku-lg",
  cancelAction:
    "items-center border-ku-border rounded-ku-pill border flex-1 justify-center min-h-[50px]",
  cancelActionText: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  confirmAction:
    "items-center bg-ku-primary rounded-ku-pill flex-[1.4] justify-center min-h-[50px]",
  confirmActionText: "text-ku-on-primary font-ku-semibold text-ku-body-small",
  proofSheetBackdrop: "bg-ku-overlay flex-1 justify-end",
  proofSheet:
    "bg-ku-background rounded-tl-[24px] rounded-tr-[24px] max-h-[90%] p-ku-lg",
  proofSheetHeader: "items-start flex-row justify-between",
  proofSheetHeaderCopy: "flex-1 min-w-0",
  proofSheetTitle: "text-ku-text-strong font-ku-bold text-ku-title-small",
  proofSheetDescription:
    "text-ku-text-secondary font-ku-regular text-ku-control mt-ku-xs",
  proofSheetContent: "gap-ku-xs pb-ku-md pt-ku-20",
  proofSheetHelper:
    "text-ku-text-secondary font-ku-regular text-ku-label mb-ku-12",
  proofAttachmentTrigger:
    "items-center border-ku-primary rounded-[12px] border flex-row gap-ku-sm justify-center min-h-[48px] px-ku-12",
  proofAttachmentTriggerDisabled: "opacity-50",
  proofAttachmentTriggerText:
    "text-ku-primary font-ku-semibold text-ku-body-small",
  proofAttachmentCount:
    "text-ku-text-muted font-ku-regular text-ku-label mt-ku-sm",
  proofAttachmentGrid: "flex-row flex-wrap gap-ku-sm mt-ku-sm",
  proofAttachment:
    "bg-ku-surface-muted rounded-[12px] h-[88px] overflow-hidden relative w-[88px]",
  proofAttachmentImage: "h-full w-full",
  proofAttachmentRemove:
    "absolute bg-ku-overlay items-center justify-center right-[4px] rounded-ku-pill top-[4px] h-[28px] w-[28px]",
  proofValidation: "text-ku-danger-dark font-ku-medium text-ku-label mt-ku-sm",
  proofSheetActions: "gap-ku-sm pt-ku-12",
} as const;

export default styles;
