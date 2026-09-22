const styles = {
  container: "mb-ku-md w-full",
  label: "font-ku-bold text-ku-label text-ku-text-secondary mb-ku-6",
  input:
    "font-ku-regular text-ku-body-small text-ku-text-strong border border-ku-border-muted rounded-[10px] px-ku-12 py-ku-10 bg-ku-card min-h-[48px]",
  inputError: "border-ku-danger",
  inputFocused: "border-ku-primary",
  inputSuccess: "border-ku-success",
  inputDisabled: "bg-ku-surface-muted opacity-[0.6]",
  errorText: "font-ku-regular text-ku-label text-ku-danger mt-ku-xs",
} as const;

export default styles;
