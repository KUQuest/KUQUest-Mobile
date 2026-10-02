import {
  QuestV2CancellationReason,
  type QuestV2UnderfilledCancellationReason,
} from "@/api/questV2Contracts";
import type { SupportedLocale } from "./locale";

export interface GroupQuestMessages {
  close: string;
  cancel: string;
  retry: string;
  loading: string;
  errorTitle: string;
  errorDescription: string;
  noTeamTitle: string;
  noTeamDescription: string;
  createTeam: string;
  teamNameLabel: string;
  openSlot: string;
  fullRosterHint: (headcount: number) => string;
  leaveTeam: string;
  removeMember: string;
  saveTeamName: string;
  saveTeamNameLabel: string;
  inviteMembersTitle: string;
  joinCodeLabel: string;
  joinCodeExpires: (date: string) => string;
  joinCodeHiddenForLeader: string;
  joinCodeHiddenForMember: string;
  shareInvite: string;
  shareInviteLabel: string;
  regenerateJoinCode: string;
  regenerateJoinCodeLabel: string;
  enterJoinCode: string;
  joinShort: string;
  proposalTitle: string;
  proposalHelper: string;
  proposalNoteLabel: string;
  proposalNotePlaceholder: string;
  proposal: string;
  fileCount: (count: number) => string;
  attachedFiles: string;
  reviewAttachments: string;
  submissionImage: (index: number) => string;
  noImageAttachments: string;
  submissionImagesUnavailable: string;
  attachFile: string;
  removeFile: (name: string) => string;
  filePickFailed: string;
  fileTooLarge: string;
  teamSubmissionUnavailable: string;
  submissionContentRequired: string;
  teamTitle: string;
  teamSubtitle: string;
  roster: string;
  leader: string;
  member: string;
  memberCount: (count: number) => string;
  rosterCount: (actual: number, requested: number) => string;
  joinTeamTitle: string;
  joinTeamDescription: string;
  joinTeamCodeLabel: string;
  joinTeamCodePlaceholder: string;
  teamInviteMessage: (teamName: string, link: string) => string;
  joinTeam: string;
  joiningTeam: string;
  joinCodeInvalid: string;
  joinTeamFull: string;
  joinTeamFailed: string;
  partialRosterHint: string;
  reviewPartialStart: string;
  reviewRoster: string;
  reviewTitle: string;
  reviewDescription: string;
  confirmSubmit: string;
  submittingTeam: string;
  submittedTitle: string;
  lockedDescription: string;
  teamSubmitted: string;
  teamSelected: string;
  teamRejected: string;
  searchMembers: string;
  searchMembersHint: string;
  openWorkHub: string;
  clearSearch: string;
  noEligibleMembers: string;
  noSearchResults: string;
  invite: string;
  inviteSelected: (count: number) => string;
  invited: string;
  pendingInvitation: string;
  invitationExpires: (date: string) => string;
  acceptInvitation: string;
  declineInvitation: string;
  invitationAccepted: string;
  invitationDeclined: string;
  candidateReviewTitle: string;
  candidateReviewSubtitle: string;
  individualProposal: string;
  teamProposal: string;
  submittedLabel: string;
  requestedHeadcount: string;
  actualHeadcount: string;
  rewardPerWorker: string;
  reservedReward: string;
  settledReward: string;
  refund: string;
  noRefund: string;
  selectProposal: string;
  selected: string;
  rejected: string;
  accept: string;
  reject: string;
  noProposals: string;
  decline: string;
  proceedConsequence: string;
  cancelConsequence: string;
  assignedOpenWorkHub: string;
  partialDetailsChanged: string;
  respondWithin: string;
  hirerDecisionPending: string;
  workerResponseRequired: string;
  acceptingWaitsForEveryone: string;
  decliningCancelsForEveryone: string;
  acceptedWaiting: (count: number) => string;
  declinedByYou: string;
  declinedByWorker: string;
  timedOutCancellation: string;
  hirerCancelled: string;
  hirerNoDecision: string;
  genericCancellation: string;
  hirerCancelledOutcome: string;
  hirerNoDecisionOutcome: string;
  hirerWorkerDeclinedOutcome: string;
  hirerTimedOutOutcome: string;
  hirerGenericCancellation: string;
  cancelledAt: (date: string, time: string) => string;
  timeUpChecking: string;
  nothingToRespond: string;
  backToQuest: string;
  browseOtherQuests: string;
  questAssignedNext: string;
  workersAcceptedProgress: (accepted: number, required: number) => string;
  workerHeadcountJoined: (actual: number, requested: number) => string;
  proposalCount: (count: number) => string;
  partialConsentTitle: string;
  partialConsentSubtitle: string;
  frozenRoster: string;
  voteStatus: string;
  hirer: string;
  worker: string;
  pendingVote: string;
  approvedVote: string;
  rejectedVote: string;
  votesProgress: (approved: number, required: number) => string;
  timeRemaining: string;
  approveStart: string;
  rejectStart: string;
  chatWritableHint: string;
  approvedTitle: string;
  approvedDescription: (actual: number) => string;
  cancelledTitle: string;
  timedOutDescription: string;
  noConsent: string;
  newRewardPerWorker: string;
  dueDate: string;
  notSet: string;
  proceed: string;
  proceedLabel: string;
  cancelQuest: string;
}

export function underfilledCancellationDescription(
  messages: GroupQuestMessages,
  reason: QuestV2UnderfilledCancellationReason | null | undefined,
  ownDeclined: boolean,
  isHirer: boolean
): string {
  if (isHirer) {
    switch (reason) {
      case "HIRER_CANCELLED":
        return messages.hirerCancelledOutcome;
      case "HIRER_NO_DECISION":
        return messages.hirerNoDecisionOutcome;
      case "WORKER_DECLINED":
        return messages.hirerWorkerDeclinedOutcome;
      case QuestV2CancellationReason.CONSENT_TIMEOUT:
        return messages.hirerTimedOutOutcome;
      default:
        return messages.hirerGenericCancellation;
    }
  }
  switch (reason) {
    case "HIRER_CANCELLED":
      return messages.hirerCancelled;
    case "HIRER_NO_DECISION":
      return messages.hirerNoDecision;
    case "WORKER_DECLINED":
      return ownDeclined ? messages.declinedByYou : messages.declinedByWorker;
    case QuestV2CancellationReason.CONSENT_TIMEOUT:
      return messages.timedOutCancellation;
    default:
      return messages.genericCancellation;
  }
}

export const groupQuestMessages: Record<SupportedLocale, GroupQuestMessages> = {
  en: {
    newRewardPerWorker: "New reward per Worker",
    dueDate: "Due date",
    notSet: "Not set",
    proceed: "Proceed",
    proceedLabel: "Proceed with joined workers",
    cancelQuest: "Cancel Quest",
    partialDetailsChanged: "The quest details changed",
    respondWithin: "Respond within",
    hirerDecisionPending: "Waiting for the hirer's decision",
    workerResponseRequired: "You need to respond",
    acceptingWaitsForEveryone:
      "Accepting does not start the quest by itself — everyone who joined must accept. If anyone declines or doesn't respond in time, the quest is cancelled. Workers owe nothing and are owed nothing; the hirer is refunded in full.",
    decliningCancelsForEveryone:
      "Declining cancels the quest for everyone. Workers owe nothing and are owed nothing; the hirer is refunded in full.",
    acceptedWaiting: (count) =>
      `You accepted — waiting for ${count} ${count === 1 ? "other worker" : "other workers"}.`,
    declinedByYou: "You declined. The quest was cancelled for everyone.",
    declinedByWorker: "A worker declined. The quest was cancelled.",
    timedOutCancellation:
      "The response window ended before everyone accepted. The quest was cancelled.",
    hirerCancelled: "The hirer cancelled the quest.",
    hirerNoDecision:
      "The hirer did not decide in time, so the quest was cancelled.",
    genericCancellation: "The quest was cancelled before all workers accepted.",
    hirerCancelledOutcome:
      "The hirer cancelled the quest. The hirer is refunded in full.",
    hirerNoDecisionOutcome:
      "The hirer did not decide in time, so the quest was cancelled. The hirer is refunded in full.",
    hirerWorkerDeclinedOutcome:
      "A worker declined. The quest was cancelled. The hirer is refunded in full.",
    hirerTimedOutOutcome:
      "The response window ended before everyone accepted. The quest was cancelled. The hirer is refunded in full.",
    hirerGenericCancellation:
      "The quest was cancelled before all workers accepted. The hirer is refunded in full.",
    cancelledAt: (date, time) => `Cancelled ${date} at ${time}`,
    timeUpChecking: "Time is up — checking the result…",
    nothingToRespond:
      "Nothing to respond to. This quest is no longer underfilled or awaiting your response.",
    backToQuest: "Back to quest",
    browseOtherQuests: "Browse other quests",
    questAssignedNext: "All set — quest assigned",
    workerHeadcountJoined: (actual, requested) =>
      `${actual} of ${requested} workers joined`,
    decline: "Decline",
    proceedConsequence:
      "Proceeding gives joined workers 10 minutes to accept the revised reward and due date. Everyone must accept or the quest is cancelled. Workers owe nothing and are owed nothing; the hirer is refunded in full.",
    cancelConsequence: "Cancelling ends the quest. You are refunded in full.",
    assignedOpenWorkHub: "Open Work Hub",
    close: "Close",
    cancel: "Cancel",
    retry: "Try again",
    loading: "Loading",
    errorTitle: "Could not load this Quest",
    errorDescription: "The latest Quest information is unavailable. Try again.",
    noTeamTitle: "No Quest Team yet",
    noTeamDescription:
      "Name your Candidate Team, then share its invite link so teammates can join with the Join Code.",
    createTeam: "Create Team",
    teamNameLabel: "Team name",
    teamTitle: "Build your Quest Team",
    teamSubtitle:
      "Form a Candidate Team with the Join Code, then submit it at the full headcount.",
    roster: "Team members",
    openSlot: "Open spot — share the invite link",
    fullRosterHint: (headcount) =>
      `Add exactly ${headcount} members before submitting.`,
    leaveTeam: "Leave team",
    removeMember: "Remove",
    saveTeamName: "Save",
    saveTeamNameLabel: "Save team name",
    inviteMembersTitle: "Invite members",
    joinCodeLabel: "Join Code",
    joinCodeExpires: (date) => `Expires ${date}`,
    joinCodeHiddenForLeader:
      "The code shows only on the device that issued it. Issue a new code to share an invite link.",
    joinCodeHiddenForMember: "Ask your Team Leader for the invite link.",
    shareInvite: "Share invite",
    shareInviteLabel: "Share invite link",
    regenerateJoinCode: "New code",
    regenerateJoinCodeLabel: "Regenerate join code",
    enterJoinCode: "Enter team join code",
    joinShort: "Join",
    proposalTitle: "Proposal & Supporting Files",
    proposalHelper: "Add a proposal note and at least one supporting file",
    proposalNoteLabel: "Proposal note",
    proposalNotePlaceholder: "Required proposal note",
    proposal: "Proposal",
    fileCount: (count) => `${count} ${count === 1 ? "file" : "files"}`,
    attachedFiles: "Attached files",
    reviewAttachments: "Review attachments",
    submissionImage: (index) => `Submitted image ${index}`,
    noImageAttachments: "No image files are attached to this proposal.",
    submissionImagesUnavailable:
      "Submitted images could not be loaded. Try again.",
    attachFile: "Attach file or image",
    removeFile: (name) => `Remove file ${name}`,
    filePickFailed: "Failed to pick file",
    fileTooLarge: "Each supporting file must be 10 MB or smaller",
    teamSubmissionUnavailable: "Team submission unavailable",
    submissionContentRequired:
      "Add a proposal note and at least one supporting file to submit.",
    leader: "Team Leader",
    member: "Member",
    memberCount: (count) => `${count} ${count === 1 ? "member" : "members"}`,
    rosterCount: (actual, requested) => `Roster ${actual}/${requested}`,
    joinTeamTitle: "Join a Candidate Team",
    joinTeamDescription:
      "Enter the Join Code your Team Leader shared with you.",
    joinTeamCodeLabel: "Join Code",
    joinTeamCodePlaceholder: "Enter Join Code",
    teamInviteMessage: (teamName, link) =>
      `Join my KUQuest team "${teamName}": ${link}`,
    joinTeam: "Join team",
    joiningTeam: "Joining…",
    joinCodeInvalid: "This Join Code is invalid or expired.",
    joinTeamFull: "This team is full or no longer accepting members.",
    joinTeamFailed: "Could not join this team. Try again.",
    partialRosterHint:
      "You can submit with one or more accepted members. The roster locks after confirmation.",
    reviewRoster: "Review roster",
    reviewTitle: "Review your roster",
    reviewDescription:
      "Confirm the accepted members before submitting this Candidate Proposal.",
    confirmSubmit: "Confirm and submit",
    submittingTeam: "Submitting…",
    submittedTitle: "Team submitted",
    lockedDescription:
      "This roster is locked. Pending invitees cannot be added after submission.",
    teamSubmitted: "Submitted",
    teamSelected: "Selected",
    teamRejected: "Rejected",
    openWorkHub: "Open Work Hub",
    searchMembers: "Search KU members",
    searchMembersHint: "Search by name or @ku.th email",
    clearSearch: "Clear member search",
    noEligibleMembers: "No eligible KU members available",
    noSearchResults: "No members match your search",
    invite: "Invite",
    inviteSelected: (count) => `Invite ${count} selected`,
    invited: "Invited",
    pendingInvitation: "Invitation pending",
    invitationExpires: (date) => `Expires ${date}`,
    acceptInvitation: "Accept invitation",
    declineInvitation: "Decline invitation",
    invitationAccepted: "Invitation accepted",
    invitationDeclined: "Invitation declined",
    candidateReviewTitle: "Review Candidate Proposals",
    candidateReviewSubtitle:
      "Select one submitted proposal to move this Quest forward.",
    individualProposal: "Individual Proposal",
    teamProposal: "Team Proposal",
    submittedLabel: "Submitted",
    requestedHeadcount: "Requested headcount",
    actualHeadcount: "Actual headcount",
    rewardPerWorker: "Reward per Worker",
    reservedReward: "Reserved reward",
    settledReward: "Settled reward",
    refund: "Refund",
    noRefund: "No refund",
    selectProposal: "Select proposal",
    selected: "Selected",
    rejected: "Rejected",
    accept: "Accept",
    reject: "Reject",
    noProposals: "No submitted Candidate Proposals yet",
    proposalCount: (count) =>
      `${count} ${count === 1 ? "proposal" : "proposals"}`,
    partialConsentTitle: "Changed quest details",
    partialConsentSubtitle:
      "Joined workers respond individually to the revised reward and due date.",
    reviewPartialStart: "Review changed details",
    frozenRoster: "Joined workers",
    voteStatus: "Worker responses",
    hirer: "Hirer",
    worker: "Worker",
    pendingVote: "Awaiting response",
    approvedVote: "Accepted",
    rejectedVote: "Declined",
    votesProgress: (approved, required) =>
      `${approved} of ${required} approved`,
    workersAcceptedProgress: (accepted, required) =>
      `${accepted} of ${required} workers accepted`,
    timeRemaining: "Time remaining",
    approveStart: "Accept",
    rejectStart: "Decline",
    chatWritableHint:
      "The existing Quest chat stays writable while this vote is pending.",
    approvedTitle: "All set — quest assigned",
    approvedDescription: (actual) =>
      `The Quest is assigned to ${actual} ${actual === 1 ? "Worker" : "Workers"}.`,
    cancelledTitle: "Quest cancelled",
    timedOutDescription:
      "The response window ended before everyone accepted. The quest was cancelled.",
    noConsent: "No response is needed for this quest.",
  },
  th: {
    newRewardPerWorker: "ค่าตอบแทนใหม่ต่อผู้ทำงาน",
    dueDate: "กำหนดส่งงาน",
    notSet: "ไม่มี",
    proceed: "ดำเนินการต่อ",
    proceedLabel: "ดำเนินการต่อกับผู้ทำงานที่เข้าร่วม",
    cancelQuest: "ยกเลิกเควสต์",
    close: "ปิด",
    cancel: "ยกเลิก",
    retry: "ลองอีกครั้ง",
    loading: "กำลังโหลด",
    errorTitle: "โหลดเควสต์นี้ไม่สำเร็จ",
    errorDescription: "ไม่สามารถโหลดข้อมูลเควสต์ล่าสุดได้ ลองอีกครั้ง",
    noTeamTitle: "ยังไม่มีทีมเควสต์",
    noTeamDescription:
      "ตั้งชื่อ Candidate Team แล้วแชร์ลิงก์เชิญให้เพื่อนร่วมทีมเข้าร่วมด้วย Join Code",
    createTeam: "สร้างทีม",
    teamNameLabel: "ชื่อทีม",
    teamTitle: "รวมทีมเควสต์",
    teamSubtitle: "รวมทีมด้วย Join Code แล้วส่งทีมเมื่อสมาชิกครบตามจำนวน",
    roster: "สมาชิกทีม",
    openSlot: "ที่ว่าง — แชร์ลิงก์เชิญเพื่อชวนสมาชิก",
    fullRosterHint: (headcount) =>
      `ต้องมีสมาชิกครบ ${headcount} คนจึงจะส่งทีมได้`,
    leaveTeam: "ออกจากทีม",
    removeMember: "นำออก",
    saveTeamName: "บันทึก",
    saveTeamNameLabel: "บันทึกชื่อทีม",
    inviteMembersTitle: "เชิญสมาชิก",
    joinCodeLabel: "รหัสเข้าร่วมทีม",
    joinCodeExpires: (date) => `หมดอายุ ${date}`,
    joinCodeHiddenForLeader:
      "รหัสจะแสดงบนเครื่องที่สร้างเท่านั้น สร้างรหัสใหม่เพื่อแชร์ลิงก์เชิญ",
    joinCodeHiddenForMember: "ขอลิงก์เชิญจากหัวหน้าทีม",
    shareInvite: "แชร์ลิงก์เชิญ",
    shareInviteLabel: "แชร์ลิงก์เชิญ",
    regenerateJoinCode: "สร้างรหัสใหม่",
    regenerateJoinCodeLabel: "สร้างรหัสใหม่",
    enterJoinCode: "กรอกรหัสเข้าร่วมทีม",
    joinShort: "เข้าร่วม",
    proposalTitle: "ข้อเสนอและเอกสารแนบ",
    proposalHelper: "เพิ่มข้อความข้อเสนอและไฟล์ประกอบอย่างน้อยหนึ่งไฟล์",
    proposalNoteLabel: "ข้อความข้อเสนอ",
    proposalNotePlaceholder: "ข้อความข้อเสนอ (จำเป็น)",
    proposal: "ข้อเสนอ",
    fileCount: (count) => `${count} ไฟล์`,
    attachedFiles: "ไฟล์แนบ",
    reviewAttachments: "ดูไฟล์แนบ",
    submissionImage: (index) => `รูปภาพที่ส่งมา ${index}`,
    noImageAttachments: "ไม่มีรูปภาพในไฟล์แนบของข้อเสนอนี้",
    submissionImagesUnavailable: "โหลดรูปภาพที่ส่งมาไม่สำเร็จ ลองอีกครั้ง",
    attachFile: "แนบเอกสารหรือรูปภาพ",
    removeFile: (name) => `ลบไฟล์ ${name}`,
    filePickFailed: "เลือกไฟล์ไม่สำเร็จ",
    fileTooLarge: "ไฟล์ประกอบแต่ละไฟล์ต้องมีขนาดไม่เกิน 10 MB",
    teamSubmissionUnavailable: "ยังส่งทีมไม่ได้",
    submissionContentRequired:
      "เพิ่มข้อความข้อเสนอและไฟล์ประกอบอย่างน้อยหนึ่งไฟล์ก่อนส่งทีม",
    leader: "หัวหน้าทีม",
    member: "สมาชิก",
    memberCount: (count) => `สมาชิก ${count} คน`,
    rosterCount: (actual, requested) => `สมาชิก ${actual}/${requested} คน`,
    joinTeamTitle: "เข้าร่วม Candidate Team",
    joinTeamDescription: "กรอก Join Code ที่หัวหน้าทีมแชร์ให้คุณ",
    joinTeamCodeLabel: "Join Code",
    joinTeamCodePlaceholder: "กรอก Join Code",
    teamInviteMessage: (teamName, link) =>
      `เข้าร่วมทีม "${teamName}" ของฉันใน KUQuest: ${link}`,
    joinTeam: "เข้าร่วมทีม",
    joiningTeam: "กำลังเข้าร่วมทีม…",
    joinCodeInvalid: "Join Code ไม่ถูกต้องหรือหมดอายุแล้ว",
    joinTeamFull: "ทีมนี้เต็มแล้วหรือไม่สามารถรับสมาชิกเพิ่มได้",
    joinTeamFailed: "เข้าร่วมทีมไม่สำเร็จ ลองอีกครั้ง",
    partialRosterHint:
      "ส่งทีมได้เมื่อมีสมาชิกที่ตอบรับแล้วอย่างน้อย 1 คน และรายชื่อจะถูกล็อกเมื่อยืนยัน",
    reviewRoster: "ตรวจสอบรายชื่อทีม",
    reviewTitle: "ตรวจสอบรายชื่อทีม",
    reviewDescription: "ยืนยันสมาชิกที่ตอบรับแล้วก่อนส่งข้อเสนอผู้สมัคร",
    confirmSubmit: "ยืนยันและส่งทีม",
    submittingTeam: "กำลังส่งทีม…",
    submittedTitle: "ส่งทีมแล้ว",
    lockedDescription:
      "รายชื่อทีมถูกล็อกแล้ว สมาชิกที่ยังรอคำเชิญจะเข้าร่วมหลังส่งทีมไม่ได้",
    teamSubmitted: "ส่งทีมแล้ว",
    teamSelected: "ได้รับเลือก",
    teamRejected: "ไม่ผ่านการเลือก",
    openWorkHub: "เปิดศูนย์งาน",
    searchMembers: "ค้นหาสมาชิก KU",
    searchMembersHint: "ค้นหาด้วยชื่อหรืออีเมล @ku.th",
    clearSearch: "ล้างการค้นหาสมาชิก",
    noEligibleMembers: "ไม่มีสมาชิก KU ที่มีสิทธิ์ในขณะนี้",
    noSearchResults: "ไม่พบสมาชิกที่ตรงกับการค้นหา",
    invite: "เชิญ",
    inviteSelected: (count) => `เชิญ ${count} คนที่เลือก`,
    invited: "ส่งคำเชิญแล้ว",
    pendingInvitation: "รอตอบรับคำเชิญ",
    invitationExpires: (date) => `หมดอายุ ${date}`,
    acceptInvitation: "ตอบรับคำเชิญ",
    declineInvitation: "ปฏิเสธคำเชิญ",
    invitationAccepted: "ตอบรับคำเชิญแล้ว",
    invitationDeclined: "ปฏิเสธคำเชิญแล้ว",
    candidateReviewTitle: "ตรวจสอบข้อเสนอผู้สมัคร",
    candidateReviewSubtitle:
      "เลือกข้อเสนอที่ส่งแล้ว 1 รายการเพื่อดำเนินเควสต์ต่อ",
    individualProposal: "ข้อเสนอรายบุคคล",
    teamProposal: "ข้อเสนอจากทีม",
    submittedLabel: "ส่งแล้ว",
    requestedHeadcount: "จำนวนที่ต้องการ",
    actualHeadcount: "จำนวนที่จะเริ่มจริง",
    rewardPerWorker: "ค่าตอบแทนต่อผู้ทำงาน",
    reservedReward: "เงินรางวัลที่สำรองไว้",
    settledReward: "เงินรางวัลที่จ่ายจริง",
    refund: "เงินคืน",
    noRefund: "ไม่มีเงินคืน",
    selectProposal: "เลือกข้อเสนอ",
    selected: "ได้รับเลือก",
    rejected: "ไม่ผ่านการเลือก",
    accept: "รับข้อเสนอ",
    reject: "ปฏิเสธ",
    noProposals: "ยังไม่มีข้อเสนอผู้สมัครที่ส่งแล้ว",
    proposalCount: (count) => `ข้อเสนอ ${count} รายการ`,
    partialConsentTitle: "รายละเอียดเควสต์ที่เปลี่ยนแปลง",
    partialConsentSubtitle:
      "ผู้ทำงานที่เข้าร่วมตอบรับค่าตอบแทนและกำหนดส่งใหม่เป็นรายบุคคล",
    reviewPartialStart: "ตรวจสอบรายละเอียดที่เปลี่ยนแปลง",
    frozenRoster: "ผู้ทำงานที่เข้าร่วม",
    voteStatus: "การตอบรับของผู้ทำงาน",
    hirer: "ผู้ว่าจ้าง",
    worker: "ผู้ทำงาน",
    pendingVote: "รอตอบกลับ",
    approvedVote: "ตอบรับแล้ว",
    rejectedVote: "ปฏิเสธแล้ว",
    votesProgress: (approved, required) =>
      `อนุมัติแล้ว ${approved} จาก ${required} คน`,
    workersAcceptedProgress: (accepted, required) =>
      `ผู้ทำงานตอบรับแล้ว ${accepted} จาก ${required} คน`,
    timeRemaining: "เวลาที่เหลือ",
    approveStart: "ตอบรับ",
    rejectStart: "ปฏิเสธ",
    chatWritableHint: "แชตเควสต์เดิมยังส่งข้อความได้ระหว่างรอการลงคะแนน",
    approvedTitle: "เรียบร้อย — กำหนดผู้ทำงานให้เควสต์แล้ว",
    approvedDescription: (actual) => `กำหนดผู้ทำงาน ${actual} คนให้เควสต์แล้ว`,
    cancelledTitle: "ยกเลิกเควสต์แล้ว",
    timedOutDescription: "หมดเวลาตอบกลับก่อนทุกคนตอบรับ เควสต์ถูกยกเลิก",
    noConsent: "เควสต์นี้ไม่ต้องตอบกลับ",
    partialDetailsChanged: "รายละเอียดเควสต์มีการเปลี่ยนแปลง",
    respondWithin: "ตอบกลับภายใน",
    hirerDecisionPending: "กำลังรอการตัดสินใจจากผู้ว่าจ้าง",
    workerResponseRequired: "คุณต้องตอบกลับ",
    acceptingWaitsForEveryone:
      "การตอบรับของคุณเพียงคนเดียวไม่ได้เริ่มเควสต์ ผู้ทำงานทุกคนที่เข้าร่วมต้องตอบรับ หากมีผู้ปฏิเสธหรือไม่ตอบภายในเวลา เควสต์จะถูกยกเลิก ผู้ทำงานไม่ต้องชำระเงินและไม่มีเงินที่ต้องได้รับ ผู้ว่าจ้างได้รับเงินคืนเต็มจำนวน",
    decliningCancelsForEveryone:
      "การปฏิเสธจะยกเลิกเควสต์สำหรับทุกคน ผู้ทำงานไม่ต้องชำระเงินและไม่มีเงินที่ต้องได้รับ ผู้ว่าจ้างได้รับเงินคืนเต็มจำนวน",
    acceptedWaiting: (count) =>
      `คุณตอบรับแล้ว — กำลังรอผู้ทำงานอีก ${count} คน`,
    declinedByYou: "คุณปฏิเสธแล้ว เควสต์ถูกยกเลิกสำหรับทุกคน",
    declinedByWorker: "มีผู้ทำงานปฏิเสธ เควสต์ถูกยกเลิก",
    timedOutCancellation: "หมดเวลาตอบกลับก่อนทุกคนตอบรับ เควสต์ถูกยกเลิก",
    hirerCancelled: "ผู้ว่าจ้างยกเลิกเควสต์",
    hirerNoDecision: "ผู้ว่าจ้างไม่ได้ตัดสินใจภายในเวลา เควสต์จึงถูกยกเลิก",
    genericCancellation: "เควสต์ถูกยกเลิกก่อนผู้ทำงานทุกคนตอบรับ",
    hirerCancelledOutcome: "ผู้ว่าจ้างยกเลิกเควสต์ และได้รับเงินคืนเต็มจำนวน",
    hirerNoDecisionOutcome:
      "ผู้ว่าจ้างไม่ได้ตัดสินใจภายในเวลา เควสต์จึงถูกยกเลิก และผู้ว่าจ้างได้รับเงินคืนเต็มจำนวน",
    hirerWorkerDeclinedOutcome:
      "มีผู้ทำงานปฏิเสธ เควสต์ถูกยกเลิก และผู้ว่าจ้างได้รับเงินคืนเต็มจำนวน",
    hirerTimedOutOutcome:
      "หมดเวลาตอบกลับก่อนทุกคนตอบรับ เควสต์ถูกยกเลิก และผู้ว่าจ้างได้รับเงินคืนเต็มจำนวน",
    hirerGenericCancellation:
      "เควสต์ถูกยกเลิกก่อนผู้ทำงานทุกคนตอบรับ และผู้ว่าจ้างได้รับเงินคืนเต็มจำนวน",
    cancelledAt: (date, time) => `ยกเลิกเมื่อ ${date} เวลา ${time}`,
    timeUpChecking: "หมดเวลาแล้ว — กำลังตรวจสอบผล…",
    nothingToRespond: "ไม่มีรายการให้ตอบ เควสต์นี้ไม่ได้รอการตอบรับแล้ว",
    backToQuest: "กลับไปยังเควสต์",
    browseOtherQuests: "ดูเควสต์อื่น",
    questAssignedNext: "เรียบร้อย — กำหนดผู้ทำงานให้เควสต์แล้ว",
    workerHeadcountJoined: (actual, requested) =>
      `มีผู้ทำงานเข้าร่วม ${actual} จาก ${requested} คน`,
    decline: "ปฏิเสธ",
    proceedConsequence:
      "หากดำเนินการต่อ ผู้ทำงานที่เข้าร่วมจะมีเวลา 10 นาทีตอบรับค่าตอบแทนและกำหนดส่งใหม่ ทุกคนต้องตอบรับ มิฉะนั้นเควสต์จะถูกยกเลิก ผู้ทำงานไม่ต้องชำระเงินและไม่มีเงินที่ต้องได้รับ ผู้ว่าจ้างได้รับเงินคืนเต็มจำนวน",
    cancelConsequence:
      "การยกเลิกจะสิ้นสุดเควสต์ และคุณจะได้รับเงินคืนเต็มจำนวน",
    assignedOpenWorkHub: "เปิดศูนย์งาน",
  },
};
