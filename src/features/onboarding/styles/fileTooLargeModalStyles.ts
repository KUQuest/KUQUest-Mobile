const styles = {
  overlay: 'flex-1 bg-ku-overlay justify-center items-center p-[24px]',
  modalContainer: 'shadow-[0px_2px_5px_rgb(18_32_24_/0.18)] bg-ku-card rounded-[24px] p-[28px] w-full items-center',
  icon: 'mb-[16px]',
  title: 'font-ku-bold text-ku-section text-ku-text-strong mb-[12px] text-center',
  description: 'font-ku-regular text-ku-body-small text-ku-text-muted text-center mb-[24px]',
  tryAgainButton: 'bg-ku-primary flex-row items-center justify-center py-[14px] rounded-[24px] w-full mb-[12px]',
  tryAgainText: 'font-ku-bold text-ku-body text-ku-white',
  btnIcon: 'mr-[8px]',
  backButton: 'bg-transparent border border-ku-text-muted items-center justify-center py-[14px] rounded-[24px] w-full',
  backText: 'font-ku-bold text-ku-body text-ku-text-strong',
} as const;

export default styles;
