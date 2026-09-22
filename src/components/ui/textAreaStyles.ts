const styles = {
  container: "mb-ku-md w-full",
  label: "font-ku-bold text-ku-label text-ku-text-secondary mb-ku-6",
  input:
    "font-ku-regular text-ku-body-small text-ku-text-strong border border-ku-border-muted rounded-[10px] px-ku-12 pt-ku-12 pb-ku-12 bg-ku-card min-h-[120px]",
  inputError: "border-ku-danger",
  inputFocused: "border-ku-primary",
  inputSuccess: "border-ku-success",
  inputDisabled: "bg-ku-surface-muted opacity-[0.6]",
  footerRow: "flex-row justify-between items-center mt-ku-xs",
  errorText: "font-ku-regular text-ku-label text-ku-danger flex-1",
  counterText: "font-ku-regular text-ku-caption text-ku-text-faint text-right",
} as const;

export default styles;
