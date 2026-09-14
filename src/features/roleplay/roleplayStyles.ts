const styles = {
  safeArea: "bg-ku-background flex-1",
  scroll: "flex-1",
  content: "gap-[16px] px-[16px] pb-[24px] pt-[8px]",
  header: "items-start flex-row px-[16px] pb-[8px] pt-[8px]",
  backButton:
    "items-center bg-ku-surface-accent border-ku-border-accent border h-[44px] justify-center mr-[8px] rounded-ku-pill w-[44px]",
  headerCopy: "flex-1 min-w-0 pr-[12px]",
  eyebrow: "text-ku-primary font-ku-semibold text-ku-label",
  title: "text-ku-text-strong font-ku-bold text-ku-title-small mt-[2px]",
  description:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-[4px]",
  prototypeBadge:
    "items-center bg-ku-surface-accent border-ku-border-accent border rounded-ku-pill min-h-[32px] px-[10px]",
  prototypeBadgeText: "text-ku-primary font-ku-semibold text-ku-caption",
  panel: "bg-ku-surface border-ku-border-subtle rounded-[18px] border p-[16px]",
  panelHeader: "flex-row items-start justify-between",
  panelHeading: "flex-1 min-w-0 pr-[12px]",
  sectionTitle: "text-ku-text-strong font-ku-bold text-ku-body",
  sectionHint:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-[3px]",
  scenarioList: "gap-[8px] mt-[12px]",
  scenarioOption:
    "items-center bg-ku-surface-muted border-ku-border-subtle rounded-[14px] border flex-row min-h-[52px] p-[12px]",
  scenarioOptionSelected: "bg-ku-surface-success border-ku-border-success",
  scenarioOptionCopy: "flex-1 min-w-0 pr-[8px]",
  scenarioOptionLabel: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  scenarioOptionMeta: "text-ku-text-secondary font-ku-regular text-ku-caption mt-[2px]",
  scenarioLabel:
    "text-ku-text-muted font-ku-semibold text-ku-caption mt-[14px]",
  scenarioName:
    "text-ku-text-strong font-ku-semibold text-ku-body-small mt-[2px]",
  scenarioRoute: "text-ku-primary font-ku-regular text-ku-caption mt-[2px]",
  statusPanel:
    "bg-ku-surface-success border-ku-border-success rounded-[18px] border p-[16px]",
  statusLabel: "text-ku-text-secondary font-ku-semibold text-ku-caption",
  statusValue:
    "text-ku-primary font-ku-bold text-[22px] leading-[28px] mt-[3px]",
  questTitle: "text-ku-text-strong font-ku-semibold text-ku-body mt-[14px]",
  questDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-[3px]",
  statusMeta: "border-ku-border-success border-t mt-[14px] pt-[12px]",
  metaLabel: "text-ku-text-secondary font-ku-regular text-ku-caption",
  metaValue: "text-ku-text-strong font-ku-semibold text-ku-body-small mt-[2px]",
  applicationList: "gap-[8px] mt-[12px]",
  application:
    "bg-ku-surface-muted border-ku-border-subtle rounded-[14px] border p-[12px]",
  applicationHeader: "flex-row items-start justify-between",
  applicationCopy: "flex-1 min-w-0 pr-[8px]",
  applicationId: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  applicationApplicant:
    "text-ku-text-secondary font-ku-regular text-ku-caption mt-[2px]",
  applicationStatus: "text-ku-text-muted font-ku-semibold text-ku-caption",
  applicationStatusPending: "text-ku-primary",
  applicationStatusSelected: "text-ku-success",
  applicationStatusRejected: "text-ku-danger-dark",
  applicationActions: "flex-row gap-[8px] mt-[10px]",
  actionList: "gap-[8px] mt-[12px]",
  actionChoiceList: "gap-[8px] mt-[12px]",
  actionButton:
    "items-center flex-row min-h-[50px] rounded-[14px] px-[14px] active:opacity-80",
  actionButtonPrimary: "bg-ku-primary",
  actionButtonSecondary: "bg-ku-surface border-ku-primary border",
  actionButtonDanger: "bg-ku-surface-danger border-ku-danger border",
  actionButtonDisabled: "opacity-50",
  actionText: "font-ku-semibold text-ku-control",
  actionTextLight: "text-ku-white",
  actionTextPrimary: "text-ku-primary",
  actionTextDanger: "text-ku-danger-dark",
  actionCopy: "flex-1 min-w-0 ml-[10px]",
  actionDescription: "font-ku-regular text-ku-caption mt-[1px]",
  actionDescriptionLight: "text-ku-white/80",
  actionDescriptionMuted: "text-ku-text-secondary",
  feedback:
    "bg-ku-surface-success border-ku-border-success rounded-[14px] border flex-row p-[12px]",
  feedbackError: "bg-ku-surface-danger border-ku-border-danger",
  feedbackIcon: "items-center rounded-ku-pill h-[28px] justify-center w-[28px]",
  feedbackIconSuccess: "bg-ku-surface-success",
  feedbackIconError: "bg-ku-surface-danger",
  feedbackCopy: "flex-1 min-w-0 ml-[8px]",
  feedbackLabel: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  feedbackMessage:
    "text-ku-text-secondary font-ku-regular text-ku-caption mt-[1px]",
  resetButton:
    "items-center border-ku-border rounded-ku-pill border min-h-[48px] justify-center px-[16px]",
  resetButtonText: "text-ku-primary font-ku-semibold text-ku-control",
  empty: "bg-ku-surface-muted rounded-[14px] p-[12px] mt-[12px]",
  emptyText: "text-ku-text-secondary font-ku-regular text-ku-body-small",
} as const;

export default styles;
