const styles = {
  container: "mb-ku-md w-full",
  label: "font-ku-bold text-ku-label text-ku-text-secondary mb-ku-6",
  selectBox:
    "flex-row justify-between items-center border border-ku-border-muted rounded-[10px] px-ku-12 py-ku-10 bg-ku-card min-h-[48px]",
  selectBoxError: "border-ku-danger",
  selectBoxSuccess: "border-ku-success",
  selectBoxDisabled: "bg-ku-surface-muted opacity-[0.6]",
  selectText: "font-ku-regular text-ku-body-small text-ku-text-strong",
  placeholderText: "text-ku-text-faint",
  errorText: "font-ku-regular text-ku-label text-ku-danger mt-ku-xs",
  modalOverlay: "flex-1 justify-end bg-ku-overlay",
  keyboardAvoidingView: "flex-1 justify-end w-full",
  modalDismissArea: "flex-1 justify-end",
  modalContent:
    "bg-ku-card rounded-tl-[24px] rounded-tr-[24px] max-h-[82%] overflow-hidden",
  modalHandle:
    "self-center w-[36px] h-[4px] rounded-[2px] bg-ku-border-muted mt-ku-10",
  modalHeader:
    "flex-row justify-between items-center px-ku-20 pt-ku-20 pb-ku-12 border-b border-b-ku-border-muted",
  modalTitle: "font-ku-bold text-ku-body text-ku-text-strong",
  closeButton: "items-center justify-center min-h-[48px] min-w-[48px]",
  clearButton: "items-center justify-center min-h-[48px] min-w-[48px]",
  searchContainer:
    "flex-row items-center mx-ku-20 my-ku-12 px-ku-sm border border-ku-border-muted rounded-[10px] bg-ku-surface-subtle min-h-[48px]",
  dropdownOverlay: "flex-1",
  dropdownDismissArea: "absolute top-0 right-0 bottom-0 left-0",
  dropdownMenu:
    "bg-ku-card rounded-[10px] border border-ku-border-muted overflow-hidden",
  dropdownSearchContainer: "mx-ku-12 my-ku-10",
  searchInput:
    "flex-1 px-ku-sm py-ku-sm font-ku-regular text-ku-body-small text-ku-text-strong",
  optionItem:
    "flex-row justify-between items-center min-h-[52px] py-ku-14 px-ku-20 border-b border-b-ku-surface-muted",
  optionText: "font-ku-regular text-ku-body text-ku-text-secondary",
  optionTextSelected: "font-ku-bold text-ku-primary",
  emptyText:
    "p-ku-lg text-center font-ku-regular text-ku-body-small text-ku-text-muted",
} as const;

export default styles;
