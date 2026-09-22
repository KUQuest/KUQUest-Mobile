const styles = {
  safeArea: "bg-ku-primary flex-1",
  hero: "bg-ku-primary px-ku-lg pb-ku-22 pt-ku-xs",
  heroTop: "items-center flex-row min-h-[64px] justify-between",
  heroButton:
    "items-center border border-ku-on-primary/[0.42] rounded-[14px] h-[48px] justify-center w-[48px]",
  heroTitleGroup: "flex-1 items-center px-ku-sm",
  heroTitle: "text-ku-on-primary font-ku-bold text-ku-title text-center",
  heroSubtitle:
    "text-ku-on-primary font-ku-regular text-ku-body-small text-center mt-ku-1",
  progressTrack: "items-center flex-row mt-ku-12",
  progressNodePressable:
    "items-center justify-center min-h-[48px] min-w-[48px]",
  progressNode: "items-center rounded-ku-pill h-[40px] justify-center w-[40px]",
  progressNodeText: "text-ku-on-primary font-ku-bold text-ku-emphasis",
  progressConnector: "flex-1 h-[2px]",
  stepLabels: "flex-row mt-ku-xs",
  stepLabel: "flex-1 font-ku-medium text-center text-ku-meta",
  stepLabelActive: "text-ku-on-primary font-ku-bold",
  surface:
    "bg-ku-background flex-1 -mt-ku-md rounded-tl-[28px] rounded-tr-[28px]",
  loadErrorState: "items-center flex-1 justify-center gap-ku-12 p-ku-xl",
  loadErrorIcon:
    "items-center bg-ku-surface-danger rounded-ku-pill h-[56px] justify-center w-[56px]",
  loadErrorText:
    "text-ku-text-secondary font-ku-regular text-ku-body-small text-center",
  autosaveStatus:
    "items-center flex-row min-h-[24px] gap-ku-6 px-ku-xs mt-ku-xs",
  autosaveSavingDot: "bg-ku-text-muted rounded-ku-pill h-[7px] w-[7px]",
  autosaveSavedIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[18px] justify-center w-[18px]",
  autosaveText: "text-ku-text-muted font-ku-regular text-ku-label",
  autosaveSavedText: "text-ku-success",
  saveErrorCard:
    "bg-ku-surface-danger border-ku-border-danger rounded-[12px] border flex-row items-center mt-ku-12 px-ku-12 py-ku-10",
  saveErrorCopy: "flex-1 min-w-0 ml-ku-sm",
  saveErrorText: "text-ku-danger-dark font-ku-medium text-ku-body-small",
  retryButton: "items-center justify-center min-h-[44px] ml-ku-sm px-ku-sm",
  retryButtonText: "text-ku-danger-dark font-ku-semibold text-ku-body-small",
  validationSummary:
    "bg-ku-surface-danger border border-ku-border-danger rounded-[12px] flex-row items-start gap-ku-sm px-ku-12 py-ku-10 mt-ku-12",
  validationIcon: "items-center justify-center mt-ku-1",
  validationSummaryText:
    "text-ku-danger-dark flex-1 font-ku-medium text-ku-meta",
  sectionCard:
    "bg-ku-card border-ku-border-subtle rounded-[16px] border mb-ku-md p-ku-20",
  setupCard:
    "bg-ku-surface-accent border-ku-border-accent rounded-[16px] border mb-ku-md p-ku-md",
  setupTitleRow: "items-center flex-row gap-ku-sm",
  setupTitleIcon:
    "items-center bg-ku-card rounded-[10px] h-[32px] justify-center w-[32px]",
  setupTitle: "text-ku-text-strong font-ku-bold text-ku-section",
  setupMetrics: "items-start flex-row mt-ku-12 w-full",
  setupMetric: "flex-1 items-center min-w-0",
  setupMetricWide: "flex-row items-center",
  setupMetricIcon:
    "items-center bg-ku-card rounded-[12px] h-[40px] justify-center w-[40px]",
  setupMetricCopy: "items-center min-w-0 mt-ku-6 w-full",
  setupMetricCopyWide: "flex-1 items-start ml-ku-sm mt-ku-0",
  setupMetricLabel:
    "text-ku-text-secondary font-ku-regular text-ku-label text-center",
  setupMetricLabelWide: "text-left",
  setupMetricValue:
    "text-ku-text-strong font-ku-bold text-ku-body-small mt-ku-1 text-center",
  setupMetricValueWide: "text-left",
  setupMetricDivider: "bg-ku-border-accent h-[64px] mx-ku-6 w-[1px]",
  setupMetricDividerWide: "h-[56px] mx-ku-12",
  setupDivider: "bg-ku-border-accent h-[1px] mt-ku-12 w-full",
  setupHint:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-12",
  sectionHeading: "items-start flex-row gap-ku-10 mb-ku-md",
  sectionIcon:
    "items-center bg-ku-surface-accent rounded-[10px] h-[36px] justify-center shrink-0 w-[36px]",
  sectionHeadingText: "flex-1 min-w-0",
  sectionTitle: "text-ku-text-strong font-ku-bold text-ku-section",
  sectionDescription:
    "text-ku-text-secondary font-ku-regular text-ku-meta mt-ku-3",
  subsectionHeading: "mb-ku-14",
  subsectionBlock: "mt-ku-20",
  collapsibleHeader: "items-center flex-row gap-ku-10 min-h-[48px]",
  collapsibleHeaderIcon:
    "items-center bg-ku-surface-accent rounded-[10px] h-[36px] justify-center shrink-0 w-[36px]",
  collapsibleHeaderCopy: "flex-1 min-w-0 pr-ku-12",
  collapsibleContent: "mt-ku-md",
  collapsibleSummary:
    "text-ku-text-muted font-ku-regular text-ku-body-small mt-ku-3",
  fieldGroup: "mb-ku-14 w-full",
  fieldLabel: "text-ku-text-secondary font-ku-bold text-ku-meta mb-ku-xs",
  required: "text-ku-danger",
  optional: "text-ku-text-muted font-ku-regular text-ku-label",
  helperText: "text-ku-text-muted font-ku-regular text-ku-label mt-ku-xs",
  errorText: "text-ku-danger-dark font-ku-medium text-ku-label mt-ku-xs",
  fieldError: "border-ku-danger",
  dateField:
    "items-center bg-ku-card border-ku-border rounded-[12px] border flex-row justify-between min-h-[48px] px-ku-md",
  dateText:
    "text-ku-text-strong flex-1 font-ku-regular min-w-0 mr-ku-12 text-ku-control",
  placeholderText: "text-ku-text-muted",
  inputWithIcon:
    "items-center bg-ku-card border-ku-border rounded-[12px] border flex-row min-h-[48px] px-ku-md",
  modalBackdrop: "bg-ku-overlay flex-1 justify-end",
  pickerSheet:
    "bg-ku-background rounded-tl-[24px] rounded-tr-[24px] px-ku-md pb-ku-lg pt-ku-md",
  pickerHeader: "items-center flex-row justify-between mb-ku-sm",
  pickerTitle: "text-ku-text-strong font-ku-bold text-ku-body",
  pickerDoneButton: "items-center min-h-[44px] justify-center px-ku-sm",
  pickerDoneText: "text-ku-primary font-ku-semibold text-ku-body-small",
  timePickerBackdrop: "bg-ku-overlay flex-1 justify-end",
  timePickerSheet:
    "bg-ku-background rounded-tl-[24px] rounded-tr-[24px] px-ku-20 pb-ku-28 pt-ku-md",
  timePickerHeader: "items-center flex-row justify-between mb-ku-12",
  timePickerTitle: "text-ku-text-strong font-ku-bold text-ku-body",
  timePickerSubtitle: "text-ku-text-muted font-ku-regular text-ku-meta mt-ku-2",
  timePickerCloseButton:
    "items-center justify-center p-ku-6 rounded-ku-pill min-h-[36px] min-w-[36px]",
  timeDisplayContainer:
    "items-center flex-row justify-center gap-ku-12 my-ku-10",
  timeDisplayBox:
    "items-center justify-center bg-ku-card border-2 border-ku-border-muted rounded-[16px] px-ku-20 py-ku-sm min-w-[96px]",
  timeDisplayBoxActive: "border-ku-primary bg-ku-surface-accent",
  timeDisplayText:
    "text-ku-text-strong font-ku-bold text-[34px] leading-[42px]",
  timeDisplayTextActive: "text-ku-primary",
  timeDisplayLabel: "text-ku-text-muted font-ku-medium text-ku-meta mt-ku-2",
  timeDisplayLabelActive: "text-ku-primary font-ku-semibold",
  timeColon: "text-ku-text-strong font-ku-bold text-[32px] leading-[40px]",
  timePresetsScroll: "py-ku-xs mb-ku-12",
  timeSectionLabel:
    "text-ku-text-secondary font-ku-semibold text-ku-body-small mb-ku-sm mt-ku-xs",
  hourGrid: "flex-row flex-wrap justify-between gap-ku-6 mb-ku-12",
  hourCell:
    "items-center justify-center bg-ku-card border border-ku-border-subtle rounded-[10px] w-[50px] h-[40px]",
  hourCellSelected: "bg-ku-primary border-ku-primary",
  hourCellText: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  hourCellTextSelected: "text-ku-on-primary font-ku-bold",
  minuteGrid: "flex-row flex-wrap justify-between gap-ku-sm mb-ku-12",
  minuteCell:
    "items-center justify-center bg-ku-card border border-ku-border-subtle rounded-[12px] w-[72px] h-[44px]",
  minuteCellSelected: "bg-ku-primary border-ku-primary",
  minuteCellText: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  minuteCellTextSelected: "text-ku-on-primary font-ku-bold",
  minuteStepperContainer:
    "flex-row items-center justify-between bg-ku-surface-accent rounded-[12px] px-ku-12 py-ku-sm mb-ku-12",
  minuteStepperLabel:
    "text-ku-text-secondary font-ku-medium text-ku-body-small",
  minuteStepperButtons: "flex-row items-center gap-ku-sm",
  stepperBtn:
    "bg-ku-card border border-ku-border rounded-[8px] px-ku-10 py-ku-6 items-center justify-center min-w-[54px]",
  stepperBtnText: "text-ku-text-strong font-ku-bold text-ku-body-small",
  timePickerActions: "flex-row items-center gap-ku-10 mt-ku-sm",
  timePickerCancelBtn:
    "flex-1 items-center justify-center border border-ku-border rounded-[12px] min-h-[46px] px-ku-12",
  timePickerCancelText:
    "text-ku-text-secondary font-ku-semibold text-ku-control",
  timePickerConfirmBtn:
    "flex-1 items-center justify-center bg-ku-primary rounded-[12px] min-h-[46px] px-ku-md",
  timePickerConfirmText: "text-ku-on-primary font-ku-bold text-ku-control",
  scheduleCard:
    "bg-ku-card border border-ku-border-subtle rounded-[14px] p-ku-12 mb-ku-12",
  scheduleCardHeader: "flex-row items-center justify-between mb-ku-sm",
  scheduleCardTitle:
    "text-ku-text-strong font-ku-bold text-ku-body-small flex-row items-center gap-ku-6",
  scheduleSplitRow: "flex-row gap-ku-sm",
  scheduleSplitBtn:
    "flex-1 bg-ku-surface-subtle border border-ku-border rounded-[10px] px-ku-12 py-ku-10 flex-row items-center justify-between min-h-[48px]",
  scheduleSplitBtnError: "border-ku-danger bg-ku-surface-danger",
  scheduleSplitBtnCopy: "flex-1 mr-ku-sm",
  scheduleSplitBtnLabel: "text-ku-text-muted font-ku-regular text-ku-meta",
  scheduleSplitBtnValue:
    "text-ku-text-strong font-ku-semibold text-ku-body-small mt-ku-1",
  scheduleQuickChips: "flex-row flex-wrap gap-ku-6 mt-ku-sm",
  durationBadge:
    "bg-ku-surface-accent border border-ku-border-accent rounded-[12px] p-ku-10 my-ku-sm flex-row items-center justify-between",
  durationBadgeError: "bg-ku-surface-danger border-ku-border-danger",
  durationBadgeText:
    "text-ku-primary font-ku-semibold text-ku-body-small flex-1",
  durationBadgeErrorText:
    "text-ku-danger-dark font-ku-medium text-ku-body-small flex-1",
  fixDeadlineButton:
    "bg-ku-card border border-ku-border-danger rounded-[8px] px-ku-10 py-ku-xs ml-ku-sm",
  fixDeadlineButtonText: "text-ku-danger-dark font-ku-bold text-ku-meta",
  iconInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-control ml-ku-sm min-h-[46px]",
  onlineToggle:
    "bg-ku-surface-subtle border-ku-border-subtle rounded-[12px] border flex-row items-center min-h-[64px] mb-ku-md p-ku-12",
  checkbox:
    "border-ku-border bg-ku-card border h-[24px] items-center justify-center rounded-[7px] w-[24px]",
  checkboxChecked: "bg-ku-primary border-ku-primary",
  onlineToggleCopy: "flex-1 ml-ku-12",
  onlineToggleTitle: "text-ku-text-strong font-ku-semibold text-ku-control",
  onlineToggleHint: "text-ku-text-muted font-ku-regular text-ku-label mt-ku-1",
  proofToggle: "items-center flex-row min-h-[48px]",
  proofToggleLabel:
    "text-ku-text-strong flex-1 font-ku-semibold text-ku-control ml-ku-10",
  proofDescription:
    "text-ku-text-secondary font-ku-regular text-ku-label ml-ku-34 mt-ku-2",
  imagePicker:
    "items-center bg-ku-surface-accent border-ku-border-accent rounded-[12px] border-dashed border justify-center min-h-[128px] p-ku-md",
  imageTitle: "text-ku-primary font-ku-semibold text-ku-control mt-ku-sm",
  changeImagesButton:
    "items-center min-h-[48px] justify-center mt-ku-sm px-ku-12",
  imageGrid: "flex-row flex-wrap gap-ku-sm",
  imagePreviewContainer: "relative",
  previewImage: "rounded-[8px] h-[96px] w-[96px]",
  removeImageButton:
    "absolute bg-ku-black items-center justify-center rounded-ku-pill h-[32px] right-[4px] top-[4px] w-[32px]",
  choiceGroup: "gap-ku-12 w-full",
  choiceGroupFormat: "flex-row",
  choiceGroupFormatStacked: "flex-col",
  choiceGroupAcceptance: "flex-col",
  choice:
    "items-center bg-ku-card border-2 border-ku-border-muted flex-row min-w-0 rounded-[14px] px-ku-12",
  choiceFormat: "flex-1 min-h-[104px] py-ku-10",
  choiceFormatStacked: "min-h-[88px] w-full",
  choiceAcceptance: "min-h-[88px] py-ku-10",
  choiceSelected: "bg-ku-surface-accent border-ku-primary",
  choiceIcon:
    "items-center bg-ku-surface-accent rounded-[12px] h-[44px] justify-center w-[44px]",
  choiceCopy: "flex-1 min-w-0 ml-ku-10 mr-ku-6",
  choiceText: "text-ku-text-strong font-ku-bold text-ku-emphasis",
  choiceTextSelected: "text-ku-primary",
  choiceDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-2",
  radio:
    "border-2 border-ku-border-muted rounded-ku-pill h-[28px] items-center justify-center shrink-0 w-[28px]",
  radioSelected: "border-ku-primary",
  radioDot: "bg-ku-primary rounded-ku-pill h-[14px] w-[14px]",
  modeSummary: "bg-ku-surface-accent rounded-[14px] flex-row mt-ku-14 p-ku-12",
  modeIcon:
    "items-center bg-ku-surface-success rounded-ku-pill h-[48px] justify-center mr-ku-10 w-[48px]",
  modeCopy: "flex-1 min-w-0",
  modeTitle: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  modeValue: "text-ku-primary font-ku-bold",
  modeDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-6",
  additionalSettings: "border-t-ku-border-subtle border-t mt-ku-lg pt-ku-20",
  additionalSettingsTitle:
    "text-ku-text-strong font-ku-bold text-ku-subtitle mb-ku-md",
  currencyInput:
    "items-center bg-ku-card border-ku-border rounded-[12px] border flex-row min-h-[48px] px-ku-md",
  currencySymbol: "text-ku-primary font-ku-bold text-ku-emphasis",
  currencyTextInput:
    "text-ku-text-strong flex-1 font-ku-regular text-ku-control ml-ku-sm min-h-[46px]",
  currencyUnit: "text-ku-text-muted font-ku-medium text-ku-label",
  readOnlyField:
    "items-start bg-ku-surface-muted border-ku-border-muted rounded-[12px] border justify-center min-h-[48px] px-ku-12",
  readOnlyValue: "text-ku-text-strong font-ku-medium text-ku-body-small",
  singleHeadcountHint:
    "text-ku-text-muted font-ku-regular text-ku-label mt-ku-xs",
  summaryHeading: "items-center flex-row gap-ku-sm mb-ku-sm mt-ku-sm",
  summaryTitle: "text-ku-text-strong font-ku-semibold text-ku-body",
  summaryCard: "border-t-ku-border-subtle border-t mt-ku-xs pt-ku-xs",
  summaryRow:
    "border-b-ku-border-subtle border-b flex-row items-start py-ku-10",
  summaryLabel:
    "text-ku-text-muted flex-[0.36] font-ku-regular text-ku-meta mr-ku-10",
  summaryValue:
    "text-ku-text-strong flex-1 font-ku-medium text-ku-meta min-w-0",
  publishCheckCard:
    "bg-ku-surface-success border-ku-border-success rounded-[14px] border mt-ku-md p-ku-14",
  publishCheckCardBlocked: "bg-ku-surface-danger border-ku-border-danger",
  publishCheckTitle: "text-ku-text-strong font-ku-bold text-ku-body",
  publishCheckStatus:
    "text-ku-primary font-ku-semibold text-ku-body-small mt-ku-3",
  publishCheckStatusBlocked: "text-ku-danger-dark",
  escrowRows: "border-t-ku-border-success border-t mt-ku-10 pt-ku-6",
  escrowRow: "flex-row items-start py-ku-5",
  escrowLabel: "text-ku-text-secondary flex-1 font-ku-regular text-ku-meta",
  escrowValue: "text-ku-text-strong font-ku-semibold text-ku-meta",
  publishCheckNote:
    "text-ku-text-secondary font-ku-regular text-ku-meta mt-ku-6",
  actionBar:
    "shadow-[0px_-4px_12px_rgb(18_32_24_/0.06)] items-center bg-ku-card border-t-ku-border-subtle border-t flex-row gap-ku-10 px-ku-20 pt-ku-12 shrink-0",
  loadingActionBar:
    "items-center bg-ku-card border-t-ku-border-subtle border-t flex-row gap-ku-10 px-ku-20 pt-ku-12 shrink-0",
  actionBarStacked: "items-stretch flex-col gap-ku-sm",
  nextButtonFull: "w-full",
  reviewActionButton:
    "items-center h-[56px] justify-center min-h-[56px] rounded-[14px] px-ku-10 py-ku-xs",
  reviewActionButtonStacked: "h-auto min-h-[56px] py-ku-10",
  reviewActionButtonPrimary: "bg-ku-primary",
  reviewActionButtonSecondary: "bg-transparent border-2 border-ku-primary",
  reviewActionText: "font-ku-semibold text-center text-ku-body-small",
  reviewActionTextPrimary: "text-ku-on-primary",
  reviewActionTextSecondary: "text-ku-primary",
  primaryButtonText: "text-ku-on-primary font-ku-semibold text-ku-body",
  buttonContent: "items-center flex-row gap-ku-xs justify-center",
  successState: "items-center flex-1 justify-center p-ku-xl",
  successIcon:
    "items-center bg-ku-surface-success border-ku-border-success rounded-ku-pill border h-[72px] justify-center mb-ku-lg w-[72px]",
  successTitle: "text-ku-text-strong font-ku-bold text-ku-title text-center",
  successDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-sm max-w-[320px] text-center",
  fullButton: "mt-ku-md",
} as const;

export default styles;
