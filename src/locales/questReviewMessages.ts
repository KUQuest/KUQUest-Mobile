import type { SupportedLocale } from "./locale";

export interface QuestReviewMessages {
  close: string;
  title: string;
  editTitle: string;
  description: string;
  loading: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  noWorkersTitle: string;
  noWorkersDescription: string;
  workerLabel: string;
  workerFallback: (index: number) => string;
  hirerLabel: string;
  ratingLabel: string;
  ratingOption: (rating: number) => string;
  commentLabel: string;
  commentPlaceholder: string;
  submit: string;
  submitting: string;
  done: string;
  invalidRating: string;
  invalidComment: string;
  unavailableTitle: string;
  unavailableDescription: string;
}

export const questReviewMessages: Record<SupportedLocale, QuestReviewMessages> =
  {
    en: {
      close: "Close",
      title: "Review Quest",
      editTitle: "Edit review",
      description: "Share feedback with the other Member after this Quest.",
      loading: "Loading review details…",
      errorTitle: "Review unavailable",
      errorDescription: "We couldn't load the Workers for this Quest.",
      retry: "Try again",
      noWorkersTitle: "No Workers to review",
      noWorkersDescription:
        "This Quest has no eligible Worker assignments for a review.",
      workerLabel: "Worker",
      hirerLabel: "Hirer",
      workerFallback: (index) => `Worker ${index}`,
      ratingLabel: "Rating",
      ratingOption: (rating) => `${rating} out of 5 stars`,
      commentLabel: "Comment (optional)",
      commentPlaceholder: "What went well or could be improved?",
      submit: "Submit review",
      submitting: "Submitting…",
      done: "Done",
      invalidRating: "Choose a rating from 1 to 5 stars.",
      invalidComment: "Comments must be 1,000 characters or fewer.",
      unavailableTitle: "Review unavailable",
      unavailableDescription:
        "Reviews can only be submitted after a Quest reaches a terminal state.",
    },
    th: {
      close: "ปิด",
      title: "รีวิวเควสต์",
      description: "แบ่งปันความคิดเห็นกับ Member อีกคนหลังจบเควสต์นี้",
      loading: "กำลังโหลดข้อมูลรีวิว…",
      editTitle: "แก้ไขรีวิว",
      errorTitle: "ไม่สามารถรีวิวได้",
      errorDescription: "ไม่สามารถโหลดรายชื่อผู้ทำงานของเควสต์นี้ได้",
      retry: "ลองอีกครั้ง",
      noWorkersTitle: "ไม่มีผู้ทำงานให้รีวิว",
      noWorkersDescription: "เควสต์นี้ไม่มีผู้ทำงานที่สามารถรีวิวได้",
      workerLabel: "ผู้ทำงาน",
      workerFallback: (index) => `ผู้ทำงาน ${index}`,
      hirerLabel: "ผู้ว่าจ้าง",
      ratingLabel: "คะแนน",
      ratingOption: (rating) => `${rating} จาก 5 ดาว`,
      commentLabel: "ความคิดเห็น (ไม่บังคับ)",
      commentPlaceholder: "สิ่งที่ทำได้ดีหรือควรปรับปรุงคืออะไร",
      submit: "ส่งรีวิว",
      submitting: "กำลังส่ง…",
      done: "เสร็จสิ้น",
      invalidRating: "กรุณาเลือกคะแนนตั้งแต่ 1 ถึง 5 ดาว",
      invalidComment: "ความคิดเห็นต้องมีความยาวไม่เกิน 1,000 ตัวอักษร",
      unavailableTitle: "ไม่สามารถรีวิวได้",
      unavailableDescription:
        "สามารถรีวิวได้หลังจากเควสต์เข้าสู่สถานะสิ้นสุดเท่านั้น",
    },
  };
