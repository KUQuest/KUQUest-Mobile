import type { SupportedLocale } from "./locale";

export type WorkerWorkTab = "active" | "history";

export type WorkerWorkStatusKey =
  | "awaitingStart"
  | "consentUnderfilled"
  | "inProgress"
  | "submitProof"
  | "confirmCompletion"
  | "respondToEdit"
  | "proofPending"
  | "completed"
  | "incomplete"
  | "cancelled"
  | "failed";

export type WorkerWorkActionKey =
  | "submitProof"
  | "confirmCompletion"
  | "respondToEdit"
  | "consentUnderfilled"
  | "open";

export interface WorkerWorkMessages {
  title: string;
  subtitle: string;
  tabs: Record<WorkerWorkTab, string>;
  tabCount: (label: string, count: number) => string;
  needsActionHeading: string;
  otherWorkHeading: string;
  loading: string;
  loadError: string;
  retry: string;
  emptyActiveTitle: string;
  emptyActiveDescription: string;
  findQuests: string;
  emptyHistoryTitle: string;
  emptyHistoryDescription: string;
  status: Record<WorkerWorkStatusKey, string>;
  dueLabel: string;
  startsLabel: string;
  noDueAt: string;
  openWork: (title: string) => string;

  filesHeading: string;
  filesCount: (count: number, max: number) => string;
  filesHint: string;
  addFiles: string;
  removeFile: (name: string) => string;
  videoFile: string;
  fileTooLarge: (names: string) => string;
  fileLimitReached: string;
  pickerError: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionCount: (count: number, max: number) => string;
  proofInputRequired: string;
  sendLockNotice: string;
  submitProof: string;
  confirmSubmitTitle: string;
  confirmSubmitMessage: string;
  cancel: string;
  confirm: string;
  submitFailed: string;
  uploadFailed: (count: number) => string;
  fileRejected: string;
  submittedTitle: string;
  submittedAt: (value: string) => string;
  proofPendingDescription: string;
  proofApprovedDescription: string;
  proofNotApprovedDescription: string;
}

export const workerWorkMessages: Record<SupportedLocale, WorkerWorkMessages> = {
  th: {
    title: "งานของฉัน",
    subtitle: "ติดตามงานที่รับไว้ ส่งงาน และดูประวัติ",
    tabs: { active: "กำลังทำ", history: "ประวัติ" },
    tabCount: (label, count) => `${label}, ${count} รายการ`,
    needsActionHeading: "ต้องดำเนินการ",
    otherWorkHeading: "งานอื่นที่รับไว้",
    loading: "กำลังโหลดงานของคุณ",
    loadError: "โหลดงานไม่สำเร็จ",
    retry: "ลองใหม่",
    emptyActiveTitle: "ยังไม่มีงานที่กำลังทำ",
    emptyActiveDescription: "เลือกเควสต์ที่สนใจจากหน้าหลักเพื่อเริ่มรับงาน",
    findQuests: "หาเควสต์",
    emptyHistoryTitle: "ยังไม่มีประวัติงาน",
    emptyHistoryDescription: "งานที่จบแล้วจะแสดงที่นี่",
    status: {
      awaitingStart: "รอเริ่มงาน",
      consentUnderfilled: "รอคำตอบเรื่องคนไม่ครบ",
      inProgress: "กำลังทำงาน",
      submitProof: "รอส่งหลักฐาน",
      confirmCompletion: "รอยืนยันงานเสร็จ",
      respondToEdit: "มีคำขอแก้ไขเงื่อนไข",
      proofPending: "รอผู้ว่าจ้างตรวจ",
      completed: "สำเร็จ",
      incomplete: "ไม่ผ่าน",
      cancelled: "ยกเลิก",
      failed: "ล้มเหลว",
    },
    dueLabel: "กำหนดส่ง",
    startsLabel: "เริ่มงาน",
    noDueAt: "ไม่มีกำหนดส่ง",
    openWork: (title) => `เปิดงาน ${title}`,

    filesHeading: "ไฟล์หลักฐาน",
    filesCount: (count, max) => `${count}/${max} ไฟล์`,
    filesHint: "รูปภาพหรือวิดีโอ ไม่เกิน 10 MB ต่อไฟล์",
    addFiles: "เพิ่มไฟล์",
    removeFile: (name) => `ลบไฟล์ ${name}`,
    videoFile: "วิดีโอ",
    fileTooLarge: (names) => `ไฟล์ใหญ่เกิน 10 MB: ${names}`,
    fileLimitReached: "แนบได้สูงสุด 5 ไฟล์",
    pickerError: "เปิดคลังรูปภาพไม่สำเร็จ",
    descriptionLabel: "รายละเอียดงาน (ไม่บังคับ)",
    descriptionPlaceholder: "อธิบายสิ่งที่ทำ เช่น ขั้นตอนหรือผลลัพธ์",
    descriptionCount: (count, max) => `${count}/${max}`,
    proofInputRequired: "แนบไฟล์หลักฐานอย่างน้อย 1 ไฟล์",
    sendLockNotice: "เมื่อส่งแล้วจะแก้ไขหลักฐานไม่ได้",
    submitProof: "ส่งหลักฐาน",
    confirmSubmitTitle: "ยืนยันการส่งหลักฐาน",
    confirmSubmitMessage:
      "หลังส่งแล้วจะแก้ไขไม่ได้ ผู้ว่าจ้างมีเวลาตรวจ 24 ชั่วโมง",
    cancel: "ยกเลิก",
    confirm: "ยืนยัน",
    submitFailed: "ส่งไม่สำเร็จ ข้อมูลยังอยู่ ลองส่งใหม่อีกครั้ง",
    uploadFailed: (count) =>
      `อัปโหลดไม่สำเร็จ ${count} ไฟล์ ลบหรือเปลี่ยนไฟล์แล้วลองใหม่`,
    fileRejected:
      "ระบบไม่รับไฟล์นี้ รูปอาจมีความละเอียดสูงเกินไป ลองย่อรูปหรือเลือกรูปอื่น",
    submittedTitle: "ส่งหลักฐานแล้ว",
    submittedAt: (value) => `ส่งเมื่อ ${value}`,
    proofPendingDescription:
      "ผู้ว่าจ้างมีเวลาตรวจ 24 ชั่วโมง หากไม่ตรวจภายในเวลา ระบบจะอนุมัติให้อัตโนมัติ",
    proofApprovedDescription: "ผู้ว่าจ้างอนุมัติหลักฐานแล้ว",
    proofNotApprovedDescription: "ผู้ว่าจ้างไม่อนุมัติหลักฐานนี้",
  },
  en: {
    title: "My work",
    subtitle: "Track accepted work, submit, and review history",
    tabs: { active: "Active", history: "History" },
    tabCount: (label, count) => `${label}, ${count} items`,
    needsActionHeading: "Needs your action",
    otherWorkHeading: "Other accepted work",
    loading: "Loading your work",
    loadError: "Could not load your work",
    retry: "Retry",
    emptyActiveTitle: "No active work yet",
    emptyActiveDescription: "Pick a Quest from Home to start working",
    findQuests: "Find Quests",
    emptyHistoryTitle: "No work history yet",
    emptyHistoryDescription: "Finished work will appear here",
    status: {
      awaitingStart: "Awaiting start",
      consentUnderfilled: "Underfilled start",
      inProgress: "In progress",
      submitProof: "Proof due",
      confirmCompletion: "Confirm completion",
      respondToEdit: "Edit request",
      proofPending: "Awaiting review",
      completed: "Completed",
      incomplete: "Not approved",
      cancelled: "Cancelled",
      failed: "Failed",
    },
    dueLabel: "Due",
    startsLabel: "Starts",
    noDueAt: "No due time",
    openWork: (title) => `Open work for ${title}`,

    filesHeading: "Proof files",
    filesCount: (count, max) => `${count}/${max} files`,
    filesHint: "Images or videos, up to 10 MB each",
    addFiles: "Add files",
    removeFile: (name) => `Remove ${name}`,
    videoFile: "Video",
    fileTooLarge: (names) => `Larger than 10 MB: ${names}`,
    fileLimitReached: "You can attach up to 5 files",
    pickerError: "Could not open the photo library",
    descriptionLabel: "Work description (optional)",
    descriptionPlaceholder: "Describe what you did, such as steps or results",
    descriptionCount: (count, max) => `${count}/${max}`,
    proofInputRequired: "Attach at least one proof file",
    sendLockNotice: "Proof can't be changed after you send it",
    submitProof: "Submit proof",
    confirmSubmitTitle: "Send proof?",
    confirmSubmitMessage:
      "You can't change it after sending. The Hirer has 24 hours to review.",
    cancel: "Cancel",
    confirm: "Confirm",
    submitFailed: "Sending failed. Your draft is kept — try again.",
    uploadFailed: (count) =>
      `${count} file(s) failed to upload. Remove or replace them and try again.`,
    fileRejected:
      "This file was not accepted. The image may be too high-resolution — resize it or choose another.",
    submittedTitle: "Proof sent",
    submittedAt: (value) => `Sent ${value}`,
    proofPendingDescription:
      "The Hirer has 24 hours to review. If they don't, it is approved automatically.",
    proofApprovedDescription: "The Hirer approved this proof.",
    proofNotApprovedDescription: "The Hirer did not approve this proof.",
  },
};
