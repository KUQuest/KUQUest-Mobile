import type { SupportedLocale } from './LocaleProvider';

export interface QuestBoardMessages {
  title: string;
  subtitle: string;
  fundingTitle: string;
  fundingHeld: string;
  fundingStatusLabel: string;
  fundingUnavailable: string;
  fundingUnavailableDescription: string;
  fundingReservationDescription: string;
  fundingExpand: string;
  fundingCollapse: string;
  fundingTopUp: string;
  fundingTransfer: string;
  fundingActionsUnavailable: string;
  topUpTitle: string;
  topUpAmountTitle: string;
  topUpAmountDescription: string;
  topUpAmountLabel: string;
  topUpQuickAmountLabel: (amount: number) => string;
  topUpPromptPayTitle: string;
  topUpPromptPayDescription: string;
  topUpPromptPayPrototype: string;
  topUpPromptPayUnavailable: string;
  topUpClose: string;
  topUpBack: string;
  topUpContinue: string;
  settlement: string;
  settlementDescription: string;
  refunds: string;
  refundsDescription: string;
  searchPlaceholder: string;
  clearSearch: string;
  clearSearchAndFilters: string;
  filter: string;
  sort: string;
  filtersTitle: string;
  sortTitle: string;
  applyFilters: string;
  clearAll: string;
  selectedFilters: (count: number) => string;
  close: string;
  cancel: string;
  activeFiltersLabel: string;
  removeFilter: (label: string) => string;
  tags: string;
  searchTags: string;
  clearTagSearch: string;
  noMatchingTags: string;
  removeSelectedTag: (tag: string) => string;
  reward: string;
  rewardMin: string;
  rewardMax: string;
  rewardInvalid: string;
  rewardSummary: (minimum: number | null, maximum: number | null) => string;
  noLimit: string;
  deadline: string;
  startTime: string;
  morning: string;
  afternoon: string;
  evening: string;
  schedule: string;
  scheduleDescription: string;
  startWork: string;
  workWindow: string;
  finishBy: string;
  finishByDescription: string;
  timeNotSpecified: string;
  location: string;
  spots: string;
  spotsSummary: (remaining: number, total: number) => string;
  participantsSummary: (accepted: number, total: number) => string;
  endingSoon: string;
  imageCount: (count: number) => string;
  questImageLabel: (index: number) => string;
  imageUnavailable: string;
  perPerson: string;
  noQuests: string;
  noMatches: string;
  clearFilters: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  retrySuccess: string;
  loading: string;
  resultsLabel: string;
  stateFull: string;
  stateClosed: string;
  online: string;
  onCampus: string;
  today: string;
  within3Days: string;
  within7Days: string;
  newest: string;
  deadlineSoonest: string;
  rewardHighest: string;
  back: string;
  details: string;
  viewDetails: string;
  creator: string;
  messageOwner: string;
  messageOwnerShort: string;
  messageOwnerLoading: string;
  messageOwnerError: string;
  requirements: string;
  description: string;
  completionCriteria: string;
  proofRequired: string;
  required: string;
  optional: string;
  notNeeded: string;
  candidateMode: string;
  candidate: string;
  firstCome: string;
  reviewCandidates: string;
  applyForReview: string;
  participation: string;
  participants: string;
  singlePerson: string;
  team: string;
  applyNow: string;
  joinNow: string;
  editPost: string;
  leaveQuest: string;
  leaveQuestDescription: string;
  withdrawApplication: string;
  withdrawApplicationDescription: string;
  leftQuest: string;
  leftQuestDescription: string;
  historyQuest: string;
  historyQuestDescription: string;
  postOwnerView: string;
  postOwnerViewDescription: string;
  confirmApplicationTitle: string;
  confirmParticipationTitle: string;
  confirmApplicationDescription: string;
  confirmParticipationDescription: string;
  confirmApplication: string;
  confirmParticipation: string;
  notYet: string;
  applicationAccepted: string;
  participationConfirmed: string;
  applicationPending: string;
  applicationAcceptedDescription: string;
  applicationPendingDescription: string;
  viewMyQuests: string;
  firstComeDescription: string;
  reviewCandidatesDescription: string;
  proofRequiredDescription: string;
  proofOptionalDescription: string;
  proofNotNeededDescription: string;
  questFull: string;
  applicationsClosed: string;
  unavailableApplication: string;
  questNotFound: string;
  questNotFoundDescription: string;
  statusLabel: (status: string) => string;
  consentBannerTitle: string;
  consentBannerDescription: (approved: number, required: number) => string;
  consentCountdown: string;
  approveEdit: string;
  rejectEdit: string;
  teamBannerTitle: string;
  teamLeader: string;
  teamMemberCount: (members: number, required: number) => string;
  createTeam: string;
  inviteWorker: string;
  submitTeam: string;
  acceptInvitation: string;
  declineInvitation: string;
  revokeInvitation: string;
  applicationBannerTitle: string;
  applicationCount: (count: number) => string;
  selectCandidate: string;
  proofBannerTitle: string;
  proofPending: string;
  proofRejected: string;
  reworkRemaining: (remaining: number, limit: number) => string;
  submitProof: string;
  confirmCompletion: string;
  submitRework: string;
  approveProof: string;
  rejectProof: string;
  disputeBannerTitle: string;
  disputeDescription: string;
  openDispute: string;
  resolveDispute: string;
  completeQuest: string;
  cancelQuest: string;
  publishQuest: string;
  escrowRewardPool: string;
  escrowPlatformFee: string;
  escrowTotal: string;
  terminalBannerTitle: string;
  terminalDescription: string;
}

export const questBoardMessages: Record<SupportedLocale, QuestBoardMessages> = {
  en: {
    title: 'Quest Board',
    subtitle: 'Find a Quest that fits your skills and time.',
    fundingTitle: 'My funding',
    fundingHeld: 'RESERVED PER WORKER PLACE',
    fundingStatusLabel: 'PROTOTYPE STATUS',
    fundingUnavailable: 'Payment service unavailable',
    fundingUnavailableDescription: 'This prototype does not connect to a payment service, so a live balance is not available.',
    fundingReservationDescription: 'Quest Funding reserves the reward for each requested Worker place.',
    fundingExpand: 'Show funding details',
    fundingCollapse: 'Hide funding details',
    fundingTopUp: 'Top up',
    fundingTransfer: 'Transfer',
    fundingActionsUnavailable: 'Transfer is unavailable until the payment service is connected. Top up is a prototype flow only.',
    topUpTitle: 'Top up',
    topUpAmountTitle: 'Enter amount',
    topUpAmountDescription: 'Choose an amount to add to your funding balance.',
    topUpAmountLabel: 'Amount (THB)',
    topUpQuickAmountLabel: (amount) => `Choose ฿${amount.toLocaleString('en-US')}`,
    topUpPromptPayTitle: 'PromptPay QR',
    topUpPromptPayDescription: 'Review this PromptPay QR preview. It is a visual prototype and is not connected to a payment service.',
    topUpPromptPayPrototype: 'Prototype QR · not scannable',
    topUpPromptPayUnavailable: 'PromptPay top up is unavailable. No payment was made and your funding balance was not changed.',
    topUpClose: 'Close',
    topUpBack: 'Back',
    topUpContinue: 'Continue',
    settlement: 'Settlement',
    settlementDescription: 'Settlement pays rewards for the Actual Headcount.',
    refunds: 'Refunds',
    refundsDescription: 'Unused reserved Worker places are refunded.',
    searchPlaceholder: 'Search for a Quest',
    clearSearch: 'Clear Quest search',
    clearSearchAndFilters: 'Clear search and filters',
    filter: 'Filter by',
    sort: 'Sort by',
    filtersTitle: 'Filter Quests',
    sortTitle: 'Sort Quests',
    applyFilters: 'Apply filters',
    clearAll: 'Clear all',
    selectedFilters: (count) => count === 0 ? 'No filters selected' : `${count} filter${count === 1 ? '' : 's'} selected`,
    close: 'Close',
    cancel: 'Cancel',
    activeFiltersLabel: 'Active Quest Board filters',
    removeFilter: (label) => `Remove ${label} filter`,
    tags: 'Tags',
    searchTags: 'Search tags',
    clearTagSearch: 'Clear tag search',
    noMatchingTags: 'No matching tags',
    removeSelectedTag: (tag) => `Remove ${tag}`,
    reward: 'Reward',
    rewardMin: 'Min reward',
    rewardMax: 'Max reward',
    rewardInvalid: 'Enter valid non-negative whole-baht bounds with minimum no greater than maximum.',
    rewardSummary: (minimum, maximum) => minimum !== null && maximum !== null ? `฿${minimum}–฿${maximum}` : minimum !== null ? `From ฿${minimum}` : `Up to ฿${maximum}`,
    noLimit: 'No limit',
    deadline: 'Deadline',
    startTime: 'Start time',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    schedule: 'Schedule',
    scheduleDescription: 'Plan the work window and deadline.',
    startWork: 'Start work',
    workWindow: 'Work window',
    finishBy: 'Finish by',
    finishByDescription: 'Complete the Quest by this date.',
    timeNotSpecified: 'Time not specified',
    location: 'Where',
    spots: 'spots',
    spotsSummary: (remaining, total) => `${remaining} of ${total} spots left`,
    participantsSummary: (accepted, total) => `Participants ${accepted}/${total}`,
    endingSoon: 'Ending soon',
    imageCount: (count) => `${count} photo${count === 1 ? '' : 's'}`,
    questImageLabel: (index) => `Quest image ${index}`,
    imageUnavailable: 'Quest image unavailable',
    perPerson: '/ person',
    noQuests: 'No quests available yet.',
    noMatches: 'No quests found',
    clearFilters: 'Clear filters',
    errorTitle: 'Quest Board unavailable',
    errorDescription: 'We could not load available Quests. Try again.',
    retry: 'Try again',
    retrySuccess: 'Quest Board refreshed',
    loading: 'Loading Quests',
    resultsLabel: 'Quest Board results',
    stateFull: 'Quest full',
    stateClosed: 'Applications closed',
    online: 'Online',
    onCampus: 'On campus',
    today: 'Today',
    within3Days: 'Within 3 days',
    within7Days: 'Within 7 days',
    newest: 'Newest',
    deadlineSoonest: 'Deadline soonest',
    rewardHighest: 'Reward highest',
    back: 'Go back',
    details: 'Quest details',
    viewDetails: 'View details',
    creator: 'Posted by',
    messageOwner: 'Message Quest owner',
    messageOwnerShort: 'Message owner',
    messageOwnerLoading: 'Opening chat…',
    messageOwnerError: 'We could not open a chat with the Quest owner. Try again.',
    requirements: 'Requirements',
    description: 'Description',
    completionCriteria: 'Completion criteria',
    proofRequired: 'Proof of completion',
    required: 'Required',
    optional: 'Optional',
    notNeeded: 'Not needed',
    candidateMode: 'Candidate mode',
    candidate: 'Candidate',
    firstCome: 'First-come, first-served',
    reviewCandidates: 'Review candidates',
    applyForReview: 'Apply for review',
    participation: 'Participation',
    participants: 'Participants',
    singlePerson: 'Single person',
    team: 'Team',
    applyNow: 'Apply now',
    joinNow: 'Join Quest',
    editPost: 'Edit post',
    leaveQuest: 'Leave Quest',
    leaveQuestDescription: 'You will leave this Quest and lose your confirmed place.',
    withdrawApplication: 'Withdraw application',
    withdrawApplicationDescription: 'Your application will be withdrawn and you will no longer be considered.',
    leftQuest: 'You left this Quest',
    leftQuestDescription: 'This Quest has been removed from your active joined Quests.',
    historyQuest: 'Quest history',
    historyQuestDescription: 'This Quest is in your history and no longer has an active action.',
    postOwnerView: 'Your Quest post',
    postOwnerViewDescription: 'Manage this Quest from here. You can edit the post or review applicants from My Quests.',
    confirmApplicationTitle: 'Confirm your application',
    confirmParticipationTitle: 'Confirm your participation',
    confirmApplicationDescription: 'You are applying for this Quest. Review the reward and deadline before continuing.',
    confirmParticipationDescription: 'You are joining this Quest. Review the reward and schedule before continuing.',
    confirmApplication: 'Confirm application',
    confirmParticipation: 'Confirm participation',
    notYet: 'Not yet',
    applicationAccepted: 'Application accepted',
    participationConfirmed: 'Participation confirmed',
    applicationPending: 'Application pending',
    applicationAcceptedDescription: 'Your place is confirmed. Keep the Quest details handy.',
    applicationPendingDescription: 'The Quest owner will review your application.',
    viewMyQuests: 'View in My Quests',
    firstComeDescription: 'Anyone can join while a spot is available.',
    reviewCandidatesDescription: 'The Quest owner reviews applications before choosing participants.',
    proofRequiredDescription: 'You will submit proof of completion when the Quest is done.',
    proofOptionalDescription: 'You may submit proof of completion when the Quest is done.',
    proofNotNeededDescription: 'No proof of completion is needed.',
    questFull: 'Quest full',
    applicationsClosed: 'Applications closed',
    unavailableApplication: 'This Quest is no longer accepting applications.',
    questNotFound: 'Quest not found',
    questNotFoundDescription: 'This Quest does not exist or is no longer available.',
    statusLabel: (status) => ({
      QUEST_DRAFT: 'Draft', QUEST_OPEN: 'Open', QUEST_AWAITING_CONSENT: 'Awaiting Worker consent', QUEST_ASSIGNED: 'Assigned',
      QUEST_IN_PROGRESS: 'In progress', QUEST_SUBMITTED: 'Proof submitted', QUEST_APPROVED: 'Approved', QUEST_REWORK: 'Rework requested',
      QUEST_COMPLETED: 'Completed', QUEST_CANCELLED: 'Cancelled', QUEST_DISPUTED: 'Disputed', QUEST_HIDDEN: 'Hidden',
      TEAM_FORMING: 'Forming', TEAM_SUBMITTED: 'Submitted', TEAM_SELECTED: 'Selected', TEAM_REJECTED: 'Rejected',
      INVITATION_PENDING: 'Invitation pending', INVITATION_ACCEPTED: 'Invitation accepted', INVITATION_DECLINED: 'Invitation declined', INVITATION_EXPIRED: 'Invitation expired', INVITATION_REVOKED: 'Invitation revoked',
      APPLICATION_APPLIED: 'Applied', APPLICATION_SELECTED: 'Selected', APPLICATION_REJECTED: 'Rejected', APPLICATION_WITHDRAWN: 'Withdrawn',
      ASSIGNMENT_ACTIVE: 'Active', ASSIGNMENT_COMPLETED: 'Completed', ASSIGNMENT_INCOMPLETE: 'Incomplete', ASSIGNMENT_CANCELLED: 'Cancelled',
      PROOF_PENDING: 'Proof pending', PROOF_APPROVED: 'Proof approved', PROOF_REJECTED: 'Proof rejected', PROOF_AUTO_APPROVED: 'Proof auto-approved',
      EDIT_REQUEST_PENDING: 'Consent pending', EDIT_REQUEST_APPROVED: 'Edit approved', EDIT_REQUEST_REJECTED: 'Edit rejected',
      EDIT_RESPONSE_APPROVED: 'Approved', EDIT_RESPONSE_REJECTED: 'Rejected',
    }[status] ?? status),
    consentBannerTitle: 'Worker consent required',
    consentBannerDescription: (approved, required) => `${approved} of ${required} Workers approved the proposed edit.`,
    consentCountdown: 'Consent time remaining',
    approveEdit: 'Approve edit',
    rejectEdit: 'Reject edit',
    teamBannerTitle: 'Candidate Team',
    teamLeader: 'Team Leader',
    teamMemberCount: (members, required) => `${members}/${required} members`,
    createTeam: 'Form a Team',
    inviteWorker: 'Invite Worker',
    submitTeam: 'Submit Team',
    acceptInvitation: 'Accept invitation',
    declineInvitation: 'Decline invitation',
    revokeInvitation: 'Revoke invitation',
    applicationBannerTitle: 'Candidate applications',
    applicationCount: (count) => `${count} application${count === 1 ? '' : 's'}`,
    selectCandidate: 'Select Candidate',
    proofBannerTitle: 'Proof and review',
    proofPending: 'Proof is waiting for Hirer review.',
    proofRejected: 'Proof needs rework.',
    reworkRemaining: (remaining, limit) => `${remaining} of ${limit} rework attempts remaining`,
    submitProof: 'Submit proof',
    confirmCompletion: 'Confirm completion',
    submitRework: 'Submit rework',
    approveProof: 'Approve proof',
    rejectProof: 'Request rework',
    disputeBannerTitle: 'Quest dispute',
    disputeDescription: 'This Quest is waiting for an authorized dispute resolution.',
    openDispute: 'Open dispute',
    resolveDispute: 'Resolve dispute',
    completeQuest: 'Complete Quest',
    cancelQuest: 'Cancel Quest',
    publishQuest: 'Publish Quest',
    escrowRewardPool: 'Reward pool',
    escrowPlatformFee: 'Platform Fee',
    escrowTotal: 'Total Escrow required',
    terminalBannerTitle: 'Quest closed',
    terminalDescription: 'This Quest is terminal. It cannot be reopened or accepted again.',
  },
  th: {
    title: 'กระดานเควสต์',
    subtitle: 'ค้นหาเควสต์ที่เหมาะกับทักษะและเวลาของคุณ',
    fundingTitle: 'เงินของฉัน',
    fundingHeld: 'กันเงินไว้สำหรับที่ของ Worker',
    fundingStatusLabel: 'สถานะต้นแบบ',
    fundingUnavailable: 'ระบบชำระเงินยังไม่พร้อมใช้งาน',
    fundingUnavailableDescription: 'ต้นแบบนี้ยังไม่เชื่อมต่อระบบชำระเงิน จึงยังไม่มีข้อมูลยอดเงินที่ใช้งานได้',
    fundingReservationDescription: 'Quest Funding กันค่าตอบแทนไว้สำหรับ Worker แต่ละที่ที่ร้องขอ',
    fundingExpand: 'แสดงรายละเอียดเงิน',
    fundingCollapse: 'ซ่อนรายละเอียดเงิน',
    fundingTopUp: 'เติมเงิน',
    fundingTransfer: 'โอนเงิน',
    fundingActionsUnavailable: 'การโอนเงินยังไม่พร้อมใช้งานจนกว่าจะเชื่อมต่อระบบชำระเงิน ส่วนการเติมเงินเป็นเพียงขั้นตอนต้นแบบเท่านั้น',
    topUpTitle: 'เติมเงิน',
    topUpAmountTitle: 'ระบุจำนวนเงิน',
    topUpAmountDescription: 'เลือกจำนวนเงินที่ต้องการเพิ่มในเงินทุนของคุณ',
    topUpAmountLabel: 'จำนวนเงิน (บาท)',
    topUpQuickAmountLabel: (amount) => `เลือก ฿${amount.toLocaleString('en-US')}`,
    topUpPromptPayTitle: 'QR พร้อมเพย์',
    topUpPromptPayDescription: 'ตรวจสอบ QR พร้อมเพย์ตัวอย่างนี้ QR เป็นเพียงภาพต้นแบบและยังไม่เชื่อมต่อระบบชำระเงิน',
    topUpPromptPayPrototype: 'QR ต้นแบบ · สแกนไม่ได้',
    topUpPromptPayUnavailable: 'การเติมเงินผ่านพร้อมเพย์ยังไม่พร้อมใช้งาน ไม่มีการชำระเงินจริงและยอดเงินของคุณจะไม่เปลี่ยนแปลง',
    topUpClose: 'ปิด',
    topUpBack: 'ย้อนกลับ',
    topUpContinue: 'ดำเนินการต่อ',
    settlement: 'การชำระเงิน',
    settlementDescription: 'การชำระเงินจ่ายค่าตอบแทนตามจำนวน Worker จริง (Actual Headcount)',
    refunds: 'การคืนเงิน',
    refundsDescription: 'คืนเงินสำหรับที่ของ Worker ที่กันไว้แต่ไม่ได้ใช้',
    searchPlaceholder: 'ค้นหาเควสต์',
    clearSearch: 'ล้างการค้นหาเควสต์',
    clearSearchAndFilters: 'ล้างการค้นหาและตัวกรอง',
    filter: 'กรองโดย',
    sort: 'เรียงโดย',
    filtersTitle: 'กรองเควสต์',
    sortTitle: 'เรียงเควสต์',
    applyFilters: 'ใช้ตัวกรอง',
    clearAll: 'ล้างทั้งหมด',
    selectedFilters: (count) => count === 0 ? 'ยังไม่ได้เลือกตัวกรอง' : `เลือกตัวกรองแล้ว ${count} รายการ`,
    close: 'ปิด',
    cancel: 'ยกเลิก',
    activeFiltersLabel: 'ตัวกรองกระดานเควสต์ที่ใช้งานอยู่',
    removeFilter: (label) => `ลบตัวกรอง${label}`,
    tags: 'แท็ก',
    searchTags: 'ค้นหาแท็ก',
    clearTagSearch: 'ล้างการค้นหาแท็ก',
    noMatchingTags: 'ไม่พบแท็กที่ตรงกัน',
    removeSelectedTag: (tag) => `ลบ ${tag}`,
    reward: 'ค่าตอบแทน',
    rewardMin: 'ค่าตอบแทนขั้นต่ำ',
    rewardMax: 'ค่าตอบแทนสูงสุด',
    rewardInvalid: 'กรอกค่าตอบแทนเป็นจำนวนเต็มที่ไม่ติดลบ และค่าขั้นต่ำต้องไม่มากกว่าค่าสูงสุด',
    rewardSummary: (minimum, maximum) => minimum !== null && maximum !== null ? `฿${minimum}–฿${maximum}` : minimum !== null ? `ตั้งแต่ ฿${minimum}` : `ไม่เกิน ฿${maximum}`,
    noLimit: 'ไม่จำกัด',
    deadline: 'กำหนดส่ง',
    startTime: 'เวลาเริ่มต้น',
    morning: 'ช่วงเช้า',
    afternoon: 'ช่วงบ่าย',
    evening: 'ช่วงเย็น',
    schedule: 'เวลา',
    scheduleDescription: 'ดูช่วงเวลาทำงานและกำหนดส่งได้ที่นี่',
    startWork: 'เริ่มงาน',
    workWindow: 'ช่วงเวลาทำงาน',
    finishBy: 'ส่งงานภายใน',
    finishByDescription: 'ทำเควสต์ให้เสร็จภายในวันนี้',
    timeNotSpecified: 'ยังไม่ระบุเวลา',
    location: 'สถานที่',
    spots: 'ที่ว่าง',
    spotsSummary: (remaining, total) => `เหลือ ${remaining} จาก ${total} ที่ว่าง`,
    participantsSummary: (accepted, total) => `ผู้เข้าร่วม ${accepted}/${total} คน`,
    endingSoon: 'ใกล้ปิดรับสมัคร',
    imageCount: (count) => `${count} รูป`,
    questImageLabel: (index) => `รูปเควสต์ที่ ${index}`,
    imageUnavailable: 'ไม่สามารถแสดงรูปเควสต์ได้',
    perPerson: '/ คน',
    noQuests: 'ยังไม่มีเควสต์ที่พร้อมให้ค้นหา',
    noMatches: 'ไม่พบเควสต์',
    clearFilters: 'ล้างตัวกรอง',
    errorTitle: 'ไม่สามารถโหลดกระดานเควสต์ได้',
    errorDescription: 'โหลดเควสต์ที่พร้อมใช้งานไม่สำเร็จ ลองอีกครั้ง',
    retry: 'ลองอีกครั้ง',
    retrySuccess: 'รีเฟรชกระดานเควสต์แล้ว',
    loading: 'กำลังโหลดเควสต์',
    resultsLabel: 'ผลลัพธ์กระดานเควสต์',
    stateFull: 'เควสต์เต็มแล้ว',
    stateClosed: 'ปิดรับสมัครแล้ว',
    online: 'ออนไลน์',
    onCampus: 'ในมหาวิทยาลัย',
    today: 'วันนี้',
    within3Days: 'ภายใน 3 วัน',
    within7Days: 'ภายใน 7 วัน',
    newest: 'ใหม่ล่าสุด',
    deadlineSoonest: 'กำหนดส่งใกล้ที่สุด',
    rewardHighest: 'ค่าตอบแทนสูงสุด',
    back: 'ย้อนกลับ',
    details: 'รายละเอียดเควสต์',
    viewDetails: 'ดูรายละเอียด',
    creator: 'โพสต์โดย',
    messageOwner: 'แชทถามรายละเอียดกับผู้ว่าจ้าง',
    messageOwnerShort: 'แชทผู้ว่าจ้าง',
    messageOwnerLoading: 'กำลังเปิดแชท…',
    messageOwnerError: 'ไม่สามารถเปิดแชทกับผู้ว่าจ้างได้ ลองอีกครั้ง',
    requirements: 'รายละเอียดที่ต้องทำ',
    description: 'คำอธิบาย',
    completionCriteria: 'เกณฑ์การเสร็จงาน',
    proofRequired: 'หลักฐานการทำงาน',
    required: 'จำเป็นต้องมี',
    optional: 'ไม่บังคับ',
    notNeeded: 'ไม่ต้องมี',
    candidateMode: 'รูปแบบการคัดเลือก',
    candidate: 'คัดเลือก',
    firstCome: 'มาก่อนได้ก่อน',
    reviewCandidates: 'ตรวจสอบผู้สมัคร',
    applyForReview: 'สมัครเพื่อรอการคัดเลือก',
    participation: 'การเข้าร่วม',
    participants: 'ผู้เข้าร่วม',
    singlePerson: 'คนเดียว',
    team: 'ทีม',
    applyNow: 'สมัครเลย',
    joinNow: 'เข้าร่วมเควสต์',
    editPost: 'แก้ไขโพสต์',
    leaveQuest: 'ออกจากเควสต์',
    leaveQuestDescription: 'คุณจะออกจากเควสต์นี้และเสียสิทธิ์ที่ได้รับการยืนยันแล้ว',
    withdrawApplication: 'ถอนใบสมัคร',
    withdrawApplicationDescription: 'ใบสมัครของคุณจะถูกถอน และจะไม่ถูกพิจารณาเข้าร่วมเควสต์นี้อีก',
    leftQuest: 'ออกจากเควสต์แล้ว',
    leftQuestDescription: 'เควสต์นี้ถูกนำออกจากรายการเควสต์ที่คุณเข้าร่วมแล้ว',
    historyQuest: 'ประวัติเควสต์',
    historyQuestDescription: 'เควสต์นี้อยู่ในประวัติของคุณและไม่มีการดำเนินการที่ใช้งานอยู่',
    postOwnerView: 'โพสต์เควสต์ของคุณ',
    postOwnerViewDescription: 'จัดการเควสต์นี้ได้จากหน้านี้ แก้ไขโพสต์หรือดูผู้สมัครได้จาก MyQuest',
    confirmApplicationTitle: 'ยืนยันการสมัคร',
    confirmParticipationTitle: 'ยืนยันการเข้าร่วม',
    confirmApplicationDescription: 'คุณกำลังสมัครเควสต์นี้ ตรวจสอบค่าตอบแทนและกำหนดส่งก่อนดำเนินการต่อ',
    confirmParticipationDescription: 'คุณกำลังเข้าร่วมเควสต์นี้ ตรวจสอบค่าตอบแทนและกำหนดการก่อนดำเนินการต่อ',
    confirmApplication: 'ยืนยันการสมัคร',
    confirmParticipation: 'ยืนยันการเข้าร่วม',
    notYet: 'ไว้ก่อน',
    applicationAccepted: 'สมัครสำเร็จ',
    participationConfirmed: 'ยืนยันการเข้าร่วมแล้ว',
    applicationPending: 'รอตรวจสอบการสมัคร',
    applicationAcceptedDescription: 'คุณได้รับการยืนยันเข้าร่วมแล้ว เก็บรายละเอียดเควสต์นี้ไว้ดูภายหลัง',
    applicationPendingDescription: 'เจ้าของเควสต์จะตรวจสอบใบสมัครของคุณ',
    viewMyQuests: 'ดูในเควสต์ของฉัน',
    firstComeDescription: 'เข้าร่วมได้ทันทีเมื่อยังมีที่ว่าง',
    reviewCandidatesDescription: 'เจ้าของเควสต์จะตรวจสอบใบสมัครก่อนเลือกผู้เข้าร่วม',
    proofRequiredDescription: 'คุณต้องส่งหลักฐานการทำงานเมื่อทำเควสต์เสร็จ',
    proofOptionalDescription: 'คุณสามารถส่งหลักฐานการทำงานเมื่อทำเควสต์เสร็จได้',
    proofNotNeededDescription: 'ไม่จำเป็นต้องส่งหลักฐานการทำงาน',
    questFull: 'เควสต์เต็มแล้ว',
    applicationsClosed: 'ปิดรับสมัครแล้ว',
    unavailableApplication: 'เควสต์นี้ไม่เปิดรับสมัครแล้ว',
    questNotFound: 'ไม่พบเควสต์',
    questNotFoundDescription: 'ไม่มีเควสต์นี้หรือไม่พร้อมให้ดูรายละเอียดแล้ว',
    statusLabel: (status) => ({
      QUEST_DRAFT: 'ฉบับร่าง', QUEST_OPEN: 'เปิดรับผู้เข้าร่วม', QUEST_AWAITING_CONSENT: 'รอความยินยอมจากผู้ทำงาน', QUEST_ASSIGNED: 'มอบหมายแล้ว',
      QUEST_IN_PROGRESS: 'กำลังทำงาน', QUEST_SUBMITTED: 'ส่งหลักฐานแล้ว', QUEST_APPROVED: 'อนุมัติแล้ว', QUEST_REWORK: 'ขอแก้ไขหลักฐาน',
      QUEST_COMPLETED: 'เสร็จสิ้น', QUEST_CANCELLED: 'ยกเลิกแล้ว', QUEST_DISPUTED: 'อยู่ระหว่างข้อพิพาท', QUEST_HIDDEN: 'ซ่อนอยู่',
      TEAM_FORMING: 'กำลังรวมทีม', TEAM_SUBMITTED: 'ส่งทีมแล้ว', TEAM_SELECTED: 'เลือกทีมแล้ว', TEAM_REJECTED: 'ไม่ผ่านการเลือก',
      INVITATION_PENDING: 'รอตอบรับคำเชิญ', INVITATION_ACCEPTED: 'ตอบรับคำเชิญแล้ว', INVITATION_DECLINED: 'ปฏิเสธคำเชิญแล้ว', INVITATION_EXPIRED: 'คำเชิญหมดอายุ', INVITATION_REVOKED: 'เพิกถอนคำเชิญแล้ว',
      APPLICATION_APPLIED: 'สมัครแล้ว', APPLICATION_SELECTED: 'ได้รับเลือก', APPLICATION_REJECTED: 'ไม่ผ่านการเลือก', APPLICATION_WITHDRAWN: 'ถอนใบสมัครแล้ว',
      ASSIGNMENT_ACTIVE: 'กำลังทำงาน', ASSIGNMENT_COMPLETED: 'เสร็จสิ้น', ASSIGNMENT_INCOMPLETE: 'ไม่สมบูรณ์', ASSIGNMENT_CANCELLED: 'ยกเลิกแล้ว',
      PROOF_PENDING: 'รอตรวจสอบหลักฐาน', PROOF_APPROVED: 'อนุมัติหลักฐานแล้ว', PROOF_REJECTED: 'หลักฐานถูกปฏิเสธ', PROOF_AUTO_APPROVED: 'อนุมัติหลักฐานอัตโนมัติ',
      EDIT_REQUEST_PENDING: 'รอความยินยอม', EDIT_REQUEST_APPROVED: 'อนุมัติการแก้ไขแล้ว', EDIT_REQUEST_REJECTED: 'ปฏิเสธการแก้ไขแล้ว',
      EDIT_RESPONSE_APPROVED: 'อนุมัติแล้ว', EDIT_RESPONSE_REJECTED: 'ปฏิเสธแล้ว',
    }[status] ?? status),
    consentBannerTitle: 'ต้องขอความยินยอมจากผู้ทำงาน',
    consentBannerDescription: (approved, required) => `ผู้ทำงานอนุมัติการแก้ไขแล้ว ${approved} จาก ${required} คน`,
    consentCountdown: 'เวลาที่เหลือสำหรับการยินยอม',
    approveEdit: 'อนุมัติการแก้ไข',
    rejectEdit: 'ปฏิเสธการแก้ไข',
    teamBannerTitle: 'ทีมผู้สมัคร',
    teamLeader: 'หัวหน้าทีม',
    teamMemberCount: (members, required) => `${members}/${required} คน`,
    createTeam: 'สร้างทีม',
    inviteWorker: 'เชิญผู้ทำงาน',
    submitTeam: 'ส่งทีมเพื่อพิจารณา',
    acceptInvitation: 'ตอบรับคำเชิญ',
    declineInvitation: 'ปฏิเสธคำเชิญ',
    revokeInvitation: 'เพิกถอนคำเชิญ',
    applicationBannerTitle: 'ใบสมัครผู้สมัคร',
    applicationCount: (count) => `${count} ใบสมัคร`,
    selectCandidate: 'เลือกผู้สมัคร',
    proofBannerTitle: 'หลักฐานและการตรวจสอบ',
    proofPending: 'หลักฐานกำลังรอผู้ว่าจ้างตรวจสอบ',
    proofRejected: 'หลักฐานต้องแก้ไขใหม่',
    reworkRemaining: (remaining, limit) => `เหลือสิทธิ์แก้ไข ${remaining} จาก ${limit} ครั้ง`,
    submitProof: 'ส่งหลักฐาน',
    confirmCompletion: 'ยืนยันการเสร็จสิ้น',
    submitRework: 'ส่งหลักฐานที่แก้ไข',
    approveProof: 'อนุมัติหลักฐาน',
    rejectProof: 'ขอให้แก้ไขใหม่',
    disputeBannerTitle: 'ข้อพิพาทเควสต์',
    disputeDescription: 'เควสต์นี้รอการแก้ไขข้อพิพาทจากผู้มีอำนาจ',
    openDispute: 'เปิดข้อพิพาท',
    resolveDispute: 'แก้ไขข้อพิพาท',
    completeQuest: 'ทำเควสต์ให้เสร็จสิ้น',
    cancelQuest: 'ยกเลิกเควสต์',
    publishQuest: 'เผยแพร่เควสต์',
    escrowRewardPool: 'เงินรางวัลรวม',
    escrowPlatformFee: 'ค่าธรรมเนียมแพลตฟอร์ม',
    escrowTotal: 'ยอด Escrow ที่ต้องใช้',
    terminalBannerTitle: 'ปิดเควสต์แล้ว',
    terminalDescription: 'เควสต์นี้อยู่ในสถานะสิ้นสุด ไม่สามารถเปิดใหม่หรือรับผู้เข้าร่วมเพิ่มได้',
  },
};
