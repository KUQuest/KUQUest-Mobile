import type { SupportedLocale } from "./locale";

export interface TeamSplitMessages {
  title: string;
  approvedAmount: (amount: string) => string;
  leaderInstruction: string;
  waitingForLeader: string;
  deadlineIn: (hours: number, minutes: number) => string;
  deadlineAt: (date: string) => string;
  deadlinePassed: string;
  autoEqual: string;
  confirmedByLeader: string;
  paymentPending: string;
  paidAt: (date: string) => string;
  notPaidYet: string;
  leaderBadge: string;
  you: string;
  percentLabel: (name: string) => string;
  percentSuffix: string;
  splitEqually: string;
  total: (percent: string) => string;
  totalMustBe100: string;
  invalidPercent: string;
  submit: string;
  submitting: string;
  confirmTitle: string;
  confirmBody: string;
  confirm: string;
  cancel: string;
  successTitle: string;
  errorTitle: string;
  errors: {
    invalid: string;
    notAuthorized: string;
    expired: string;
    notReady: string;
    unavailable: string;
    fallback: string;
  };
  teamCase: (caseId: string) => string;
  teamCaseLeaderOnly: string;
}

export const teamSplitMessages: Record<SupportedLocale, TeamSplitMessages> = {
  en: {
    title: "Team payout split",
    approvedAmount: (amount) => `Admin approved ${amount} for the team.`,
    leaderInstruction:
      "Split the amount by percent between every Team member, you included. The split cannot change after you confirm.",
    waitingForLeader: "Waiting for the Team Leader to split.",
    deadlineIn: (hours, minutes) =>
      `${hours > 0 ? `${hours}h ` : ""}${minutes}m left to split.`,
    deadlineAt: (date) => `Split by ${date}.`,
    deadlinePassed:
      "The split deadline passed. The amount will be split equally.",
    autoEqual:
      "The Team Leader did not split in 24 hours, so the amount was split equally.",
    confirmedByLeader: "The Team Leader confirmed the split.",
    paymentPending: "Payment is being processed.",
    paidAt: (date) => `Paid ${date}`,
    notPaidYet: "Not paid yet",
    leaderBadge: "Leader",
    you: "You",
    percentLabel: (name) => `Share for ${name}, percent`,
    percentSuffix: "%",
    splitEqually: "Split equally",
    total: (percent) => `Total ${percent}%`,
    totalMustBe100: "The total must be exactly 100%.",
    invalidPercent: "Enter 0 to 100 with up to two decimals.",
    submit: "Confirm split",
    submitting: "Confirming…",
    confirmTitle: "Confirm this split?",
    confirmBody:
      "Each member is paid by these shares. You cannot change the split after you confirm.",
    confirm: "Confirm",
    cancel: "Cancel",
    successTitle: "Split confirmed",
    errorTitle: "Couldn't confirm the split",
    errors: {
      invalid: "Every member needs a share and the total must be exactly 100%.",
      notAuthorized: "Only the Team Leader can split the amount.",
      expired: "The 24-hour deadline passed. The amount will be split equally.",
      notReady: "The split is not open or is already confirmed. Reloaded.",
      unavailable: "The service is busy. Try again.",
      fallback: "Please try again.",
    },
    teamCase: (caseId) => `Team Dispute Case ${caseId}`,
    teamCaseLeaderOnly: "Only the Team Leader can file a Dispute Case.",
  },
  th: {
    title: "แบ่งเงินในทีม",
    approvedAmount: (amount) => `แอดมินอนุมัติเงิน ${amount} ให้ทีม`,
    leaderInstruction:
      "แบ่งเงินเป็นเปอร์เซ็นต์ให้สมาชิกทุกคนในทีม รวมถึงตัวคุณ เมื่อยืนยันแล้วจะแก้ไขไม่ได้",
    waitingForLeader: "รอหัวหน้าทีมแบ่งเงิน",
    deadlineIn: (hours, minutes) =>
      `เหลือเวลาแบ่งเงิน ${hours > 0 ? `${hours} ชม. ` : ""}${minutes} นาที`,
    deadlineAt: (date) => `แบ่งเงินภายใน ${date}`,
    deadlinePassed: "เลยกำหนดแบ่งเงินแล้ว ระบบจะแบ่งเท่า ๆ กัน",
    autoEqual: "หัวหน้าทีมไม่ได้แบ่งเงินภายใน 24 ชั่วโมง ระบบจึงแบ่งเท่า ๆ กัน",
    confirmedByLeader: "หัวหน้าทีมยืนยันการแบ่งเงินแล้ว",
    paymentPending: "กำลังดำเนินการจ่ายเงิน",
    paidAt: (date) => `จ่ายแล้ว ${date}`,
    notPaidYet: "ยังไม่ได้จ่าย",
    leaderBadge: "หัวหน้าทีม",
    you: "คุณ",
    percentLabel: (name) => `ส่วนแบ่งของ ${name} เป็นเปอร์เซ็นต์`,
    percentSuffix: "%",
    splitEqually: "แบ่งเท่า ๆ กัน",
    total: (percent) => `รวม ${percent}%`,
    totalMustBe100: "ผลรวมต้องเท่ากับ 100% พอดี",
    invalidPercent: "กรอก 0 ถึง 100 ทศนิยมไม่เกินสองตำแหน่ง",
    submit: "ยืนยันการแบ่งเงิน",
    submitting: "กำลังยืนยัน…",
    confirmTitle: "ยืนยันการแบ่งเงินนี้ใช่ไหม",
    confirmBody:
      "สมาชิกแต่ละคนจะได้รับเงินตามส่วนแบ่งนี้ เมื่อยืนยันแล้วจะแก้ไขไม่ได้",
    confirm: "ยืนยัน",
    cancel: "ยกเลิก",
    successTitle: "ยืนยันการแบ่งเงินแล้ว",
    errorTitle: "ยืนยันการแบ่งเงินไม่สำเร็จ",
    errors: {
      invalid: "สมาชิกทุกคนต้องมีส่วนแบ่ง และผลรวมต้องเท่ากับ 100% พอดี",
      notAuthorized: "เฉพาะหัวหน้าทีมเท่านั้นที่แบ่งเงินได้",
      expired: "เลยกำหนด 24 ชั่วโมงแล้ว ระบบจะแบ่งเท่า ๆ กัน",
      notReady: "ยังแบ่งเงินไม่ได้หรือยืนยันไปแล้ว โหลดข้อมูลใหม่แล้ว",
      unavailable: "ระบบไม่ว่าง โปรดลองอีกครั้ง",
      fallback: "โปรดลองอีกครั้ง",
    },
    teamCase: (caseId) => `คำร้องข้อพิพาทของทีม ${caseId}`,
    teamCaseLeaderOnly: "เฉพาะหัวหน้าทีมเท่านั้นที่ยื่นคำร้องข้อพิพาทได้",
  },
};
