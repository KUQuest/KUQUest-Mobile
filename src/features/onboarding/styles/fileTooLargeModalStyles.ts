const styles = {
  overlay: 'flex-1 bg-ku-overlay justify-center items-center p-[24px]',
  modalContainer: 'shadow-[0px_2px_4px_rgb(18_32_24_/0.25)] bg-ku-surface-subtle rounded-[24px] p-[32px] w-full items-center',
  icon: 'mb-[16px]',
  title: 'font-ku-bold text-[20px] text-ku-text-strong mb-[12px] text-center',
  description: 'font-ku-regular text-[14px] text-ku-text-muted text-center leading-[20px] mb-[24px]',
  tryAgainButton: 'bg-ku-primary flex-row items-center justify-center py-[14px] rounded-[24px] w-full mb-[12px]',
  tryAgainText: 'font-ku-bold text-[16px] text-ku-white',
  btnIcon: 'mr-[8px]',
  backButton: 'bg-transparent border border-ku-text-muted items-center justify-center py-[14px] rounded-[24px] w-full',
  backText: 'font-ku-bold text-[16px] text-ku-text-strong',
} as const;

export default styles;
