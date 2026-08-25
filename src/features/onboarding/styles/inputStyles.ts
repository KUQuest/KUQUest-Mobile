const styles = {
  container: 'mb-[16px] w-full',
  label: 'font-ku-bold text-ku-label text-ku-text-secondary mb-[6px]',
  input: 'font-ku-regular text-ku-body-small text-ku-text-strong border border-ku-border-muted rounded-[10px] px-[12px] py-[10px] bg-ku-card min-h-[48px]',
  inputError: 'border-ku-danger',
  inputFocused: 'border-ku-primary',
  inputSuccess: 'border-ku-success',
  inputDisabled: 'bg-ku-surface-muted opacity-[0.6]',
  errorText: 'font-ku-regular text-ku-label text-ku-danger mt-[4px]',
} as const;

export default styles;
