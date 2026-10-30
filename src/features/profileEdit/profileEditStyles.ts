const styles = {
  safeArea: "flex-1 bg-ku-surface",
  screen: "flex-1",
  scrollContent:
    "px-ku-lg pt-ku-md pb-ku-120 gap-ku-md self-center w-full max-w-[720px]",
  header: "flex-row items-center justify-between mb-ku-sm",
  headerTitle: "font-ku-bold text-ku-title text-ku-text-strong",
  backButton: "min-h-[48px] min-w-[48px] items-center justify-center",
  headerAction: "min-h-[48px] min-w-[48px] items-center justify-center",
  hubProfile: "items-center gap-ku-6 pt-ku-sm pb-ku-lg",
  hubProfileBadge:
    "absolute right-0 bottom-0 w-[28px] h-[28px] rounded-[14px] bg-ku-primary border-2 border-ku-surface items-center justify-center",
  hubProfileName:
    "font-ku-bold text-ku-text-strong text-ku-title-small text-center mt-ku-sm",
  hubProfileSub: "font-ku-regular text-ku-text-muted text-ku-body-small",
  hubGroup: "bg-ku-surface-subtle rounded-ku-card overflow-hidden",
  hubRow: "flex-row items-center px-ku-md min-h-[76px] gap-ku-md",
  hubRowDivider: "border-t border-t-ku-border-subtle",
  hubRowIcon:
    "w-[40px] h-[40px] rounded-[20px] bg-ku-card items-center justify-center",
  sectionList: "gap-ku-sm",
  sectionRow:
    "flex-row items-center bg-ku-card border border-ku-border-subtle rounded-ku-card px-ku-md min-h-[76px]",
  sectionRowContent: "flex-1 py-ku-md",
  sectionRowTitle: "font-ku-semibold text-ku-text-strong text-ku-body",
  sectionRowSummary: "font-ku-regular text-ku-text-muted text-ku-meta mt-ku-2",
  chevron: "ml-ku-sm",
  statusCard:
    "bg-ku-surface-danger border border-ku-border-danger rounded-ku-field p-ku-md gap-ku-sm",
  statusText: "font-ku-regular text-ku-danger-dark text-ku-body-small flex-1",
  retryButton:
    "min-h-[48px] self-start px-ku-md items-center justify-center rounded-ku-pill bg-ku-primary",
  retryButtonText: "font-ku-semibold text-ku-on-primary",
  emptyState:
    "bg-ku-surface-subtle border border-ku-border-subtle rounded-ku-card p-ku-lg items-center gap-ku-sm",
  emptyText:
    "font-ku-regular text-ku-text-secondary text-ku-body-small text-center",
  fab: "absolute right-ku-lg w-[56px] h-[56px] rounded-[28px] bg-ku-primary items-center justify-center elevation-4",
  portfolioGrid: "flex-row flex-wrap justify-between gap-y-ku-lg",
  portfolioTile: "w-[48%] gap-ku-6",
  portfolioTileImage:
    "w-full aspect-[4/3] rounded-ku-image bg-ku-surface-image",
  portfolioTileFallback:
    "w-full aspect-[4/3] rounded-ku-image bg-ku-surface-subtle items-center justify-center",
  portfolioTileTitle: "font-ku-semibold text-ku-text-strong text-ku-body-small",
  portfolioTileDescription: "font-ku-regular text-ku-text-muted text-ku-meta",
  itemRow:
    "flex-row items-center bg-ku-card border border-ku-border-subtle rounded-ku-card p-ku-md gap-ku-md",
  itemRowContent: "flex-1 gap-ku-3",
  itemTitle: "font-ku-semibold text-ku-text-strong text-ku-body",
  itemMeta: "font-ku-regular text-ku-text-secondary text-ku-body-small",
  itemDescription: "font-ku-regular text-ku-text-muted text-ku-meta",
  itemImage: "w-[64px] h-[64px] rounded-ku-field bg-ku-surface-image",
  itemImageFallback:
    "w-[64px] h-[64px] rounded-ku-field bg-ku-surface-placeholder items-center justify-center",
  itemImageFallbackText:
    "font-ku-regular text-ku-text-faint text-ku-nav text-center px-ku-xs",
  formScroll: "flex-1",
  formContent:
    "px-ku-lg pt-ku-md pb-ku-lg gap-ku-md self-center w-full max-w-[720px]",
  formGroup:
    "bg-ku-card border border-ku-border-subtle rounded-ku-card p-ku-md gap-ku-sm",
  basicsGroup: "gap-ku-sm",
  formGroupTitle: "font-ku-bold text-ku-text-strong text-ku-subtitle mb-ku-xs",
  formGroupHint: "font-ku-regular text-ku-text-secondary text-ku-body-small",
  avatarPicker: "items-center gap-ku-sm py-ku-sm",
  avatar:
    "w-[96px] h-[96px] rounded-[48px] bg-ku-surface-image border border-ku-border-accent",
  avatarFallback:
    "w-[96px] h-[96px] rounded-[48px] bg-ku-surface-accent border border-ku-border-accent items-center justify-center",
  avatarInitials: "font-ku-bold text-ku-title-large text-ku-primary",
  avatarFrame: "w-[96px] h-[96px]",
  avatarEditBadge:
    "absolute right-0 bottom-0 w-[32px] h-[32px] rounded-[16px] bg-ku-primary border-2 border-ku-card items-center justify-center",
  avatarHelp: "font-ku-regular text-ku-text-muted text-ku-label text-center",
  avatarError: "font-ku-regular text-ku-danger-dark text-ku-label text-center",
  imagePicker:
    "w-full border border-ku-border-muted border-dashed rounded-ku-card items-center justify-center overflow-hidden bg-ku-surface-subtle",
  imageField: "relative w-full",
  imagePickerFilled:
    "w-full rounded-ku-card items-center justify-center overflow-hidden bg-ku-surface-image",
  imageEditBadge:
    "absolute right-ku-sm bottom-ku-sm w-[32px] h-[32px] rounded-[16px] bg-ku-primary items-center justify-center",
  imageRemoveButton:
    "absolute right-ku-sm top-ku-sm w-[32px] h-[32px] rounded-[16px] bg-ku-text-strong/70 items-center justify-center",
  editorForm: "gap-ku-md",
  imagePreview: "h-full w-full",
  imagePickerText: "font-ku-semibold text-ku-text-muted text-ku-meta",
  dateRow: "flex-row gap-ku-md",
  dateField: "flex-1",
  dateButton:
    "min-h-[48px] flex-row items-center justify-between border border-ku-border-muted rounded-ku-field bg-ku-card px-ku-md",
  dateText: "font-ku-regular text-ku-text-strong text-ku-body-small",
  datePlaceholder: "font-ku-regular text-ku-text-faint text-ku-body-small",
  clearDate: "min-h-[48px] items-center justify-center px-ku-xs",
  clearDateText: "font-ku-semibold text-ku-primary text-ku-label",
  errorCard:
    "flex-row items-center bg-ku-surface-danger border border-ku-border-danger rounded-ku-field p-ku-md gap-ku-sm",
  errorText: "font-ku-regular text-ku-danger-dark text-ku-meta flex-1",
  saveBar:
    "absolute bottom-0 left-0 right-0 bg-ku-surface-nav-translucent border-t border-ku-border-nav",
  saveBarDocked: "bg-ku-surface-nav-translucent border-t border-ku-border-nav",
  saveBarContent: "px-ku-lg pt-ku-sm pb-ku-sm",
  saveBarInner: "self-center w-full max-w-[720px]",
} as const;

export default styles;
