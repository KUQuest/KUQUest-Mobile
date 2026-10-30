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
  completionPending: string;
  completionPendingDescription: string;
  completionNotApproved: string;
  completionNotApprovedDescription: string;
  confirmationPlaceholder: string;
  archiveDescription: string;
  fileDispute: string;
  refresh: string;
  noDueAt: string;
  dueNow: string;
  remaining: string;
  saveProofDraft: string;
  retryFailedProofFile: string;
  proofFileTooLarge: string;
  proofFileFallback: string;
  unreadMessages: (count: number) => string;
  conditionCount: (count: number) => string;
  workChatHint: string;
  givenPrice: string;
  settlementTitle: string;
  settlementAmount: string;
  settlementPaid: string;
  settlementPending: string;
  settlementLeaderSplitPending: (deadline: string) => string;
  settlementMemberSplitPending: (deadline: string) => string;
  settlementNone: string;
  settlementUnavailable: string;
  settlementTeamShare: string;
  reward: string;
  location: string;
  modeCandidate: string;
  modeFcfs: string;
  participationTeam: string;
  participationSolo: string;
  proofRequiredBadge: string;
  proofFreeBadge: string;
  startWorkProgress: (started: number, total: number) => string;
  groupStartWorkWarning: string;
  teamLeaderRole: string;
  teamMemberRole: string;
  teamLeaderBadge: string;
  teamYouBadge: string;
  teamRoster: (count: number) => string;
  leaderDutyStart: string;
  leaderDutySubmitProof: string;
  leaderDutyConfirm: string;
  memberDutyStart: string;
  memberDutyWork: string;
  teamDutyReview: string;
  teamDutyDone: string;
  allocationTitle: string;
  allocationDescription: string;
  allocationPool: string;
  allocationSummary: string;
  allocationTeamShares: string;
  allocationModePercent: string;
  allocationModeBaht: string;
  allocationBahtRoundingHint: string;
  allocationAmountLabel: string;
  allocationEqual: string;
  allocationTotal: string;
  allocationAvailable: (percent: string) => string;
  allocationAvailableAmount: (amount: string) => string;
  allocationOverBudget: (percent: string) => string;
  allocationAmountOverBudget: (amount: string) => string;
  allocationInvalidInput: string;
  allocationFixPercentBeforeBaht: string;
  allocationInvalidAmountInput: string;
  allocationFieldOverBudget: (maximum: string) => string;
  allocationFieldOverBudgetAmount: (maximum: string) => string;
  allocationLeaderShareUnavailable: string;
  allocationPercent: string;
  allocationEstimate: string;
  allocationLeaderShare: string;
  allocationDeadline: string;
  allocationSubmit: string;
  allocationCancel: string;
  allocationSubmitting: string;
  allocationSaved: string;
  allocationInvalid: string;
  allocationPreviewTitle: string;
  allocationPreviewBack: string;
  allocationPreviewNoticeTitle: string;
  allocationPreviewNoticeDescription: string;
  allocationPreviewQuestTitle: string;
  allocationPreviewTeamRoster: string;
  allocationPreviewLeaderName: string;
  allocationPreviewTeammateName: (index: number) => string;
  allocationPreviewSubmit: string;
  allocationPreviewSubmitting: string;
  allocationPreviewAlertTitle: string;
  allocationPreviewAlertDescription: string;
  viewQuestDetails: string;
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
    completionPending: "Awaiting Hirer approval",
    completionPendingDescription:
      "You sent a completion confirmation. The Quest stays in progress until the Hirer approves it, or the Server auto-approves it after 24 hours.",
    completionNotApproved: "Completion not approved",
    completionNotApprovedDescription:
      "The Hirer did not approve this completion confirmation.",
    confirmationPlaceholder:
      "Completion confirmation will open when this action is enabled.",
    archiveDescription:
      "This Quest is terminal. Work Chat remains available as a read-only archive.",
    refresh: "Refresh Work Hub",
    fileDispute: "File Dispute",
    noDueAt: "No due date set",
    dueNow: "Due now",
    remaining: "remaining",
    saveProofDraft: "Save draft",
    retryFailedProofFile: "Choose the failed file again before retrying.",
    proofFileTooLarge: "Each proof file must be 10 MB or smaller.",
    proofFileFallback: "Proof file",
    unreadMessages: (count) => `${count} unread messages`,
    conditionCount: (count) => `${count} items`,
    workChatHint: "Coordinate with Hirer on this quest",
    givenPrice: "Hirer’s price per Worker slot",
    settlementTitle: "Your settlement",
    settlementAmount: "Amount credited to Earnings",
    settlementPaid: "Paid to your Earnings Balance",
    settlementPending: "Payment pending. Refresh to check the transfer.",
    settlementLeaderSplitPending: (deadline) =>
      `Split the team reward by ${deadline}. If you do not, the Server splits it equally.`,
    settlementMemberSplitPending: (deadline) =>
      `Waiting for the Team Leader to split the reward by ${deadline}. If they do not, the Server splits it equally.`,
    settlementNone: "No payment for this Assignment.",
    settlementUnavailable: "Settlement details are not available yet.",
    settlementTeamShare: "Your team reward share",
    reward: "Reward",
    location: "Location",
    modeCandidate: "Candidate",
    modeFcfs: "FCFS",
    participationTeam: "Team",
    participationSolo: "Solo",
    proofRequiredBadge: "Proof required",
    proofFreeBadge: "Proof-free",
    startWorkProgress: (started, total) =>
      `${started} of ${total} Workers started`,
    groupStartWorkWarning:
      "Every Worker must press Start Work before the due time or the Quest fails for everyone.",
    teamLeaderRole: "Team Leader",
    teamMemberRole: "Team Member",
    teamLeaderBadge: "Leader",
    teamYouBadge: "You",
    teamRoster: (count) => `Team · ${count} members`,
    leaderDutyStart:
      "Press Start Work for the whole team between the start time and the due time.",
    leaderDutySubmitProof:
      "Submit the team's proof of work before the due time. Only you can submit it.",
    leaderDutyConfirm:
      "Confirm completion for the whole team before the due time. Only you can confirm it.",
    memberDutyStart:
      "Your Team Leader presses Start Work for the whole team. You do not need to do anything.",
    memberDutyWork:
      "Your Team Leader submits the team's work. You do not need to submit anything.",
    teamDutyReview:
      "The team's work was submitted. Waiting for the Hirer to review it.",
    teamDutyDone: "The Quest is complete.",
    allocationTitle: "Split the team reward",
    allocationDescription:
      "Adjust teammate shares. Your share updates automatically.",
    allocationPool: "Total team reward",
    allocationSummary: "Split summary",
    allocationTeamShares: "Teammate shares",
    allocationModePercent: "Percent",
    allocationModeBaht: "Baht",
    allocationBahtRoundingHint:
      "Baht entries convert in 0.01% steps. Teammate shares round down, and any leftover percentage stays with you. The estimate below shows the resulting payout after satang rounding.",
    allocationAmountLabel: "Amount (฿)",
    allocationEqual: "Split equally",
    allocationTotal: "Total: 100% · entire reward allocated",
    allocationAvailable: (percent) =>
      `Available for this teammate: up to ${percent}%`,
    allocationAvailableAmount: (amount) =>
      `Available for this teammate: up to ${amount}`,
    allocationOverBudget: (percent) =>
      `Over budget by ${percent}% · reduce a teammate’s share`,
    allocationAmountOverBudget: (amount) =>
      `Over the reward pool by ${amount} · reduce a teammate’s amount`,
    allocationInvalidInput:
      "Enter a number from 0 to 100, with up to 2 decimal places.",
    allocationFixPercentBeforeBaht:
      "Fix invalid percentage entries before switching to baht.",
    allocationInvalidAmountInput:
      "Enter a baht amount from 0 to the reward pool, with up to 2 decimal places.",
    allocationFieldOverBudget: (maximum) =>
      `With other shares unchanged, max ${maximum}%.`,
    allocationFieldOverBudgetAmount: (maximum) =>
      `With other amounts unchanged, max ${maximum}.`,
    allocationLeaderShareUnavailable:
      "Reduce teammate shares to 100% or less to see your remainder.",
    allocationPercent: "Share (%)",
    allocationEstimate: "Estimated reward",
    allocationLeaderShare: "Your remaining share",
    allocationDeadline: "Submit by",
    allocationSubmit: "Submit split and pay the team",
    allocationCancel: "Cancel",
    allocationSubmitting: "Submitting…",
    allocationSaved:
      "The reward has been split and credited to each member’s Earnings Balance.",
    allocationInvalid: "Enter valid percentages totalling no more than 100%.",
    allocationPreviewTitle: "Team reward preview",
    allocationPreviewBack: "Back",
    allocationPreviewNoticeTitle: "Simulated preview",
    allocationPreviewNoticeDescription:
      "Sample data · 1 Team Leader and 4 teammates · Nothing is saved or paid",
    allocationPreviewQuestTitle: "Sample Group Candidate Quest",
    allocationPreviewTeamRoster: "1 Team Leader · 4 teammates",
    allocationPreviewLeaderName: "You · Team Leader",
    allocationPreviewTeammateName: (index) => "Teammate " + index,
    allocationPreviewSubmit: "Preview confirmation",
    allocationPreviewSubmitting: "Previewing…",
    allocationPreviewAlertTitle: "Preview only",
    allocationPreviewAlertDescription:
      "No data was saved and no real payment was made.",
    viewQuestDetails: "View Quest details",
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
    completionPending: "รอผู้ว่าจ้างอนุมัติการเสร็จงาน",
    completionPendingDescription:
      "ส่งยืนยันงานเสร็จแล้ว รอผู้ว่าจ้างอนุมัติก่อนที่เควสต์จะเสร็จ ระบบจะอนุมัติให้อัตโนมัติหลัง 24 ชั่วโมง",
    completionNotApproved: "ไม่อนุมัติการยืนยันงานเสร็จ",
    completionNotApprovedDescription:
      "ผู้ว่าจ้างยังไม่อนุมัติการยืนยันงานเสร็จ",
    confirmationPlaceholder:
      "หน้ายืนยันการเสร็จสิ้นจะแสดงเมื่อเปิดใช้การดำเนินการนี้",
    archiveDescription:
      "เควสต์นี้สิ้นสุดแล้ว แชตงานยังเปิดอ่านได้แบบอ่านอย่างเดียว",
    refresh: "รีเฟรชศูนย์งาน",
    noDueAt: "ไม่ได้กำหนดวันส่ง",
    fileDispute: "ยื่นคำร้องข้อพิพาท",
    dueNow: "ถึงกำหนดแล้ว",
    remaining: "เหลือเวลา",
    saveProofDraft: "บันทึกฉบับร่าง",
    retryFailedProofFile:
      "กรุณาเลือกไฟล์ที่อัปโหลดไม่สำเร็จอีกครั้งก่อนลองใหม่",
    proofFileTooLarge: "ไฟล์หลักฐานแต่ละไฟล์ต้องมีขนาดไม่เกิน 10 MB",
    proofFileFallback: "ไฟล์หลักฐาน",
    unreadMessages: (count) => `${count} ข้อความใหม่`,
    conditionCount: (count) => `${count} ข้อ`,
    workChatHint: "สื่อสารและประสานงานเควสต์นี้กับผู้ว่าจ้าง",
    givenPrice: "ราคาที่ผู้ว่าจ้างเสนอต่อผู้ปฏิบัติงาน",
    settlementTitle: "การได้รับเงินของคุณ",
    settlementAmount: "จำนวนเงินที่เข้ายอดรายได้",
    settlementPaid: "โอนเข้ายอดรายได้แล้ว",
    settlementPending: "รอการโอนเงิน รีเฟรชเพื่อตรวจสอบสถานะ",
    settlementLeaderSplitPending: (deadline) =>
      `แบ่งค่าตอบแทนทีมภายใน ${deadline} ถ้าไม่แบ่ง ระบบจะหารเท่ากัน`,
    settlementMemberSplitPending: (deadline) =>
      `รอหัวหน้าทีมแบ่งค่าตอบแทนภายใน ${deadline} ถ้าไม่แบ่ง ระบบจะหารเท่ากัน`,
    settlementNone: "ไม่มีการชำระเงินสำหรับงานนี้",
    settlementUnavailable: "ยังไม่มีข้อมูลการชำระเงิน",
    settlementTeamShare: "ส่วนแบ่งค่าตอบแทนของคุณ",
    reward: "ค่าตอบแทน",
    location: "สถานที่",
    modeCandidate: "คัดเลือกผู้สมัคร",
    modeFcfs: "รับทันที (FCFS)",
    participationTeam: "งานกลุ่ม",
    participationSolo: "งานเดี่ยว",
    proofRequiredBadge: "ต้องส่งหลักฐาน",
    proofFreeBadge: "ไม่ต้องส่งหลักฐาน",
    startWorkProgress: (started, total) =>
      `เริ่มงานแล้ว ${started} จาก ${total} คน`,
    groupStartWorkWarning:
      "ผู้ทำงานทุกคนต้องกดเริ่มงานก่อนกำหนดส่ง มิฉะนั้นเควสต์จะล้มเหลวสำหรับทุกคน",
    teamLeaderRole: "หัวหน้าทีม",
    teamMemberRole: "สมาชิกทีม",
    teamLeaderBadge: "หัวหน้า",
    teamYouBadge: "คุณ",
    teamRoster: (count) => `ทีม · ${count} คน`,
    leaderDutyStart: "กดเริ่มงานแทนทั้งทีมได้ตั้งแต่เวลาเริ่มงานจนถึงกำหนดส่ง",
    leaderDutySubmitProof:
      "ส่งหลักฐานของทั้งทีมก่อนกำหนดส่ง เฉพาะหัวหน้าทีมเท่านั้นที่ส่งได้",
    leaderDutyConfirm:
      "ยืนยันการเสร็จสิ้นแทนทั้งทีมก่อนกำหนดส่ง เฉพาะหัวหน้าทีมเท่านั้นที่ยืนยันได้",
    memberDutyStart: "หัวหน้าทีมจะกดเริ่มงานแทนทั้งทีม คุณไม่ต้องทำอะไร",
    memberDutyWork: "หัวหน้าทีมจะส่งงานแทนทั้งทีม คุณไม่ต้องส่งอะไร",
    teamDutyReview: "ส่งงานของทีมแล้ว กำลังรอผู้ว่าจ้างตรวจสอบ",
    teamDutyDone: "เควสต์เสร็จสิ้นแล้ว",
    allocationTitle: "แบ่งค่าตอบแทนทีม",
    allocationDescription:
      "ปรับส่วนแบ่งของสมาชิก ส่วนแบ่งของคุณจะคำนวณให้อัตโนมัติ",
    allocationPool: "ค่าตอบแทนทีมทั้งหมด",
    allocationSummary: "สรุปส่วนแบ่ง",
    allocationTeamShares: "ส่วนแบ่งลูกทีม",
    allocationModePercent: "เปอร์เซ็นต์",
    allocationModeBaht: "บาท",
    allocationBahtRoundingHint:
      "ยอดเงินบาทจะแปลงเป็นส่วนแบ่งขั้นละ 0.01% โดยปัดส่วนแบ่งลูกทีมลง เศษเปอร์เซ็นต์ที่แบ่งไม่ลงตัวจะคงเป็นส่วนแบ่งของคุณ ค่าตอบแทนโดยประมาณด้านล่างแสดงยอดหลังปัดเศษสตางค์",
    allocationAmountLabel: "จำนวนเงิน (บาท)",
    allocationEqual: "แบ่งเท่ากัน",
    allocationTotal: "รวม 100% · แบ่งค่าตอบแทนครบแล้ว",
    allocationAvailable: (percent) => `แบ่งให้สมาชิกคนนี้ได้สูงสุด ${percent}%`,
    allocationAvailableAmount: (amount) =>
      `แบ่งให้สมาชิกคนนี้ได้สูงสุด ${amount}`,
    allocationOverBudget: (percent) => `เกิน ${percent}% · ลดส่วนแบ่งของสมาชิก`,
    allocationAmountOverBudget: (amount) =>
      `ยอดเกินค่าตอบแทนรวม ${amount} · ลดจำนวนเงินของสมาชิก`,
    allocationInvalidInput:
      "กรอกตัวเลขตั้งแต่ 0 ถึง 100 และทศนิยมไม่เกิน 2 ตำแหน่ง",
    allocationFixPercentBeforeBaht:
      "แก้ไขเปอร์เซ็นต์ที่ไม่ถูกต้องก่อนเปลี่ยนเป็นโหมดจำนวนเงินบาท",
    allocationInvalidAmountInput:
      "กรอกจำนวนเงินบาทตั้งแต่ 0 ถึงค่าตอบแทนรวม และทศนิยมไม่เกิน 2 ตำแหน่ง",
    allocationFieldOverBudget: (maximum) =>
      `คงส่วนแบ่งคนอื่นไว้ ไม่เกิน ${maximum}%`,
    allocationFieldOverBudgetAmount: (maximum) =>
      `คงยอดคนอื่นไว้ แบ่งได้ไม่เกิน ${maximum}`,
    allocationLeaderShareUnavailable:
      "ลดส่วนแบ่งลูกทีมให้รวมไม่เกิน 100% เพื่อดูส่วนแบ่งคงเหลือของคุณ",
    allocationPercent: "ส่วนแบ่ง (%)",
    allocationEstimate: "ค่าตอบแทนโดยประมาณ",
    allocationLeaderShare: "ส่วนแบ่งที่เหลือของคุณ",
    allocationDeadline: "ส่งภายใน",
    allocationSubmit: "ยืนยันการแบ่งและจ่ายเงินให้ทีม",
    allocationCancel: "ยกเลิก",
    allocationSubmitting: "กำลังส่ง…",
    allocationSaved: "แบ่งค่าตอบแทนและโอนเข้ายอดรายได้ของสมาชิกแต่ละคนแล้ว",
    allocationInvalid: "กรุณาระบุเปอร์เซ็นต์ที่ถูกต้อง รวมกันไม่เกิน 100%",
    allocationPreviewTitle: "ตัวอย่างแบ่งเงินทีม",
    allocationPreviewBack: "ย้อนกลับ",
    allocationPreviewNoticeTitle: "หน้าจอตัวอย่างจำลอง",
    allocationPreviewNoticeDescription:
      "ข้อมูลสมมติ · หัวหน้าทีม 1 คน และลูกทีม 4 คน · ไม่มีการบันทึกหรือโอนเงินจริง",
    allocationPreviewQuestTitle: "งานกลุ่มตัวอย่าง · คัดเลือกผู้สมัคร",
    allocationPreviewTeamRoster: "หัวหน้าทีม 1 คน · สมาชิก 4 คน",
    allocationPreviewLeaderName: "คุณ · หัวหน้าทีม",
    allocationPreviewTeammateName: (index) => "สมาชิกทีม " + index,
    allocationPreviewSubmit: "ดูตัวอย่างการยืนยัน",
    allocationPreviewSubmitting: "กำลังจำลอง…",
    allocationPreviewAlertTitle: "ตัวอย่างจำลอง",
    allocationPreviewAlertDescription: "ไม่มีการบันทึกข้อมูลหรือโอนเงินจริง",
    viewQuestDetails: "ดูรายละเอียดเควสต์",
  },
};
