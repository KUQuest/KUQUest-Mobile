const styles = {
  safeArea: "flex-1 bg-ku-background",
  keyboardAvoiding: "flex-1",
  header: "h-[56px] flex-row items-center px-ku-12",
  backButton: "h-[48px] w-[48px] items-center justify-center",
  headerTitle: "ml-ku-xs text-ku-text-strong font-ku-bold text-ku-title-small",
  scroll: "flex-1",
  content: "w-full max-w-[720px] self-center px-ku-20 pb-ku-xl pt-ku-12",
  intro: "mb-ku-20 text-ku-text-secondary font-ku-regular text-ku-body-small",
  contextCard:
    "mb-ku-20 rounded-[16px] border border-ku-border-accent bg-ku-surface-accent px-ku-md py-ku-14",
  contextLabel: "text-ku-text-muted font-ku-semibold text-ku-label",
  contextItem:
    "mt-ku-xs text-ku-text-strong font-ku-semibold text-ku-body-small",
  contextDescription:
    "mt-ku-sm text-ku-text-secondary font-ku-regular text-ku-label",
  form: "rounded-[16px] border border-ku-border-subtle bg-ku-card px-ku-md pb-ku-xs pt-ku-20",
  reasonField: "mb-ku-md",
  reasonLabel: "mb-ku-8 text-ku-text-secondary font-ku-bold text-ku-label",
  reasonError: "mt-ku-xs text-ku-danger-dark font-ku-medium text-ku-label",
  choiceList: "gap-ku-sm",
  choiceItem:
    "min-h-[48px] flex-row items-center justify-between rounded-[12px] border border-ku-border-muted bg-ku-card px-ku-14 py-ku-10",
  choiceItemSelected: "border-ku-primary bg-ku-surface-accent",
  choiceLabel: "flex-1 text-ku-text-strong font-ku-medium text-ku-body-small",
  choiceLabelSelected: "text-ku-primary font-ku-semibold",
  radioIndicator:
    "h-[20px] w-[20px] rounded-full border-2 border-ku-border-muted items-center justify-center ml-ku-sm",
  radioIndicatorSelected: "border-ku-primary",
  radioDot: "h-[10px] w-[10px] rounded-full bg-ku-primary",
  detailsField: "mt-ku-md",
  counter:
    "mt-ku-xs text-right text-ku-text-muted font-ku-regular text-ku-label",
  helper: "mb-ku-12 text-ku-text-muted font-ku-regular text-ku-label",
  reviewCard:
    "rounded-[16px] border border-ku-border-subtle bg-ku-card px-ku-md py-ku-20",
  reviewField: "mb-ku-20",
  reviewLabel: "mb-ku-xs text-ku-text-muted font-ku-semibold text-ku-label",
  reviewValue: "text-ku-text-strong font-ku-regular text-ku-body",
  reviewDetailsValue: "text-ku-text-secondary font-ku-regular text-ku-body",
  reviewActions: "gap-ku-12",
  submitButton: "bg-ku-danger",
  errorBanner:
    "mb-ku-16 rounded-[12px] border border-ku-border-danger bg-ku-surface-danger p-ku-12",
  errorText: "text-ku-danger-dark font-ku-medium text-ku-body-small",
  actionBar: "border-t border-ku-border-subtle bg-ku-surface px-ku-20 pt-ku-12",
  success:
    "mt-ku-sm items-center rounded-[16px] border border-ku-border-subtle bg-ku-card px-ku-lg py-ku-28",
  successIcon:
    "mb-ku-md h-[72px] w-[72px] items-center justify-center rounded-[36px] bg-ku-surface-success",
  successTitle:
    "text-center text-ku-text-strong font-ku-bold text-ku-title-small",
  successDescription:
    "mt-ku-sm text-center text-ku-text-secondary font-ku-regular text-ku-body-small",
  successButton: "mt-ku-lg",
  unavailable:
    "mt-ku-sm items-center rounded-[16px] border border-ku-border-subtle bg-ku-card px-ku-lg py-ku-28",
  unavailableIcon:
    "mb-ku-md h-[72px] w-[72px] items-center justify-center rounded-[36px] bg-ku-surface-muted",
  unavailableTitle:
    "text-center text-ku-text-strong font-ku-bold text-ku-title-small",
  unavailableDescription:
    "mt-ku-sm text-center text-ku-text-secondary font-ku-regular text-ku-body-small",
  unavailableButton: "mt-ku-lg",
} as const;

export default styles;
