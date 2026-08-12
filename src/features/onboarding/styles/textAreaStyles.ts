const styles = {
  container: 'mb-[16px] w-full',
  label: 'font-ku-bold text-[12px] text-ku-text-secondary mb-[6px]',
  input: 'font-ku-regular text-[14px] text-ku-text-strong border border-ku-border-muted rounded-[8px] px-[12px] pt-[12px] pb-[12px] bg-ku-white min-h-[120px]',
  inputError: 'border-ku-danger',
  inputFocused: 'border-ku-primary',
  inputSuccess: 'border-ku-success',
  inputDisabled: 'bg-ku-surface-muted opacity-[0.6]',
  footerRow: 'flex-row justify-between items-center mt-[4px]',
  errorText: 'font-ku-regular text-[12px] text-ku-danger flex-1',
  counterText: 'font-ku-regular text-[11px] text-ku-text-faint text-right',
} as const;

export default styles;
