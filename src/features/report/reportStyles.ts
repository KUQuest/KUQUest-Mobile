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
  contextType: "mt-ku-xs text-ku-primary font-ku-semibold text-ku-body-small",
  contextTitle: "mt-ku-2 text-ku-text-strong font-ku-semibold text-ku-body",
  contextDescription:
    "mt-ku-sm text-ku-text-secondary font-ku-regular text-ku-label",
  form: "rounded-[16px] border border-ku-border-subtle bg-ku-card px-ku-md pb-ku-xs pt-ku-20",
  topicField: "mb-ku-md",
  topicLabel: "mb-ku-6 text-ku-text-secondary font-ku-bold text-ku-label",
  topicTrigger:
    "min-h-[52px] items-center justify-between rounded-[12px] border border-ku-border-muted bg-ku-card flex-row px-ku-12 py-ku-sm",
  topicTriggerError: "border-ku-danger",
  topicError: "mt-ku-xs text-ku-danger-dark font-ku-medium text-ku-label",
  topicTriggerText:
    "flex-1 text-ku-text-strong font-ku-regular text-ku-body-small",
  topicTriggerPlaceholder: "text-ku-text-faint",
  selectedTopics: "mt-ku-10 flex-row flex-wrap gap-ku-sm",
  selectedTopicTag: "rounded-ku-pill bg-ku-surface-accent px-ku-10 py-ku-6",
  selectedTopicTagText: "text-ku-primary font-ku-semibold text-ku-label",
  topicPicker: "flex-1 bg-ku-background",
  topicPickerHeader:
    "min-h-[64px] items-center justify-between border-b border-ku-border-subtle bg-ku-surface flex-row px-ku-12",
  topicPickerBack: "h-[48px] w-[48px] items-center justify-center",
  topicPickerTitle:
    "flex-1 text-center text-ku-text-strong font-ku-bold text-ku-title-small",
  topicPickerHeaderSpacer: "h-[48px] w-[48px]",
  topicPickerScroll: "flex-1",
  topicPickerContent: "px-ku-20 pb-ku-xl pt-ku-20",
  topicPickerDescription:
    "mb-ku-20 text-ku-text-secondary font-ku-regular text-ku-body-small",
  topicTagList: "flex-row flex-wrap gap-ku-10",
  topicTag:
    "min-h-[48px] items-center rounded-ku-pill border border-ku-border-muted bg-ku-card flex-row px-ku-14 py-ku-10",
  topicTagSelected: "border-ku-primary bg-ku-surface-accent",
  topicTagText: "text-ku-text-secondary font-ku-medium text-ku-body-small",
  topicTagTextSelected: "text-ku-primary font-ku-semibold",
  topicTagCheck: "ml-ku-sm",
  topicPickerFooter:
    "border-t border-ku-border-subtle bg-ku-surface px-ku-20 pt-ku-12",
  reviewTags: "flex-row flex-wrap gap-ku-sm",
  reviewTag: "rounded-ku-pill bg-ku-surface-accent px-ku-10 py-ku-6",
  reviewTagText: "text-ku-primary font-ku-semibold text-ku-label",
  reviewCard:
    "rounded-[16px] border border-ku-border-subtle bg-ku-card px-ku-md py-ku-20",
  reviewField: "mb-ku-20",
  reviewLabel: "mb-ku-xs text-ku-text-muted font-ku-semibold text-ku-label",
  reviewValue: "text-ku-text-strong font-ku-regular text-ku-body",
  reviewDetailsValue: "text-ku-text-secondary font-ku-regular text-ku-body",
  helper: "mb-ku-12 text-ku-text-muted font-ku-regular text-ku-label",
  reviewActions: "gap-ku-12",
  submitButton: "bg-ku-danger",
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
} as const;

export default styles;
