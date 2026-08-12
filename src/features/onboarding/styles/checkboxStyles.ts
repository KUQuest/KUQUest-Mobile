const styles = {
  container: 'mb-[16px]',
  row: 'flex-row items-center min-h-[44px]',
  box: 'w-[20px] h-[20px] border-[1.5px] border-ku-border-muted rounded-[4px] mr-[10px] justify-center items-center bg-ku-white',
  boxChecked: 'bg-ku-primary border-ku-primary',
  boxError: 'border-ku-danger',
  label: 'font-ku-regular text-[14px] text-ku-text-secondary flex-1',
  errorText: 'font-ku-regular text-[12px] text-ku-danger mt-[4px] ml-[30px]',
} as const;

export default styles;
