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
  startWorkCta: string;
  startWorkDescription: string;
  startWorkOpensAt: string;
  startWorkRecordedAt: string;
  waitingForOtherWorkers: string;
  waitingForQuestStart: string;
  waitingForTeamLeader: string;
  startWorkNotAvailable: string;
  startWorkDeadlinePassed: string;
  startWorkNotRequired: string;
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
    startWorkCta: "Start Work",
    startWorkDescription:
      "Press Start Work between the start time and the due time.",
    startWorkOpensAt: "Start Work opens at",
    startWorkRecordedAt: "You pressed Start Work at",
    waitingForOtherWorkers:
      "Waiting for the other Workers to press Start Work. Work opens when every Active Worker has pressed it.",
    waitingForQuestStart:
      "Waiting for the server to start this Quest. Refresh to see the latest status.",
    waitingForTeamLeader: "Waiting for the Team Leader to press Start Work.",
    startWorkNotAvailable:
      "Start Work is not open yet. Try again at the start time.",
    startWorkDeadlinePassed:
      "The due time has passed, so Start Work can no longer be recorded.",
    startWorkNotRequired:
      "You are not required to press Start Work for this Quest.",
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
    startWorkCta: "เริ่มงาน",
    startWorkDescription: "กดเริ่มงานได้ตั้งแต่เวลาเริ่มงานจนถึงกำหนดส่ง",
    startWorkOpensAt: "กดเริ่มงานได้ตั้งแต่",
    startWorkRecordedAt: "คุณกดเริ่มงานแล้วเมื่อ",
    waitingForOtherWorkers:
      "กำลังรอผู้ทำงานคนอื่นกดเริ่มงาน งานจะเปิดเมื่อผู้ทำงานทุกคนกดเริ่มงานครบ",
    waitingForQuestStart:
      "กำลังรอเซิร์ฟเวอร์เริ่มเควสต์นี้ รีเฟรชเพื่อดูสถานะล่าสุด",
    waitingForTeamLeader: "กำลังรอหัวหน้าทีมกดเริ่มงาน",
    startWorkNotAvailable:
      "ยังไม่ถึงเวลาเริ่มงาน ลองอีกครั้งเมื่อถึงเวลาเริ่มงาน",
    startWorkDeadlinePassed: "เลยกำหนดส่งแล้ว ไม่สามารถกดเริ่มงานได้",
    startWorkNotRequired: "คุณไม่ต้องกดเริ่มงานสำหรับเควสต์นี้",
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
