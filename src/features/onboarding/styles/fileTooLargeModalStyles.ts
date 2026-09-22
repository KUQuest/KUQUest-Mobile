const styles = {
  overlay: "flex-1 bg-ku-overlay justify-center items-center p-ku-lg",
  modalContainer:
    "shadow-[0px_2px_5px_rgb(18_32_24_/0.18)] bg-ku-card rounded-[24px] p-ku-28 w-full items-center",
  icon: "mb-ku-md",
  title:
    "font-ku-bold text-ku-section text-ku-text-strong mb-ku-12 text-center",
  description:
    "font-ku-regular text-ku-body-small text-ku-text-muted text-center mb-ku-lg",
  tryAgainButton:
    "bg-ku-primary flex-row items-center justify-center py-ku-14 rounded-[24px] w-full mb-ku-12",
  tryAgainText: "font-ku-bold text-ku-body text-ku-on-primary",
  btnIcon: "mr-ku-sm",
  backButton:
    "bg-transparent border border-ku-text-muted items-center justify-center py-ku-14 rounded-[24px] w-full",
  backText: "font-ku-bold text-ku-body text-ku-text-strong",
} as const;

export default styles;
