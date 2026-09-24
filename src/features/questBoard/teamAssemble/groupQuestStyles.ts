const styles = {
  sheetOverlay: "bg-ku-overlay flex-1 justify-end",
  sheetOverlayFullScreen: "bg-ku-card flex-1",
  sheetBackdrop: "absolute bottom-0 left-0 right-0 top-0",
  sheet:
    "bg-ku-card max-h-[92%] min-h-[360px] rounded-tl-[24px] rounded-tr-[24px] px-ku-20 pt-ku-12",
  sheetFullScreen: "bg-ku-card flex-1 px-ku-20 pt-ku-12",
  sheetHandle:
    "self-center bg-ku-border-accent rounded-ku-pill h-[4px] mb-ku-14 w-[40px]",
  sheetHeader: "items-start flex-row justify-between",
  sheetHeading: "flex-1 min-w-0 pr-ku-12",
  sheetTitle: "text-ku-text-strong font-ku-bold text-ku-title-small",
  sheetSubtitle:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-3",
  sheetClose:
    "items-center bg-ku-surface-muted rounded-ku-pill h-[44px] justify-center w-[44px]",
  sheetScroll: "flex-1",
  sheetContent: "pb-ku-sm pt-ku-md",
  section: "mt-ku-md",
  sectionFirst: "mt-ku-0",
  sectionHeader: "items-center flex-row justify-between",
  sectionTitle: "text-ku-text-strong font-ku-semibold text-ku-body",
  sectionMeta: "text-ku-primary font-ku-semibold text-ku-body-small",
  helper: "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-xs",
  notice:
    "bg-ku-surface-accent border-ku-border-accent rounded-[14px] border flex-row items-start px-ku-12 py-ku-11",
  noticeSuccess: "bg-ku-surface-success border-ku-border-success",
  noticeDanger: "bg-ku-surface-danger border-ku-border-danger",
  noticeIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[32px] justify-center shrink-0 w-[32px]",
  noticeIconDanger: "bg-ku-surface-danger",
  noticeCopy: "flex-1 min-w-0 ml-ku-9",
  noticeTitle: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  noticeText: "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  searchField:
    "items-center bg-ku-surface border-ku-border rounded-[18px] border flex-row min-h-[56px] px-ku-14 mt-ku-sm",
  searchInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body ml-ku-9 min-h-[52px]",
  searchClear:
    "items-center rounded-ku-pill h-[44px] justify-center ml-ku-xs w-[44px]",
  memberList: "gap-ku-sm mt-ku-10",
  memberRow:
    "bg-ku-surface-muted border-ku-border-subtle border rounded-[14px] flex-row items-center min-h-[64px] px-ku-10 py-ku-7",
  memberRowSelected: "bg-ku-surface-success border-ku-border-success",
  memberRowDisabled: "opacity-60",
  memberSelect: "items-center flex-1 flex-row min-h-[48px] min-w-0",
  memberSelectionBox:
    "items-center border-ku-border-accent border rounded-[7px] h-[24px] justify-center shrink-0 w-[24px]",
  memberSelectionBoxSelected: "bg-ku-primary border-ku-primary",
  memberAvatar:
    "items-center bg-ku-surface-success rounded-ku-pill h-[40px] justify-center ml-ku-9 w-[40px]",
  memberAvatarText: "text-ku-primary font-ku-bold text-ku-label",
  memberCopy: "flex-1 min-w-0 ml-ku-9",
  memberName: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  memberHandle: "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-1",
  memberInvite:
    "items-center border-ku-primary rounded-ku-pill border min-h-[44px] justify-center ml-ku-sm px-ku-11",
  memberInviteText: "text-ku-primary font-ku-semibold text-ku-label",
  bulkInviteBar:
    "items-center bg-ku-surface-accent border-ku-border-accent border rounded-[14px] flex-row mt-ku-10 px-ku-12 py-ku-sm",
  bulkInviteCopy: "flex-1 min-w-0",
  bulkInviteText: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  bulkInviteButton:
    "items-center bg-ku-primary rounded-ku-pill min-h-[48px] justify-center ml-ku-10 px-ku-14",
  bulkInviteButtonText: "text-ku-on-primary font-ku-semibold text-ku-label",
  emptyState:
    "items-center bg-ku-surface-muted border-ku-border-subtle border-dashed rounded-[16px] justify-center min-h-[190px] px-ku-lg py-ku-lg",
  emptyIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[52px] justify-center mb-ku-10 w-[52px]",
  emptyTitle: "text-ku-text-strong font-ku-semibold text-ku-body text-center",
  emptyText:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-5 text-center",
  retryButton:
    "items-center bg-ku-primary rounded-ku-pill min-h-[48px] justify-center mt-ku-12 px-ku-20",
  retryButtonText: "text-ku-on-primary font-ku-semibold text-ku-body-small",
  rosterCard:
    "bg-ku-surface border-ku-border-subtle border rounded-[16px] mt-ku-sm p-ku-12",
  rosterHeader: "items-center flex-row justify-between",
  rosterCount: "text-ku-primary font-ku-bold text-ku-body-small",
  rosterList: "gap-ku-xs mt-ku-sm",
  rosterRow: "items-center flex-row min-h-[44px] px-ku-2",
  rosterAvatar:
    "items-center bg-ku-surface-success rounded-ku-pill h-[32px] justify-center w-[32px]",
  rosterAvatarText: "text-ku-primary font-ku-bold text-ku-caption",
  rosterCopy: "flex-1 min-w-0 ml-ku-sm",
  rosterName: "text-ku-text-strong font-ku-medium text-ku-body-small",
  rosterRole: "text-ku-text-muted font-ku-regular text-ku-label mt-ku-1",
  rosterStatus: "text-ku-success font-ku-semibold text-ku-label ml-ku-sm",
  invitationList: "gap-ku-sm mt-ku-sm",
  invitationRow:
    "bg-ku-surface-muted border-ku-border-subtle border rounded-[14px] px-ku-12 py-ku-10",
  invitationHeader: "items-start flex-row",
  invitationCopy: "flex-1 min-w-0",
  invitationName: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  invitationStatus:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  invitationExpiry: "text-ku-text-muted font-ku-regular text-ku-label mt-ku-1",
  invitationActions: "flex-row gap-ku-sm mt-ku-sm",
  invitationAction:
    "items-center border-ku-primary rounded-ku-pill border flex-1 min-h-[44px] justify-center px-ku-sm",
  invitationActionAccept: "bg-ku-primary",
  invitationActionDecline: "border-ku-danger-dark",
  invitationActionText:
    "text-ku-primary font-ku-semibold text-ku-label text-center",
  invitationActionTextAccept: "text-ku-on-primary",
  invitationActionTextDecline: "text-ku-danger-dark",
  reviewCard:
    "bg-ku-surface-accent border-ku-border-accent rounded-[16px] border mt-ku-sm p-ku-14",
  reviewHeader: "items-center flex-row gap-ku-9",
  reviewIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[38px] justify-center w-[38px]",
  reviewHeaderCopy: "flex-1 min-w-0",
  reviewHeading: "text-ku-text-strong font-ku-semibold text-ku-body",
  reviewCopy: "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  reviewRows: "gap-ku-6 mt-ku-12",
  reviewRow: "flex-row items-start",
  reviewLabel:
    "text-ku-text-secondary flex-1 font-ku-regular text-ku-body-small",
  reviewValue:
    "text-ku-text-strong font-ku-semibold text-ku-body-small text-right",
  submitButton:
    "items-center bg-ku-primary rounded-ku-pill flex-row gap-ku-7 justify-center min-h-[52px] mt-ku-md px-ku-md",
  submitButtonDisabled: "bg-ku-surface-muted border-ku-border-muted border",
  submitButtonText:
    "text-ku-on-primary font-ku-semibold text-ku-body text-center",
  submitButtonTextDisabled: "text-ku-text-muted",
  proposalSummary:
    "bg-ku-surface-accent border-ku-border-accent rounded-[16px] border mt-ku-12 p-ku-12",
  proposalSummaryHeader: "items-center flex-row justify-between",
  proposalSummaryTitle:
    "text-ku-text-strong font-ku-semibold text-ku-body-small",
  proposalSummaryCount: "text-ku-primary font-ku-semibold text-ku-label",
  settlement:
    "bg-ku-surface border-ku-border-subtle border rounded-[16px] mt-ku-12 p-ku-12",
  settlementHeader: "items-center flex-row justify-between",
  settlementTitle: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  settlementRows: "gap-ku-5 mt-ku-sm",
  settlementRow: "flex-row items-start",
  settlementLabel:
    "text-ku-text-secondary flex-1 font-ku-regular text-ku-label",
  settlementValue:
    "text-ku-text-strong font-ku-semibold text-ku-label text-right",
  settlementRefund: "text-ku-success",
  proposalList: "gap-ku-sm mt-ku-10",
  proposalRow:
    "bg-ku-surface-muted border-ku-border-subtle border rounded-[16px] p-ku-12",
  proposalHeaderRow: "items-start flex-row",
  proposalRowSelected: "bg-ku-surface-success border-ku-primary",
  proposalRowRejected: "bg-ku-surface-danger border-ku-border-danger",
  proposalRowSelectedStatus: "bg-ku-primary border-ku-primary",
  proposalRowStatus:
    "items-center border rounded-ku-pill flex-row min-h-[28px] px-ku-sm",
  proposalRowStatusText: "font-ku-semibold text-ku-label",
  proposalSelect: "items-start flex-row min-h-[48px]",
  proposalSelectionBox:
    "items-center border-ku-border-accent border rounded-ku-pill h-[24px] justify-center mt-ku-1 w-[24px]",
  proposalSelectionBoxSelected: "bg-ku-primary border-ku-primary",
  proposalCopy: "flex-1 min-w-0 ml-ku-9",
  proposalName: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  proposalIdentity: "flex-row flex-wrap items-center gap-ku-xs",
  proposalRating: "text-ku-text-secondary font-ku-medium text-ku-label",
  proposalDetail:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  proposalMembers: "gap-ku-2 mt-ku-6",
  proposalMember: "text-ku-text-secondary font-ku-regular text-ku-label",
  proposalActions: "flex-row gap-ku-sm mt-ku-sm",
  proposalAction:
    "items-center border-ku-primary rounded-ku-pill border flex-1 min-h-[44px] justify-center px-ku-sm",
  proposalActionAccept: "bg-ku-primary",
  proposalActionReject: "border-ku-danger-dark",
  proposalActionText:
    "text-ku-primary font-ku-semibold text-ku-label text-center",
  proposalActionTextAccept: "text-ku-on-primary",
  proposalActionTextReject: "text-ku-danger-dark",
  consentStatusCard:
    "bg-ku-surface-accent border-ku-border-accent rounded-[16px] border mt-ku-12 p-ku-14",
  consentStatusCardApproved: "bg-ku-surface-success border-ku-border-success",
  consentStatusCardCancelled: "bg-ku-surface-danger border-ku-border-danger",
  consentStatusHeader: "items-center flex-row gap-ku-9",
  consentStatusIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[38px] justify-center w-[38px]",
  consentStatusIconCancelled: "bg-ku-surface-danger",
  consentStatusCopy: "flex-1 min-w-0",
  consentStatusTitle: "text-ku-text-strong font-ku-semibold text-ku-body",
  consentStatusDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-3",
  countdownCard:
    "items-center bg-ku-card border-ku-border-accent border rounded-[14px] flex-row justify-between mt-ku-12 px-ku-12 py-ku-10",
  countdownLabel: "text-ku-text-secondary font-ku-regular text-ku-body-small",
  countdownValue: "text-ku-primary font-ku-bold text-ku-title-small",
  progressTrack:
    "bg-ku-border-accent rounded-ku-pill h-[6px] mt-ku-10 overflow-hidden w-full",
  progressFill: "bg-ku-primary h-full",
  voterSection: "mt-ku-md",
  voterList: "gap-ku-6 mt-ku-sm",
  voterRow:
    "items-center bg-ku-surface border-ku-border-subtle border rounded-[12px] flex-row min-h-[52px] px-ku-10",
  voterAvatar:
    "items-center bg-ku-surface-success rounded-ku-pill h-[32px] justify-center w-[32px]",
  voterAvatarText: "text-ku-primary font-ku-bold text-ku-caption",
  voterCopy: "flex-1 min-w-0 ml-ku-sm",
  voterName: "text-ku-text-strong font-ku-medium text-ku-body-small",
  voterRole: "text-ku-text-muted font-ku-regular text-ku-label mt-ku-1",
  voterStatus: "font-ku-semibold text-ku-label ml-ku-6",
  voterStatusPending: "text-ku-text-muted",
  voterStatusApproved: "text-ku-success",
  voterStatusRejected: "text-ku-danger-dark",
  consentActions: "flex-row gap-ku-sm mt-ku-md",
  consentAction:
    "items-center border rounded-ku-pill flex-1 min-h-[52px] justify-center px-ku-10",
  consentActionApprove: "bg-ku-primary border-ku-primary",
  consentActionReject: "border-ku-danger-dark",
  consentActionText: "font-ku-semibold text-ku-body-small text-center",
  consentActionTextApprove: "text-ku-on-primary",
  consentActionTextReject: "text-ku-danger-dark",
  chatHint:
    "bg-ku-surface-accent rounded-[12px] flex-row items-start mt-ku-12 px-ku-11 py-ku-9",
  chatHintText:
    "text-ku-text-secondary flex-1 font-ku-regular text-ku-label ml-ku-sm",
} as const;

export default styles;
