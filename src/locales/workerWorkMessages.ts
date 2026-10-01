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
  | "failed"
  | "pendingSelection"
  | "teamForming"
  | "selected"
  | "notSelected"
  | "rejected"
  | "withdrawn";

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
  openQuest: (title: string) => string;

  filesHeading: string;
  filesCount: (count: number, max: number) => string;
  filesHint: string;
  addFiles: string;
  addDocuments: string;
  removeFile: (name: string) => string;
  filePosition: (position: number) => string;
  fileTypeUnknown: string;
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
  retryFailedProofFile: string;
  submittedTitle: string;
  submittedAt: (value: string) => string;
  proofPendingDescription: string;
  proofApprovedDescription: string;
  proofNotApprovedDescription: string;
  discardProofTitle: string;
  discardProofMessage: string;
  discardProof: string;
  keepProof: string;
  rateHirer: string;
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
      consentUnderfilled: "ตอบรับหรือปฏิเสธการเริ่มงานเมื่อคนไม่ครบ",
      inProgress: "กำลังทำงาน",
      submitProof: "รอส่งหลักฐาน",
      confirmCompletion: "รอยืนยันงานเสร็จ",
      respondToEdit: "มีคำขอแก้ไขเงื่อนไข",
      proofPending: "รอผู้ว่าจ้างตรวจ",
      completed: "สำเร็จ",
      incomplete: "ไม่ผ่าน",
      cancelled: "ยกเลิก",
      failed: "ล้มเหลว",
      pendingSelection: "รอพิจารณา",
      teamForming: "กำลังรวบรวมทีม",
      selected: "ได้รับเลือก",
      notSelected: "ไม่ได้รับเลือก",
      rejected: "ถูกปฏิเสธ",
      withdrawn: "ถอนใบสมัคร",
    },
    dueLabel: "กำหนดส่ง",
    startsLabel: "เริ่มงาน",
    noDueAt: "ไม่มีกำหนดส่ง",
    openWork: (title) => `เปิดงาน ${title}`,
    openQuest: (title) => `เปิดเควสต์ ${title}`,

    filesHeading: "ไฟล์หลักฐาน",
    filesCount: (count, max) => `${count}/${max} ไฟล์`,
    filesHint: "รูปภาพ PDF หรือวิดีโอ ไม่เกิน 10 MB ต่อไฟล์",
    addFiles: "เพิ่มรูปหรือวิดีโอ",
    addDocuments: "เพิ่ม PDF",
    removeFile: (name) => `ลบไฟล์ ${name}`,
    filePosition: (position) => `ไฟล์หลักฐานที่ ${position}`,
    fileTypeUnknown: "ไฟล์หลักฐาน",
    videoFile: "วิดีโอ",
    fileTooLarge: (names) => `ไฟล์ใหญ่เกิน 10 MB: ${names}`,
    fileLimitReached: "แนบได้สูงสุด 5 ไฟล์",
    pickerError: "เปิดตัวเลือกไฟล์ไม่สำเร็จ",
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
    retryFailedProofFile: "เลือกไฟล์ที่ล้มเหลวใหม่แล้วลองอีกครั้ง",
    submittedTitle: "ส่งหลักฐานแล้ว",
    submittedAt: (value) => `ส่งเมื่อ ${value}`,
    proofPendingDescription:
      "ผู้ว่าจ้างมีเวลาตรวจ 24 ชั่วโมง หากไม่ตรวจภายในเวลา ระบบจะอนุมัติให้อัตโนมัติ",
    proofApprovedDescription: "ผู้ว่าจ้างอนุมัติหลักฐานแล้ว",
    proofNotApprovedDescription: "ผู้ว่าจ้างไม่อนุมัติหลักฐานนี้",
    discardProofTitle: "ละทิ้งฉบับร่างหลักฐาน?",
    discardProofMessage:
      "ไฟล์และคำอธิบายที่เพิ่มไว้ยังไม่ได้บันทึก ออกและละทิ้งหรือไม่?",
    discardProof: "ละทิ้ง",
    keepProof: "แก้ไขต่อ",
    rateHirer: "ให้คะแนนผู้ว่าจ้าง",
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
      consentUnderfilled: "Respond to underfilled start",
      inProgress: "In progress",
      submitProof: "Proof due",
      confirmCompletion: "Confirm completion",
      respondToEdit: "Edit request",
      proofPending: "Awaiting review",
      completed: "Completed",
      incomplete: "Not approved",
      cancelled: "Cancelled",
      failed: "Failed",
      pendingSelection: "Pending selection",
      teamForming: "Team forming",
      selected: "Selected",
      notSelected: "Not selected",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    },
    dueLabel: "Due",
    startsLabel: "Starts",
    noDueAt: "No due time",
    openWork: (title) => `Open work for ${title}`,
    openQuest: (title) => `Open Quest ${title}`,

    filesHeading: "Proof files",
    filesCount: (count, max) => `${count}/${max} files`,
    filesHint: "Images, PDF, or videos, up to 10 MB each",
    addFiles: "Add images or videos",
    addDocuments: "Add PDF",
    removeFile: (name) => `Remove ${name}`,
    filePosition: (position) => `Proof file ${position}`,
    fileTypeUnknown: "Proof file",
    videoFile: "Video",
    fileTooLarge: (names) => `Larger than 10 MB: ${names}`,
    fileLimitReached: "You can attach up to 5 files",
    pickerError: "Could not open the file picker",
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
    retryFailedProofFile: "Choose the failed file again and retry.",
    submittedTitle: "Proof sent",
    submittedAt: (value) => `Sent ${value}`,
    proofPendingDescription:
      "The Hirer has 24 hours to review. If they don't, it is approved automatically.",
    proofApprovedDescription: "The Hirer approved this proof.",
    proofNotApprovedDescription: "The Hirer did not approve this proof.",
    discardProofTitle: "Discard proof draft?",
    discardProofMessage:
      "Files and description added here are not saved yet. Leave and discard them?",
    discardProof: "Discard",
    keepProof: "Keep editing",
    rateHirer: "Rate the Hirer",
  },
};
