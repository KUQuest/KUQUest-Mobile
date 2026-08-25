import type { SupportedLocale } from './LocaleProvider';

export interface QuestBoardMessages {
  title: string;
  subtitle: string;
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
}

export const questBoardMessages: Record<SupportedLocale, QuestBoardMessages> = {
  en: {
    title: 'Quest Board',
    subtitle: 'Find a Quest that fits your skills and time.',
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
  },
  th: {
    title: 'กระดานเควสต์',
    subtitle: 'ค้นหาเควสต์ที่เหมาะกับทักษะและเวลาของคุณ',
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
  },
};
