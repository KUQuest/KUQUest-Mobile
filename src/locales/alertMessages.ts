import type { SupportedLocale } from "./locale";

export interface AlertMessages {
  dismiss: string;
  errorFallback: string;
  networkError: string;
  sessionExpired: string;
  forbidden: string;
  notFound: string;
  rateLimited: string;
  serverError: string;
  imageDimensionsTooLarge: string;
  proofFilesUploadFailed: string;
  proofRetryPositionInvalid: string;
  proofRetryPositionConflict: string;
}

export const alertMessages: Record<SupportedLocale, AlertMessages> = {
  en: {
    dismiss: "OK",
    errorFallback: "Something went wrong. Please try again.",
    networkError:
      "Can't reach KUQuest. Check your internet connection and try again.",
    sessionExpired: "Your session has expired. Please sign in again.",
    forbidden: "You don't have permission to do this.",
    notFound: "This item is no longer available.",
    rateLimited: "Too many attempts. Please wait a moment and try again.",
    serverError:
      "KUQuest is having trouble right now. Please try again shortly.",
    imageDimensionsTooLarge:
      "This image has too much detail. Reduce its resolution or choose another file.",
    proofFilesUploadFailed:
      "Some proof files failed to upload. Replace failed files and try again.",
    proofRetryPositionInvalid: "Choose one failed proof file before retrying.",
    proofRetryPositionConflict:
      "Proof changed on the server. Refresh and retry the failed file.",
  },
  th: {
    dismiss: "ตกลง",
    errorFallback: "เกิดข้อผิดพลาด โปรดลองอีกครั้ง",
    networkError:
      "เชื่อมต่อ KUQuest ไม่ได้ โปรดตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง",
    sessionExpired: "เซสชันหมดอายุ โปรดเข้าสู่ระบบอีกครั้ง",
    forbidden: "คุณไม่มีสิทธิ์ดำเนินการนี้",
    notFound: "รายการนี้ไม่มีอยู่แล้ว",
    rateLimited: "ลองหลายครั้งเกินไป โปรดรอสักครู่แล้วลองอีกครั้ง",
    serverError: "ระบบ KUQuest ขัดข้องชั่วคราว โปรดลองอีกครั้งในอีกสักครู่",
    imageDimensionsTooLarge:
      "รูปภาพมีความละเอียดสูงเกินไป โปรดลดความละเอียดหรือเลือกไฟล์อื่น",
    proofFilesUploadFailed:
      "ไฟล์หลักฐานบางรายการอัปโหลดไม่สำเร็จ โปรดเปลี่ยนไฟล์ที่ล้มเหลวแล้วลองอีกครั้ง",
    proofRetryPositionInvalid: "เลือกไฟล์หลักฐานที่ล้มเหลว 1 รายการก่อนลองใหม่",
    proofRetryPositionConflict:
      "หลักฐานถูกเปลี่ยนแปลงบนเซิร์ฟเวอร์ โปรดรีเฟรชแล้วลองไฟล์ที่ล้มเหลวอีกครั้ง",
  },
};
