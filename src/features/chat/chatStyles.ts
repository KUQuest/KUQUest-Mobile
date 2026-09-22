const styles = {
  safeArea: "flex-1 bg-ku-background",
  content: "self-center w-full max-w-[720px]",
  listContent: "px-ku-lg pb-ku-lg",
  intro: "pb-ku-md pt-ku-sm",
  title: "text-ku-text-strong font-ku-bold text-ku-title",
  subtitle:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-xs",
  searchField:
    "items-center bg-ku-surface border-ku-border-accent rounded-[18px] border flex-row min-h-[56px] px-ku-12 mt-ku-sm",
  searchIcon: "items-center justify-center h-[40px] w-[40px]",
  searchInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body min-h-[52px] px-ku-sm",
  sectionHeading: "items-center flex-row justify-between mb-ku-sm mt-ku-sm",
  sectionTitle: "text-ku-text-strong font-ku-semibold text-ku-subtitle",
  sectionCount: "text-ku-text-muted font-ku-medium text-ku-meta",
  conversationList: "gap-ku-sm",
  conversationRow:
    "items-center bg-ku-white border-ku-border-accent rounded-[16px] border flex-row min-h-[88px] p-ku-12 active:bg-ku-surface-muted",
  avatar:
    "items-center overflow-hidden rounded-ku-pill shrink-0 h-[48px] justify-center w-[48px]",
  avatarText: "text-ku-primary-deep font-ku-bold text-ku-body-small",
  avatarSmall: "h-[36px] w-[36px] overflow-hidden rounded-ku-pill",
  avatarSmallText: "text-ku-primary-deep font-ku-bold text-ku-label",
  rowCopy: "flex-1 min-w-0 ml-ku-12",
  questTitle: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  participant: "text-ku-primary font-ku-medium text-ku-label mt-ku-1",
  latestMessage:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-xs",
  rowMeta: "items-end self-start ml-ku-sm",
  rowTime: "text-ku-text-muted font-ku-regular text-ku-caption",
  unreadBadge:
    "items-center bg-ku-primary rounded-ku-pill h-[22px] justify-center min-w-[22px] mt-ku-sm px-ku-5",
  unreadText: "text-ku-on-primary font-ku-bold text-ku-caption",
  emptyState: "items-center justify-center px-ku-lg py-ku-64",
  emptyIcon:
    "items-center bg-ku-surface-accent rounded-ku-pill h-[68px] justify-center mb-ku-md w-[68px]",
  emptyTitle:
    "text-ku-text-strong font-ku-semibold text-ku-emphasis-large text-center",
  emptyDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-xs text-center",
  loadErrorState:
    "items-center bg-ku-surface-danger border-ku-border-danger rounded-[16px] border gap-ku-sm min-h-[180px] justify-center px-ku-lg py-ku-28",
  loadErrorTitle:
    "text-ku-danger-dark font-ku-semibold text-ku-body-small text-center",
  loadErrorAction:
    "items-center bg-ku-primary rounded-ku-pill justify-center min-h-[48px] mt-ku-sm px-ku-lg",
  loadErrorActionText: "text-ku-on-primary font-ku-semibold text-ku-body-small",
  detailHeader: "bg-ku-surface border-b-ku-border-subtle border-b",
  brandRow:
    "items-center flex-row justify-start min-h-[48px] px-ku-md pt-ku-xs",
  backButton:
    "items-center justify-center rounded-ku-pill h-[48px] w-[48px] active:bg-ku-surface-muted",
  identityRow: "items-center flex-row min-h-[72px] px-ku-md pb-ku-12 pt-ku-xs",
  identityCopy: "flex-1 min-w-0 ml-ku-10",
  identityTitle: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  identityMeta: "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-1",
  headerActions: "items-center flex-row ml-ku-sm",
  headerAction:
    "items-center justify-center rounded-ku-pill h-[44px] w-[44px] active:bg-ku-surface-muted",
  contextCard:
    "items-center bg-ku-surface-accent border-ku-border-accent rounded-[16px] border flex-row mx-ku-lg mt-ku-md p-ku-12",
  contextIcon:
    "items-center bg-ku-white rounded-[12px] h-[40px] justify-center w-[40px]",
  contextCopy: "flex-1 min-w-0 ml-ku-10",
  contextLabel: "text-ku-text-muted font-ku-medium text-ku-label",
  contextTitle: "text-ku-primary font-ku-semibold text-ku-body-small mt-ku-1",
  contextAction: "items-center justify-center min-h-[40px] ml-ku-sm px-ku-xs",
  contextActionText: "text-ku-primary font-ku-semibold text-ku-label",
  reportAction:
    "items-center bg-ku-surface-danger border-ku-border-danger rounded-[16px] border flex-row mx-ku-lg mt-ku-12 p-ku-12",
  reportActionIcon:
    "items-center bg-ku-white rounded-[10px] h-[36px] justify-center w-[36px]",
  reportActionCopy: "flex-1 min-w-0 ml-ku-10",
  reportActionText: "text-ku-danger-dark font-ku-semibold text-ku-body-small",
  reportActionDescription:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  readOnlyBanner:
    "bg-ku-surface-muted border-ku-border-subtle rounded-[14px] border mx-ku-lg mt-ku-12 px-ku-12 py-ku-10",
  readOnlyBannerTitle:
    "text-ku-text-strong font-ku-semibold text-ku-body-small",
  readOnlyBannerText:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  searchPanel: "bg-ku-background px-ku-lg pb-ku-xs pt-ku-12",
  compactSearchField:
    "items-center bg-ku-surface border-ku-border-accent rounded-[18px] border flex-row min-h-[52px] px-ku-sm",
  compactSearchInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body-small min-h-[48px] px-ku-6",
  scopeSwitch: "bg-ku-surface-muted rounded-ku-pill flex-row mt-ku-sm p-ku-3",
  scopeItem: "items-center flex-1 justify-center min-h-[36px] px-ku-sm",
  scopeItemActive: "bg-ku-white rounded-ku-pill",
  scopeText: "text-ku-text-secondary font-ku-medium text-ku-label",
  scopeTextActive: "text-ku-primary font-ku-semibold",
  resultMeta:
    "text-ku-text-muted font-ku-medium text-ku-label px-ku-lg pt-ku-12",
  messageContent: "px-ku-lg pt-ku-20",
  dateSeparator:
    "self-center bg-ku-surface-muted rounded-ku-pill px-ku-10 py-ku-5",
  dateText: "text-ku-text-muted font-ku-medium text-ku-caption",
  messageRow: "items-end flex-row mt-ku-md",
  messageRowMe: "justify-end",
  messageAvatar:
    "items-center rounded-ku-pill h-[32px] justify-center mr-ku-sm w-[32px]",
  messageAvatarText: "text-ku-primary-deep font-ku-bold text-ku-caption",
  messageStack: "max-w-[78%] min-w-0",
  messageStackMe: "items-end",
  messageBubble: "bg-ku-surface-muted rounded-[18px] px-ku-14 py-ku-10",
  messageBubbleMe: "bg-ku-success-light rounded-[18px] px-ku-14 py-ku-10",
  messageText: "text-ku-text-strong font-ku-regular text-ku-body-small",
  messageMeta:
    "text-ku-text-muted font-ku-regular text-ku-caption mt-ku-xs px-ku-xs",
  attachmentBubble:
    "items-center bg-ku-success-light rounded-[18px] flex-row min-h-[60px] mt-ku-xs px-ku-10 py-ku-sm",
  attachmentBubbleOther: "bg-ku-surface-muted",
  attachmentIcon:
    "items-center bg-ku-surface-accent rounded-[10px] h-[40px] justify-center w-[40px]",
  attachmentCopy: "flex-1 min-w-0 ml-ku-sm",
  attachmentName: "text-ku-text-strong font-ku-medium text-ku-body-small",
  attachmentMeta: "text-ku-text-muted font-ku-regular text-ku-caption mt-ku-1",
  fileList: "gap-ku-sm px-ku-lg pt-ku-md",
  fileRow:
    "items-center bg-ku-white border-ku-border-accent rounded-[14px] border flex-row min-h-[68px] p-ku-10 active:bg-ku-surface-muted",
  fileType: "items-center rounded-[10px] h-[42px] justify-center w-[42px]",
  fileTypePdf: "bg-ku-surface-danger",
  fileTypeImage: "bg-ku-surface-accent",
  fileCopy: "flex-1 min-w-0 ml-ku-10",
  fileName: "text-ku-text-strong font-ku-medium text-ku-body-small",
  fileMeta: "text-ku-text-muted font-ku-regular text-ku-caption mt-ku-2",
  searchEmpty: "items-center px-ku-lg py-ku-56",
  searchEmptyText:
    "text-ku-text-secondary font-ku-regular text-ku-body-small text-center",
  composerWrap:
    "bg-ku-background border-ku-border-subtle border-t px-ku-md pb-ku-sm pt-ku-sm",
  composer:
    "items-center bg-ku-surface-muted rounded-[24px] flex-row min-h-[56px] px-ku-6",
  composerButton:
    "items-center justify-center rounded-ku-pill h-[44px] w-[44px] active:bg-ku-surface",
  composerInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body-small min-h-[48px] px-ku-sm",
  sendButton:
    "items-center bg-ku-primary rounded-ku-pill h-[42px] justify-center w-[42px]",
  inlineImageWrap:
    "rounded-[14px] overflow-hidden mt-ku-xs border border-ku-border-subtle bg-ku-surface-muted max-w-[260px] max-h-[320px]",
  inlineImage: "w-[240px] h-[160px] max-w-[260px] max-h-[320px] rounded-[14px]",
  pendingAttachmentsBar:
    "flex-row px-ku-md py-ku-sm bg-ku-background border-t border-ku-border-subtle gap-ku-sm",
  pendingAttachmentChip:
    "relative w-[64px] h-[64px] rounded-[10px] overflow-hidden border border-ku-border-accent bg-ku-surface-muted items-center justify-center",
  pendingAttachmentImage: "w-full h-full",
  pendingAttachmentRemove:
    "absolute top-[2px] right-[2px] bg-ku-overlay rounded-full w-[20px] h-[20px] items-center justify-center",
  pendingAttachmentUploading:
    "absolute inset-0 bg-ku-overlay items-center justify-center",
} as const;

export default styles;
