import type { SupportedLocale } from "./locale";

export interface AlertMessages {
  dismiss: string;
  errorFallback: string;
}

export const alertMessages: Record<SupportedLocale, AlertMessages> = {
  en: {
    dismiss: "OK",
    errorFallback: "Something went wrong. Please try again.",
  },
  th: {
    dismiss: "ตกลง",
    errorFallback: "เกิดข้อผิดพลาด โปรดลองอีกครั้ง",
  },
};
