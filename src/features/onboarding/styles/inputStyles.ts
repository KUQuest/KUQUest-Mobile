const styles = {
  container: 'mb-[16px] w-full',
  label: 'font-ku-bold text-[12px] text-ku-text-secondary mb-[6px]',
  input: 'font-ku-regular text-[14px] text-ku-text-strong border border-ku-border-muted rounded-[8px] px-[12px] py-[10px] bg-ku-white min-h-[44px]',
  inputError: 'border-ku-danger',
  inputFocused: 'border-ku-primary',
  inputSuccess: 'border-ku-success',
  inputDisabled: 'bg-ku-surface-muted opacity-[0.6]',
  errorText: 'font-ku-regular text-[12px] text-ku-danger mt-[4px]',
  helperSlot: 'min-h-[18px] mt-[4px]',
} as const;

export default styles;
