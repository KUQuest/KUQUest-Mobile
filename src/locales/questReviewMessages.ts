import type { SupportedLocale } from "./locale";

export interface QuestReviewMessages {
  close: string;
  title: string;
  description: string;
  loading: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  noWorkersTitle: string;
  noWorkersDescription: string;
  workerLabel: string;
  workerFallback: (id: string) => string;
  ratingLabel: string;
  ratingOption: (rating: number) => string;
  commentLabel: string;
  commentPlaceholder: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successDescription: string;
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
      description: "Share feedback about the Worker after this Quest.",
      loading: "Loading review details…",
      errorTitle: "Review unavailable",
      errorDescription: "We couldn't load the Workers for this Quest.",
      retry: "Try again",
      noWorkersTitle: "No Workers to review",
      noWorkersDescription:
        "This Quest has no eligible Worker assignments for a review.",
      workerLabel: "Worker",
      workerFallback: (id) => `Worker ${id.slice(0, 8)}`,
      ratingLabel: "Rating",
      ratingOption: (rating) => `${rating} out of 5 stars`,
      commentLabel: "Comment (optional)",
      commentPlaceholder: "What went well or could be improved?",
      submit: "Submit review",
      submitting: "Submitting…",
      successTitle: "Review submitted",
      successDescription: "Your feedback was saved for this Worker.",
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
      description: "แบ่งปันความคิดเห็นเกี่ยวกับผู้ทำงานหลังจบเควสต์นี้",
      loading: "กำลังโหลดข้อมูลรีวิว…",
      errorTitle: "ไม่สามารถรีวิวได้",
      errorDescription: "ไม่สามารถโหลดรายชื่อผู้ทำงานของเควสต์นี้ได้",
      retry: "ลองอีกครั้ง",
      noWorkersTitle: "ไม่มีผู้ทำงานให้รีวิว",
      noWorkersDescription: "เควสต์นี้ไม่มีผู้ทำงานที่สามารถรีวิวได้",
      workerLabel: "ผู้ทำงาน",
      workerFallback: (id) => `ผู้ทำงาน ${id.slice(0, 8)}`,
      ratingLabel: "คะแนน",
      ratingOption: (rating) => `${rating} จาก 5 ดาว`,
      commentLabel: "ความคิดเห็น (ไม่บังคับ)",
      commentPlaceholder: "สิ่งที่ทำได้ดีหรือควรปรับปรุงคืออะไร",
      submit: "ส่งรีวิว",
      submitting: "กำลังส่ง…",
      successTitle: "ส่งรีวิวแล้ว",
      successDescription: "บันทึกความคิดเห็นของคุณสำหรับผู้ทำงานแล้ว",
      done: "เสร็จสิ้น",
      invalidRating: "กรุณาเลือกคะแนนตั้งแต่ 1 ถึง 5 ดาว",
      invalidComment: "ความคิดเห็นต้องมีความยาวไม่เกิน 1,000 ตัวอักษร",
      unavailableTitle: "ไม่สามารถรีวิวได้",
      unavailableDescription:
        "สามารถรีวิวได้หลังจากเควสต์เข้าสู่สถานะสิ้นสุดเท่านั้น",
    },
  };
