const styles = {
  container: "mb-ku-md",
  row: "flex-row items-center min-h-[48px]",
  box: "w-[22px] h-[22px] border-[1.5px] border-ku-border-muted rounded-[5px] mr-ku-10 justify-center items-center bg-ku-card",
  boxChecked: "bg-ku-primary border-ku-primary",
  boxError: "border-ku-danger",
  label: "font-ku-regular text-ku-body-small text-ku-text-secondary flex-1",
  errorText: "font-ku-regular text-ku-label text-ku-danger mt-ku-xs ml-ku-30",
} as const;

export default styles;
