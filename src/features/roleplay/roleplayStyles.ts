const styles = {
  safeArea: "bg-ku-background flex-1",
  scroll: "flex-1",
  content: "gap-ku-md px-ku-md pb-ku-lg pt-ku-sm",
  header: "items-start flex-row px-ku-md pb-ku-sm pt-ku-sm",
  backButton:
    "items-center bg-ku-surface-accent border-ku-border-accent border h-[44px] justify-center mr-ku-sm rounded-ku-pill w-[44px]",
  headerCopy: "flex-1 min-w-0 pr-ku-12",
  eyebrow: "text-ku-primary font-ku-semibold text-ku-label",
  title: "text-ku-text-strong font-ku-bold text-ku-title-small mt-ku-2",
  description:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-xs",
  prototypeBadge:
    "items-center bg-ku-surface-accent border-ku-border-accent border rounded-ku-pill min-h-[32px] px-ku-10",
  prototypeBadgeText: "text-ku-primary font-ku-semibold text-ku-caption",
  panel: "bg-ku-surface border-ku-border-subtle rounded-[18px] border p-ku-md",
  panelHeader: "flex-row items-start justify-between",
  panelHeading: "flex-1 min-w-0 pr-ku-12",
  sectionTitle: "text-ku-text-strong font-ku-bold text-ku-body",
  sectionHint:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-3",
  scenarioList: "gap-ku-sm mt-ku-12",
  scenarioOption:
    "items-center bg-ku-surface-muted border-ku-border-subtle rounded-[14px] border flex-row min-h-[52px] p-ku-12",
  scenarioOptionSelected: "bg-ku-surface-success border-ku-border-success",
  scenarioOptionCopy: "flex-1 min-w-0 pr-ku-sm",
  scenarioOptionLabel:
    "text-ku-text-strong font-ku-semibold text-ku-body-small",
  scenarioOptionMeta:
    "text-ku-text-secondary font-ku-regular text-ku-caption mt-ku-2",
  scenarioLabel: "text-ku-text-muted font-ku-semibold text-ku-caption mt-ku-14",
  scenarioName:
    "text-ku-text-strong font-ku-semibold text-ku-body-small mt-ku-2",
  scenarioRoute: "text-ku-primary font-ku-regular text-ku-caption mt-ku-2",
  statusPanel:
    "bg-ku-surface-success border-ku-border-success rounded-[18px] border p-ku-md",
  statusLabel: "text-ku-text-secondary font-ku-semibold text-ku-caption",
  statusValue:
    "text-ku-primary font-ku-bold text-[22px] leading-[28px] mt-ku-3",
  questTitle: "text-ku-text-strong font-ku-semibold text-ku-body mt-ku-14",
  questDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-3",
  statusMeta: "border-ku-border-success border-t mt-ku-14 pt-ku-12",
  metaLabel: "text-ku-text-secondary font-ku-regular text-ku-caption",
  metaValue: "text-ku-text-strong font-ku-semibold text-ku-body-small mt-ku-2",
  applicationList: "gap-ku-sm mt-ku-12",
  application:
    "bg-ku-surface-muted border-ku-border-subtle rounded-[14px] border p-ku-12",
  applicationHeader: "flex-row items-start justify-between",
  applicationCopy: "flex-1 min-w-0 pr-ku-sm",
  applicationId: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  applicationApplicant:
    "text-ku-text-secondary font-ku-regular text-ku-caption mt-ku-2",
  applicationStatus: "text-ku-text-muted font-ku-semibold text-ku-caption",
  applicationStatusPending: "text-ku-primary",
  applicationStatusSelected: "text-ku-success",
  applicationStatusRejected: "text-ku-danger-dark",
  personaOption:
    "bg-ku-surface-muted border-ku-border-subtle rounded-[14px] border flex-row items-center min-h-[60px] px-ku-12 py-ku-sm",
  personaOptionSelected: "bg-ku-surface-success border-ku-border-success",
  personaOptionCopy: "flex-1 min-w-0 pr-ku-12",
  personaOptionLabel:
    "text-ku-text-strong font-ku-semibold text-ku-body-small shrink",
  personaOptionMeta:
    "text-ku-text-secondary font-ku-regular text-ku-caption mt-ku-2 shrink",
  personaOptionIndicator:
    "items-center justify-center shrink-0 h-[24px] w-[24px]",
  applicationActions: "flex-row gap-ku-sm mt-ku-10",
  decisionActions: "flex-row gap-ku-10 mt-ku-12",
  actionList: "gap-ku-sm mt-ku-12",
  actionChoiceList: "gap-ku-sm mt-ku-12",
  actionButton:
    "items-center flex-row min-h-[50px] rounded-[14px] px-ku-14 active:opacity-80",
  actionButtonPrimary: "bg-ku-primary",
  actionButtonSecondary: "bg-ku-surface border-ku-primary border",
  actionButtonDanger: "bg-ku-surface-danger border-ku-danger border",
  actionButtonNeutral: "bg-ku-surface border-ku-border border",
  actionButtonCompact: "flex-1 justify-center min-h-[46px] px-ku-12",
  actionButtonDisabled: "opacity-50",
  actionText: "font-ku-semibold text-ku-control",
  actionTextLight: "text-ku-on-primary",
  actionTextPrimary: "text-ku-primary",
  actionTextDanger: "text-ku-danger-dark",
  actionTextNeutral: "text-ku-text-strong",
  actionCopy: "flex-1 min-w-0 ml-ku-10",
  actionCopyCompact: "flex-none ml-ku-7",
  actionDescription: "font-ku-regular text-ku-caption mt-ku-1",
  actionDescriptionLight: "text-ku-on-primary/80",
  actionDescriptionMuted: "text-ku-text-secondary",
  feedback:
    "bg-ku-surface-success border-ku-border-success rounded-[14px] border flex-row p-ku-12",
  feedbackError: "bg-ku-surface-danger border-ku-border-danger",
  feedbackIcon: "items-center rounded-ku-pill h-[28px] justify-center w-[28px]",
  feedbackIconSuccess: "bg-ku-surface-success",
  feedbackIconError: "bg-ku-surface-danger",
  feedbackCopy: "flex-1 min-w-0 ml-ku-sm",
  feedbackLabel: "text-ku-text-strong font-ku-semibold text-ku-body-small",
  feedbackMessage:
    "text-ku-text-secondary font-ku-regular text-ku-caption mt-ku-1",
  resetButton:
    "items-center border-ku-border rounded-ku-pill border min-h-[48px] justify-center px-ku-md",
  resetButtonText: "text-ku-primary font-ku-semibold text-ku-control",
  empty: "bg-ku-surface-muted rounded-[14px] p-ku-12 mt-ku-12",
  emptyText: "text-ku-text-secondary font-ku-regular text-ku-body-small",
} as const;

export default styles;
