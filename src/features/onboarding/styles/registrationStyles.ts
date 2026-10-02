const styles = {
  safeArea: "flex-1 bg-ku-background",
  scrollContent:
    "px-ku-20 pt-ku-lg pb-ku-xl items-center w-full max-w-[720px] self-center",
  headerSection: "items-start mb-ku-20 w-full",
  title: "font-ku-bold text-ku-title-large text-ku-primary -tracking-[0.5px]",
  stepTitle: "font-ku-bold text-ku-title-small text-ku-text-strong mt-ku-12",
  stepIndicator:
    "font-ku-regular text-ku-body-small text-ku-text-muted mt-ku-2",
  progressContainer: "flex-row gap-ku-6 mt-ku-md w-full",
  progressBarActive: "h-[6px] flex-1 bg-ku-primary rounded-[4px]",
  progressBarInactive: "h-[6px] flex-1 bg-ku-border-subtle rounded-[4px]",
  avatarPlaceholder:
    "w-[80px] h-[80px] rounded-[40px] bg-ku-surface-placeholder justify-center items-center self-center relative border border-ku-border-muted mt-ku-lg",
  avatarImage: "w-full h-full rounded-[40px]",
  editBadge:
    "shadow-[0px_1px_1.5px_rgb(18_32_24_/0.2)] absolute -right-[4px] -bottom-[4px] bg-ku-success-bright w-[28px] h-[28px] rounded-[14px] justify-center items-center border-2 border-ku-white",
  formSection:
    "w-full bg-ku-card border border-ku-border-subtle rounded-[16px] px-ku-md py-ku-20",
  termsLabel: "font-ku-bold text-ku-label text-ku-text-secondary mb-ku-6",
  policySummary:
    "bg-ku-surface-accent border border-ku-border-accent rounded-[12px] p-ku-md mb-ku-md",
  policySummaryTitle: "font-ku-bold text-ku-label text-ku-text-strong mb-ku-xs",
  policySummaryText:
    "font-ku-regular text-ku-body-small text-ku-text-secondary",
  policyReadAction: "min-h-[48px] justify-center mt-ku-sm",
  policyReadActionText:
    "font-ku-bold text-ku-body-small text-ku-primary underline",
  actionBar:
    "items-center bg-ku-surface border-t border-t-ku-border-subtle px-ku-20 pt-ku-10 pb-ku-md",
  actionButtons: "flex-row items-center gap-ku-10 w-full",
  actionButton: "flex-1 min-w-0",
  savingStatus:
    "font-ku-regular text-ku-label text-ku-primary text-center mb-ku-sm",
  submitErrorCard:
    "bg-ku-surface-danger border-ku-border-danger border rounded-[12px] p-ku-12 flex-row items-center gap-ku-sm mt-ku-md",
  submitErrorText: "font-ku-regular text-ku-label text-ku-danger-dark flex-1",
  step2Intro: "mb-ku-20",
  step2CardTitle: "font-ku-bold text-ku-subtitle text-ku-primary mb-ku-sm",
  step2CardSubtitle: "font-ku-regular text-ku-label text-ku-text-muted",
  step3Section:
    "w-full bg-ku-card border border-ku-border-subtle rounded-[16px] px-ku-md py-ku-20 mb-ku-md",
  sectionHeader: "flex-row items-center mb-ku-10 min-h-[32px]",
  sectionTitle: "font-ku-bold text-ku-subtitle text-ku-text-strong",
  sectionTitleNormal:
    "font-ku-bold text-ku-subtitle text-ku-text-strong mb-ku-12",
  sectionDesc: "font-ku-regular text-ku-label text-ku-text-muted mb-ku-md",
  itemCard: "border-b border-ku-border-subtle pb-ku-md mb-ku-md",
  itemCardHeader: "flex-row items-center justify-between",
  removeButton: "min-h-[48px] min-w-[48px] items-center justify-center",
  itemLabel: "font-ku-bold text-ku-label text-ku-text-muted mb-ku-sm uppercase",
  emptySection:
    "bg-ku-surface-accent border border-ku-border-accent rounded-[12px] min-h-[64px] px-ku-md py-ku-12 items-center justify-center mb-ku-12",
  emptySectionText:
    "font-ku-regular text-ku-body-small text-ku-text-secondary text-center",
  addMoreBtn:
    "border border-ku-primary rounded-[24px] py-ku-10 min-h-[48px] items-center justify-center mt-ku-sm",
  addMoreBtnText: "font-ku-bold text-ku-body-small text-ku-primary",
  dateInputWrapper: "mb-ku-md w-full",
  dateInputLabel: "font-ku-bold text-ku-label text-ku-text-secondary mb-ku-6",
  dateInputBox:
    "flex-row items-center justify-between border border-ku-border-muted rounded-[10px] bg-ku-surface-subtle px-ku-12 py-ku-10 min-h-[48px]",
  dateInputError: "border-ku-danger border",
  fieldErrorText: "font-ku-regular text-ku-label text-ku-danger mt-ku-xs",
  dateInputTextActive: "font-ku-regular text-ku-body-small text-ku-text-strong",
  dateInputTextPlaceholder:
    "font-ku-regular text-ku-body-small text-ku-text-faint",
  imageUploadBox:
    "border border-ku-border rounded-[12px] border-dashed h-[120px] justify-center items-center mb-ku-md bg-ku-surface-subtle overflow-hidden",
  certificateImageBox: "h-[104px]",
  imagePlaceholderContent: "items-center",
  addImgText: "font-ku-bold text-ku-label text-ku-text-muted mt-ku-xs",
  uploadedImage: "w-full h-full object-cover",
  loadErrorCard:
    "m-ku-20 p-ku-lg rounded-[16px] border border-ku-border-danger bg-ku-surface-danger items-center gap-ku-md",
  policyModalOverlay: "flex-1 justify-end bg-ku-overlay",
  policyModalContent:
    "h-[88%] bg-ku-card rounded-tl-[24px] rounded-tr-[24px] max-h-[88%] overflow-hidden",
  policyModalHeader:
    "flex-row items-center justify-between px-ku-20 pt-ku-md pb-ku-sm border-b border-b-ku-border-subtle",
  policyModalTitle: "font-ku-bold text-ku-subtitle text-ku-text-strong",
  policyModalClose: "min-h-[48px] min-w-[48px] items-center justify-center",
  policyModalScroll: "flex-1",
  policyModalScrollContent: "px-ku-20 py-ku-20 pb-ku-28",
  policyModalText: "font-ku-regular text-ku-body-small text-ku-text-secondary",
  policyModalFooter:
    "border-t border-t-ku-border-subtle px-ku-20 pt-ku-12 pb-ku-md",
} as const;

export default styles;
