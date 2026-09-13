const styles = {
  safeArea: "flex-1 bg-ku-background",
  keyboardAvoiding: "flex-1",
  header: "h-[56px] flex-row items-center px-[12px]",
  backButton: "h-[48px] w-[48px] items-center justify-center",
  headerTitle: "ml-[4px] text-ku-text-strong font-ku-bold text-ku-title-small",
  scroll: "flex-1",
  content: "w-full max-w-[720px] self-center px-[20px] pb-[32px] pt-[12px]",
  intro: "mb-[20px] text-ku-text-secondary font-ku-regular text-ku-body-small",
  contextCard:
    "mb-[20px] rounded-[16px] border border-ku-border-accent bg-ku-surface-accent px-[16px] py-[14px]",
  contextLabel: "text-ku-text-muted font-ku-semibold text-ku-label",
  contextType: "mt-[4px] text-ku-primary font-ku-semibold text-ku-body-small",
  contextTitle: "mt-[2px] text-ku-text-strong font-ku-semibold text-ku-body",
  contextDescription:
    "mt-[8px] text-ku-text-secondary font-ku-regular text-ku-label",
  form: "rounded-[16px] border border-ku-border-subtle bg-ku-card px-[16px] pb-[4px] pt-[20px]",
  topicField: "mb-[16px]",
  topicLabel: "mb-[6px] text-ku-text-secondary font-ku-bold text-ku-label",
  topicTrigger:
    "min-h-[52px] items-center justify-between rounded-[12px] border border-ku-border-muted bg-ku-card flex-row px-[12px] py-[8px]",
  topicTriggerError: "border-ku-danger",
  topicError: "mt-[4px] text-ku-danger-dark font-ku-medium text-ku-label",
  topicTriggerText:
    "flex-1 text-ku-text-strong font-ku-regular text-ku-body-small",
  topicTriggerPlaceholder: "text-ku-text-faint",
  selectedTopics: "mt-[10px] flex-row flex-wrap gap-[8px]",
  selectedTopicTag: "rounded-ku-pill bg-ku-surface-accent px-[10px] py-[6px]",
  selectedTopicTagText: "text-ku-primary font-ku-semibold text-ku-label",
  topicPicker: "flex-1 bg-ku-background",
  topicPickerHeader:
    "min-h-[64px] items-center justify-between border-b border-ku-border-subtle bg-ku-surface flex-row px-[12px]",
  topicPickerBack: "h-[48px] w-[48px] items-center justify-center",
  topicPickerTitle:
    "flex-1 text-center text-ku-text-strong font-ku-bold text-ku-title-small",
  topicPickerHeaderSpacer: "h-[48px] w-[48px]",
  topicPickerScroll: "flex-1",
  topicPickerContent: "px-[20px] pb-[32px] pt-[20px]",
  topicPickerDescription:
    "mb-[20px] text-ku-text-secondary font-ku-regular text-ku-body-small",
  topicTagList: "flex-row flex-wrap gap-[10px]",
  topicTag:
    "min-h-[48px] items-center rounded-ku-pill border border-ku-border-muted bg-ku-card flex-row px-[14px] py-[10px]",
  topicTagSelected: "border-ku-primary bg-ku-surface-accent",
  topicTagText: "text-ku-text-secondary font-ku-medium text-ku-body-small",
  topicTagTextSelected: "text-ku-primary font-ku-semibold",
  topicTagCheck: "ml-[8px]",
  topicPickerFooter:
    "border-t border-ku-border-subtle bg-ku-surface px-[20px] pt-[12px]",
  reviewTags: "flex-row flex-wrap gap-[8px]",
  reviewTag: "rounded-ku-pill bg-ku-surface-accent px-[10px] py-[6px]",
  reviewTagText: "text-ku-primary font-ku-semibold text-ku-label",
  reviewCard:
    "rounded-[16px] border border-ku-border-subtle bg-ku-card px-[16px] py-[20px]",
  reviewField: "mb-[20px]",
  reviewLabel: "mb-[4px] text-ku-text-muted font-ku-semibold text-ku-label",
  reviewValue: "text-ku-text-strong font-ku-regular text-ku-body",
  reviewDetailsValue: "text-ku-text-secondary font-ku-regular text-ku-body",
  helper: "mb-[12px] text-ku-text-muted font-ku-regular text-ku-label",
  reviewActions: "gap-[12px]",
  submitButton: "bg-ku-danger",
  actionBar:
    "border-t border-ku-border-subtle bg-ku-surface px-[20px] pt-[12px]",
  success:
    "mt-[8px] items-center rounded-[16px] border border-ku-border-subtle bg-ku-card px-[24px] py-[28px]",
  successIcon:
    "mb-[16px] h-[72px] w-[72px] items-center justify-center rounded-[36px] bg-ku-surface-success",
  successTitle:
    "text-center text-ku-text-strong font-ku-bold text-ku-title-small",
  successDescription:
    "mt-[8px] text-center text-ku-text-secondary font-ku-regular text-ku-body-small",
  successButton: "mt-[24px]",
} as const;

export default styles;
