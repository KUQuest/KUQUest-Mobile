import type { SupportedLocale } from './LocaleProvider';

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
  teamTitle: string;
  teamSubtitle: string;
  roster: string;
  leader: string;
  member: string;
  memberCount: (count: number) => string;
  rosterCount: (actual: number, requested: number) => string;
  partialRosterHint: string;
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
  cancelledDescription: string;
  timedOutDescription: string;
  noConsent: string;
}

export const groupQuestMessages: Record<SupportedLocale, GroupQuestMessages> = {
  en: {
    close: 'Close',
    cancel: 'Cancel',
    retry: 'Try again',
    loading: 'Loading',
    errorTitle: 'Could not load this Quest',
    errorDescription: 'The latest Quest information is unavailable. Try again.',
    noTeamTitle: 'No Quest Team yet',
    noTeamDescription: 'Create a team, then invite eligible KU Account Holders by name or @ku.th.',
    createTeam: 'Create Team',
    teamTitle: 'Build your Quest Team',
    teamSubtitle: 'No team name is needed. Your Leader and roster identify the team.',
    roster: 'Accepted roster',
    leader: 'Team Leader',
    member: 'Member',
    memberCount: (count) => `${count} ${count === 1 ? 'member' : 'members'}`,
    rosterCount: (actual, requested) => `Roster ${actual}/${requested}`,
    partialRosterHint: 'You can submit with one or more accepted members. The roster locks after confirmation.',
    reviewRoster: 'Review roster',
    reviewTitle: 'Review your roster',
    reviewDescription: 'Confirm the accepted members before submitting this Candidate Proposal.',
    confirmSubmit: 'Confirm and submit',
    submittingTeam: 'Submitting…',
    submittedTitle: 'Team submitted',
    lockedDescription: 'This roster is locked. Pending invitees cannot be added after submission.',
    teamSubmitted: 'Submitted',
    teamSelected: 'Selected',
    teamRejected: 'Rejected',
    searchMembers: 'Search KU members',
    searchMembersHint: 'Search by name or @ku.th email',
    clearSearch: 'Clear member search',
    noEligibleMembers: 'No eligible KU members available',
    noSearchResults: 'No members match your search',
    invite: 'Invite',
    inviteSelected: (count) => `Invite ${count} selected`,
    invited: 'Invited',
    pendingInvitation: 'Invitation pending',
    invitationExpires: (date) => `Expires ${date}`,
    acceptInvitation: 'Accept invitation',
    declineInvitation: 'Decline invitation',
    invitationAccepted: 'Invitation accepted',
    invitationDeclined: 'Invitation declined',
    candidateReviewTitle: 'Review Candidate Proposals',
    candidateReviewSubtitle: 'Select one submitted proposal to move this Quest forward.',
    individualProposal: 'Individual Proposal',
    teamProposal: 'Team Proposal',
    submittedLabel: 'Submitted',
    requestedHeadcount: 'Requested headcount',
    actualHeadcount: 'Actual headcount',
    rewardPerWorker: 'Reward per Worker',
    reservedReward: 'Reserved reward',
    settledReward: 'Settled reward',
    refund: 'Refund',
    noRefund: 'No refund',
    selectProposal: 'Select proposal',
    selected: 'Selected',
    rejected: 'Rejected',
    accept: 'Accept',
    reject: 'Reject',
    noProposals: 'No submitted Candidate Proposals yet',
    proposalCount: (count) => `${count} ${count === 1 ? 'proposal' : 'proposals'}`,
    partialConsentTitle: 'Start with the current team?',
    partialConsentSubtitle: 'The roster is frozen while every required person votes.',
    frozenRoster: 'Frozen roster',
    voteStatus: 'Vote status',
    hirer: 'Hirer',
    worker: 'Worker',
    pendingVote: 'Awaiting vote',
    approvedVote: 'Approved',
    rejectedVote: 'Rejected',
    votesProgress: (approved, required) => `${approved} of ${required} approved`,
    timeRemaining: 'Time remaining',
    approveStart: 'Approve start',
    rejectStart: 'Reject start',
    chatWritableHint: 'The existing Quest chat stays writable while this vote is pending.',
    approvedTitle: 'Partial start approved',
    approvedDescription: (actual) => `The Quest will start with ${actual} ${actual === 1 ? 'Worker' : 'Workers'}.`,
    cancelledTitle: 'Quest cancelled',
    cancelledDescription: 'The partial roster did not receive unanimous approval. Reserved rewards are fully refunded.',
    timedOutDescription: 'The five-minute consent window ended before everyone approved. Reserved rewards are fully refunded.',
    noConsent: 'No partial-start consent is available.',
  },
  th: {
    close: 'ปิด',
    cancel: 'ยกเลิก',
    retry: 'ลองอีกครั้ง',
    loading: 'กำลังโหลด',
    errorTitle: 'โหลดเควสต์นี้ไม่สำเร็จ',
    errorDescription: 'ไม่สามารถโหลดข้อมูลเควสต์ล่าสุดได้ ลองอีกครั้ง',
    noTeamTitle: 'ยังไม่มีทีมเควสต์',
    noTeamDescription: 'สร้างทีม แล้วเชิญผู้ถือบัญชี KU ที่มีสิทธิ์ด้วยชื่อหรืออีเมล @ku.th',
    createTeam: 'สร้างทีม',
    teamTitle: 'รวมทีมเควสต์',
    teamSubtitle: 'ไม่ต้องตั้งชื่อทีม ระบบใช้หัวหน้าทีมและสมาชิกเป็นตัวระบุทีม',
    roster: 'สมาชิกที่ตอบรับแล้ว',
    leader: 'หัวหน้าทีม',
    member: 'สมาชิก',
    memberCount: (count) => `สมาชิก ${count} คน`,
    rosterCount: (actual, requested) => `สมาชิก ${actual}/${requested} คน`,
    partialRosterHint: 'ส่งทีมได้เมื่อมีสมาชิกที่ตอบรับแล้วอย่างน้อย 1 คน และรายชื่อจะถูกล็อกเมื่อยืนยัน',
    reviewRoster: 'ตรวจสอบรายชื่อทีม',
    reviewTitle: 'ตรวจสอบรายชื่อทีม',
    reviewDescription: 'ยืนยันสมาชิกที่ตอบรับแล้วก่อนส่งข้อเสนอผู้สมัคร',
    confirmSubmit: 'ยืนยันและส่งทีม',
    submittingTeam: 'กำลังส่งทีม…',
    submittedTitle: 'ส่งทีมแล้ว',
    lockedDescription: 'รายชื่อทีมถูกล็อกแล้ว สมาชิกที่ยังรอคำเชิญจะเข้าร่วมหลังส่งทีมไม่ได้',
    teamSubmitted: 'ส่งทีมแล้ว',
    teamSelected: 'ได้รับเลือก',
    teamRejected: 'ไม่ผ่านการเลือก',
    searchMembers: 'ค้นหาสมาชิก KU',
    searchMembersHint: 'ค้นหาด้วยชื่อหรืออีเมล @ku.th',
    clearSearch: 'ล้างการค้นหาสมาชิก',
    noEligibleMembers: 'ไม่มีสมาชิก KU ที่มีสิทธิ์ในขณะนี้',
    noSearchResults: 'ไม่พบสมาชิกที่ตรงกับการค้นหา',
    invite: 'เชิญ',
    inviteSelected: (count) => `เชิญ ${count} คนที่เลือก`,
    invited: 'ส่งคำเชิญแล้ว',
    pendingInvitation: 'รอตอบรับคำเชิญ',
    invitationExpires: (date) => `หมดอายุ ${date}`,
    acceptInvitation: 'ตอบรับคำเชิญ',
    declineInvitation: 'ปฏิเสธคำเชิญ',
    invitationAccepted: 'ตอบรับคำเชิญแล้ว',
    invitationDeclined: 'ปฏิเสธคำเชิญแล้ว',
    candidateReviewTitle: 'ตรวจสอบข้อเสนอผู้สมัคร',
    candidateReviewSubtitle: 'เลือกข้อเสนอที่ส่งแล้ว 1 รายการเพื่อดำเนินเควสต์ต่อ',
    individualProposal: 'ข้อเสนอรายบุคคล',
    teamProposal: 'ข้อเสนอจากทีม',
    submittedLabel: 'ส่งแล้ว',
    requestedHeadcount: 'จำนวนที่ต้องการ',
    actualHeadcount: 'จำนวนที่จะเริ่มจริง',
    rewardPerWorker: 'ค่าตอบแทนต่อผู้ทำงาน',
    reservedReward: 'เงินรางวัลที่สำรองไว้',
    settledReward: 'เงินรางวัลที่จ่ายจริง',
    refund: 'เงินคืน',
    noRefund: 'ไม่มีเงินคืน',
    selectProposal: 'เลือกข้อเสนอ',
    selected: 'ได้รับเลือก',
    rejected: 'ไม่ผ่านการเลือก',
    accept: 'รับข้อเสนอ',
    reject: 'ปฏิเสธ',
    noProposals: 'ยังไม่มีข้อเสนอผู้สมัครที่ส่งแล้ว',
    proposalCount: (count) => `ข้อเสนอ ${count} รายการ`,
    partialConsentTitle: 'เริ่มงานด้วยทีมปัจจุบันไหม',
    partialConsentSubtitle: 'รายชื่อถูกล็อกไว้ระหว่างรอทุกคนลงคะแนน',
    frozenRoster: 'รายชื่อที่ล็อกไว้',
    voteStatus: 'สถานะการลงคะแนน',
    hirer: 'ผู้ว่าจ้าง',
    worker: 'ผู้ทำงาน',
    pendingVote: 'รอลงคะแนน',
    approvedVote: 'อนุมัติแล้ว',
    rejectedVote: 'ปฏิเสธแล้ว',
    votesProgress: (approved, required) => `อนุมัติแล้ว ${approved} จาก ${required} คน`,
    timeRemaining: 'เวลาที่เหลือ',
    approveStart: 'อนุมัติการเริ่มงาน',
    rejectStart: 'ปฏิเสธการเริ่มงาน',
    chatWritableHint: 'แชตเควสต์เดิมยังส่งข้อความได้ระหว่างรอการลงคะแนน',
    approvedTitle: 'อนุมัติการเริ่มงานแบบไม่เต็มจำนวนแล้ว',
    approvedDescription: (actual) => `เควสต์จะเริ่มด้วยผู้ทำงาน ${actual} คน`,
    cancelledTitle: 'ยกเลิกเควสต์แล้ว',
    cancelledDescription: 'รายชื่อบางส่วนไม่ได้รับการอนุมัติจากทุกคน เงินที่สำรองไว้จะคืนเต็มจำนวน',
    timedOutDescription: 'หมดเวลา 5 นาทีโดยที่ยังไม่ได้รับการอนุมัติจากทุกคน เงินที่สำรองไว้จะคืนเต็มจำนวน',
    noConsent: 'ไม่มีการยินยอมก่อนเริ่มงานแบบไม่เต็มจำนวน',
  },
};
