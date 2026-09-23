const styles = {
  safeArea: "flex-1 bg-ku-background",
  content: "self-center w-full max-w-[720px]",
  listContent: "px-ku-md pb-ku-lg",
  intro:
    "bg-ku-primary-subtle rounded-ku-sheet mb-ku-lg mt-ku-sm gap-ku-xs px-ku-lg pb-ku-lg pt-ku-lg",
  title: "text-ku-text-strong font-ku-bold text-ku-title-large",
  subtitle: "text-ku-text-secondary font-ku-regular text-ku-body-small",
  searchField:
    "items-center bg-ku-surface border-ku-border rounded-ku-search border flex-row min-h-ku-56 pl-ku-sm pr-ku-xs mt-ku-md",
  searchIcon: "items-center justify-center h-ku-40 w-ku-40",
  searchInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body min-h-ku-52 px-ku-sm",
  clearSearch:
    "items-center justify-center rounded-ku-pill h-ku-48 w-ku-48 active:bg-ku-surface-raised",
  sectionHeading:
    "items-center flex-row flex-wrap justify-between gap-ku-xs mb-ku-sm mt-ku-sm",
  sectionTitle: "text-ku-text-strong font-ku-semibold text-ku-section",
  sectionCount: "text-ku-text-secondary font-ku-medium text-ku-meta",
  inquiryHeading:
    "items-center bg-ku-support-subtle rounded-ku-card flex-row flex-wrap gap-ku-sm min-h-ku-56 mt-ku-lg mb-ku-xs px-ku-12 py-ku-sm",
  inquiryIcon: "items-center justify-center h-ku-40 w-ku-40",
  inquiryTitle: "text-ku-support font-ku-semibold text-ku-subtitle flex-1",
  inquiryCount: "text-ku-support font-ku-medium text-ku-meta",
  conversationRow:
    "items-center border-b-ku-divider border-b flex-row min-h-ku-88 px-ku-sm py-ku-12 active:bg-ku-surface-raised",
  avatar:
    "items-center overflow-hidden rounded-ku-pill shrink-0 h-ku-48 justify-center w-ku-48",
  avatarText: "text-ku-primary-deep font-ku-bold text-ku-body-small",
  avatarSmall: "h-ku-36 w-ku-36 overflow-hidden rounded-ku-pill",
  avatarSmallText: "text-ku-primary-deep font-ku-bold text-ku-label",
  rowCopy: "flex-1 min-w-0 ml-ku-12",
  questTitle: "text-ku-text-strong font-ku-semibold text-ku-body",
  participant: "text-ku-primary font-ku-medium text-ku-label mt-ku-1",
  inquiryParticipant: "text-ku-support",
  latestMessage: "text-ku-text-secondary font-ku-regular text-ku-meta mt-ku-xs",
  rowMeta: "items-end self-start ml-ku-sm",
  rowTime: "text-ku-text-secondary font-ku-regular text-ku-label",
  unreadBadge:
    "items-center bg-ku-primary rounded-ku-pill min-h-ku-24 justify-center min-w-ku-24 mt-ku-sm px-ku-6",
  unreadText: "text-ku-on-primary font-ku-bold text-ku-label",
  inquiryUnreadBadge: "bg-ku-support",
  inquiryUnreadText: "text-ku-on-support",
  emptyState: "items-center justify-center px-ku-lg py-ku-64",
  emptyIcon:
    "items-center bg-ku-surface-accent rounded-ku-pill h-ku-68 justify-center mb-ku-md w-ku-68",
  emptyTitle:
    "text-ku-text-strong font-ku-semibold text-ku-emphasis-large text-center",
  emptyDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-xs text-center",
  loadErrorState:
    "items-center bg-ku-surface-danger border-ku-border-danger rounded-ku-card border gap-ku-sm min-h-ku-180 justify-center px-ku-lg py-ku-28",
  loadErrorTitle:
    "text-ku-danger-dark font-ku-semibold text-ku-body-small text-center",
  loadErrorAction:
    "items-center bg-ku-primary rounded-ku-pill justify-center min-h-ku-48 mt-ku-sm px-ku-lg",
  loadErrorActionText: "text-ku-on-primary font-ku-semibold text-ku-body-small",
  detailHeader: "bg-ku-surface border-b-ku-border-subtle border-b",
  brandRow: "items-center flex-row justify-start min-h-ku-48 px-ku-md pt-ku-xs",
  backButton:
    "items-center justify-center rounded-ku-pill h-ku-48 w-ku-48 active:bg-ku-surface-muted",
  identityRow:
    "items-center flex-row min-h-ku-72 pl-ku-lg pr-ku-md pb-ku-12 pt-ku-xs",
  identityCopy: "flex-1 min-w-0 ml-ku-10",
  identityTitle: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  identityMeta: "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-1",
  headerActions: "items-center flex-row ml-ku-sm",
  headerAction:
    "items-center justify-center rounded-ku-pill h-ku-44 w-ku-44 active:bg-ku-surface-muted",
  contextCard:
    "items-center bg-ku-surface-accent border-ku-border-accent rounded-ku-card border flex-row mx-ku-md mt-ku-md p-ku-12",
  contextIcon:
    "items-center bg-ku-white rounded-ku-image-large h-ku-40 justify-center w-ku-40",
  contextCopy: "flex-1 min-w-0 ml-ku-10",
  contextLabel: "text-ku-text-muted font-ku-medium text-ku-label",
  contextTitle: "text-ku-primary font-ku-semibold text-ku-body-small mt-ku-1",
  contextAction: "items-center justify-center min-h-ku-40 ml-ku-sm px-ku-xs",
  contextActionText: "text-ku-primary font-ku-semibold text-ku-label",
  reportAction:
    "items-center bg-ku-surface-danger border-ku-border-danger rounded-ku-card border flex-row mx-ku-md mt-ku-12 p-ku-12",
  reportActionIcon:
    "items-center bg-ku-white rounded-ku-image h-ku-36 justify-center w-ku-36",
  reportActionCopy: "flex-1 min-w-0 ml-ku-10",
  reportActionText: "text-ku-danger-dark font-ku-semibold text-ku-body-small",
  reportActionDescription:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  readOnlyBanner:
    "bg-ku-surface-muted border-ku-border-subtle rounded-ku-control border mx-ku-md mt-ku-12 px-ku-12 py-ku-10",
  readOnlyBannerTitle:
    "text-ku-text-strong font-ku-semibold text-ku-body-small",
  readOnlyBannerText:
    "text-ku-text-secondary font-ku-regular text-ku-label mt-ku-2",
  searchPanel: "bg-ku-background px-ku-md pb-ku-xs pt-ku-12",
  compactSearchField:
    "items-center bg-ku-surface border-ku-border-accent rounded-ku-search border flex-row min-h-ku-52 px-ku-sm",
  compactSearchInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body-small min-h-ku-48 px-ku-6",
  scopeSwitch: "bg-ku-surface-muted rounded-ku-pill flex-row mt-ku-sm p-ku-3",
  scopeItem: "items-center flex-1 justify-center min-h-ku-36 px-ku-sm",
  scopeItemActive: "bg-ku-white rounded-ku-pill",
  scopeText: "text-ku-text-secondary font-ku-medium text-ku-label",
  scopeTextActive: "text-ku-primary font-ku-semibold",
  resultMeta:
    "text-ku-text-muted font-ku-medium text-ku-label px-ku-md pt-ku-12",
  messageContent: "px-ku-md pb-ku-md pt-ku-md",
  dateSeparator:
    "self-center bg-ku-surface-muted rounded-ku-pill px-ku-10 py-ku-5",
  dateText: "text-ku-text-muted font-ku-medium text-ku-caption",
  messageRow: "items-start flex-row mt-ku-md",
  messageRowMe: "justify-end",
  messageAvatar:
    "items-center rounded-ku-pill h-ku-32 justify-center mr-ku-sm w-ku-32",
  messageAvatarText: "text-ku-primary-deep font-ku-bold text-ku-caption",
  messageStack: "max-w-[78%] min-w-0",
  messageStackMe: "items-end",
  messageBubble: "bg-ku-surface-muted rounded-ku-search px-ku-14 py-ku-10",
  messageBubbleMe: "bg-ku-success-light rounded-ku-search px-ku-14 py-ku-10",
  messageText: "text-ku-text-strong font-ku-regular text-ku-body-small",
  messageMeta:
    "text-ku-text-muted font-ku-regular text-ku-caption mt-ku-xs px-ku-xs",
  attachmentBubble:
    "items-center bg-ku-success-light rounded-ku-search flex-row min-h-ku-60 mt-ku-xs px-ku-10 py-ku-sm",
  attachmentBubbleOther: "bg-ku-surface-muted",
  attachmentIcon:
    "items-center bg-ku-surface-accent rounded-ku-image h-ku-40 justify-center w-ku-40",
  attachmentCopy: "flex-1 min-w-0 ml-ku-sm",
  attachmentName: "text-ku-text-strong font-ku-medium text-ku-body-small",
  attachmentMeta: "text-ku-text-muted font-ku-regular text-ku-caption mt-ku-1",
  fileList: "gap-ku-sm px-ku-md pt-ku-md",
  fileRow:
    "items-center bg-ku-white border-ku-border-accent rounded-ku-control border flex-row min-h-ku-68 p-ku-10 active:bg-ku-surface-muted",
  fileType: "items-center rounded-ku-image h-ku-42 justify-center w-ku-42",
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
    "items-center bg-ku-surface-muted rounded-ku-sheet flex-row min-h-ku-56 px-ku-6",
  composerButton:
    "items-center justify-center rounded-ku-pill h-ku-44 w-ku-44 active:bg-ku-surface",
  composerCounter: "text-ku-text-muted font-ku-medium text-ku-caption px-ku-xs",
  composerInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-body-small min-h-ku-48 px-ku-sm",
  sendButton:
    "items-center bg-ku-primary rounded-ku-pill h-ku-42 justify-center w-ku-42",
  inlineImageWrap:
    "rounded-ku-control overflow-hidden mt-ku-xs border border-ku-border-subtle bg-ku-surface-muted max-w-[260px] max-h-[320px]",
  inlineImage:
    "w-[240px] h-[160px] max-w-[260px] max-h-[320px] rounded-ku-control",
  pendingAttachmentsBar:
    "flex-row px-ku-md py-ku-sm bg-ku-background border-t border-ku-border-subtle gap-ku-sm",
  pendingAttachmentChip:
    "relative w-ku-64 h-ku-64 rounded-ku-image overflow-hidden border border-ku-border-accent bg-ku-surface-muted items-center justify-center",
  pendingAttachmentImage: "w-full h-full",
  pendingAttachmentRemove:
    "absolute top-ku-2 right-ku-2 bg-ku-overlay rounded-ku-pill w-ku-20 h-ku-20 items-center justify-center",
  pendingAttachmentUploading:
    "absolute inset-0 bg-ku-overlay items-center justify-center",
} as const;

export default styles;
