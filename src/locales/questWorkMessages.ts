import type { SupportedLocale } from "./locale";

export interface QuestWorkMessages {
  title: string;
  assigned: string;
  inProgress: string;
  terminal: string;
  assignment: string;
  conditions: string;
  dueAt: string;
  nextAction: string;
  workChat: string;
  noChat: string;
  waitingForStart: string;
  startsAutomatically: string;
  stale: string;
  retry: string;
  serverError: string;
  missingRoute: string;
  editTitle: string;
  editDescription: string;
  acceptEdit: string;
  declineEdit: string;
  editUpdated: string;
  actionUnavailable: string;
  proofCta: string;
  proofPlaceholder: string;
  confirmationCta: string;
  confirmationPlaceholder: string;
  archiveDescription: string;
  fileDispute: string;
  refresh: string;
  noDueAt: string;
  dueNow: string;
  remaining: string;
}

export const questWorkMessages: Record<SupportedLocale, QuestWorkMessages> = {
  en: {
    title: "Work Hub",
    assigned: "Assigned",
    inProgress: "In progress",
    terminal: "Archived",
    assignment: "Assignment",
    conditions: "Conditions",
    dueAt: "Due",
    nextAction: "Next action",
    workChat: "Open Work Chat",
    noChat: "Work Chat is not available yet.",
    waitingForStart: "Waiting for work to start",
    startsAutomatically:
      "The server starts this Quest automatically. This screen will refresh around the start time.",
    stale: "Showing the last saved server state. Refresh to try again.",
    retry: "Try again",
    serverError: "We could not load the Work Hub.",
    missingRoute:
      "A Quest and signed-in Member are required to open the Work Hub.",
    editTitle: "Pending Quest Edit",
    editDescription:
      "The Hirer proposed a condition change. Review it before work starts.",
    acceptEdit: "Accept edit",
    declineEdit: "Decline edit",
    editUpdated: "Your edit response was sent.",
    actionUnavailable: "This action is not available for your Assignment.",
    proofCta: "Proof submission",
    proofPlaceholder: "Proof submission will open when this action is enabled.",
    confirmationCta: "Confirm completion",
    confirmationPlaceholder:
      "Completion confirmation will open when this action is enabled.",
    archiveDescription:
      "This Quest is terminal. Work Chat remains available as a read-only archive.",
    refresh: "Refresh Work Hub",
    fileDispute: "File Dispute",
    noDueAt: "No due date set",
    dueNow: "Due now",
    remaining: "remaining",
  },
  th: {
    title: "ศูนย์งาน",
    assigned: "มอบหมายแล้ว",
    inProgress: "กำลังทำงาน",
    terminal: "เก็บถาวร",
    assignment: "การมอบหมายงาน",
    conditions: "เงื่อนไข",
    dueAt: "กำหนดส่ง",
    nextAction: "การดำเนินการถัดไป",
    workChat: "เปิดแชตงาน",
    noChat: "ยังไม่พร้อมใช้งานแชตงาน",
    waitingForStart: "กำลังรอเริ่มงาน",
    startsAutomatically:
      "เซิร์ฟเวอร์จะเริ่มเควสต์นี้โดยอัตโนมัติ หน้านี้จะรีเฟรชในช่วงเวลาเริ่มงาน",
    stale: "กำลังแสดงสถานะล่าสุดที่บันทึกจากเซิร์ฟเวอร์ ลองรีเฟรชอีกครั้ง",
    retry: "ลองอีกครั้ง",
    serverError: "ไม่สามารถโหลดศูนย์งานได้",
    missingRoute: "ต้องมีเควสต์และสมาชิกที่เข้าสู่ระบบเพื่อเปิดศูนย์งาน",
    editTitle: "มีการแก้ไขเควสต์รอการตอบกลับ",
    editDescription:
      "ผู้ว่าจ้างเสนอการเปลี่ยนแปลงเงื่อนไข โปรดตรวจสอบก่อนเริ่มงาน",
    acceptEdit: "ยอมรับการแก้ไข",
    declineEdit: "ปฏิเสธการแก้ไข",
    editUpdated: "ส่งการตอบกลับการแก้ไขแล้ว",
    actionUnavailable: "การดำเนินการนี้ไม่พร้อมใช้งานสำหรับการมอบหมายของคุณ",
    proofCta: "ส่งหลักฐาน",
    proofPlaceholder: "หน้าส่งหลักฐานจะแสดงเมื่อเปิดใช้การดำเนินการนี้",
    confirmationCta: "ยืนยันการเสร็จสิ้น",
    confirmationPlaceholder:
      "หน้ายืนยันการเสร็จสิ้นจะแสดงเมื่อเปิดใช้การดำเนินการนี้",
    archiveDescription:
      "เควสต์นี้สิ้นสุดแล้ว แชตงานยังเปิดอ่านได้แบบอ่านอย่างเดียว",
    refresh: "รีเฟรชศูนย์งาน",
    noDueAt: "ไม่ได้กำหนดวันส่ง",
    fileDispute: "ยื่นคำร้องข้อพิพาท",
    dueNow: "ถึงกำหนดแล้ว",
    remaining: "เหลือเวลา",
  },
};
