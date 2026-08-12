import type { SupportedLocale } from './LocaleProvider';

export interface QuestBoardMessages {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  clearSearch: string;
  filter: string;
  sort: string;
  filtersTitle: string;
  sortTitle: string;
  applyFilters: string;
  clearAll: string;
  selectedFilters: (count: number) => string;
  close: string;
  categories: string;
  reward: string;
  deadline: string;
  schedule: string;
  modeLabel: string;
  selectionLabel: string;
  location: string;
  spots: string;
  endingSoon: string;
  perPerson: string;
  noQuests: string;
  noMatches: string;
  clearFilters: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  loading: string;
  previewState: string;
  previewStateTitle: string;
  statePopulated: string;
  stateLoading: string;
  stateEmpty: string;
  stateError: string;
  statePending: string;
  stateAccepted: string;
  stateFull: string;
  stateClosed: string;
  online: string;
  onCampus: string;
  under500: string;
  between500And1000: string;
  over1000: string;
  today: string;
  within3Days: string;
  within7Days: string;
  recommended: string;
  newest: string;
  deadlineSoonest: string;
  rewardHighest: string;
  technology: string;
  design: string;
  tutoring: string;
  campusLife: string;
  back: string;
  details: string;
  detailAction: string;
  takeQuest: string;
  creator: string;
  postedBy: string;
  requirements: string;
  description: string;
  completionCriteria: string;
  proofRequired: string;
  required: string;
  optional: string;
  notNeeded: string;
  candidateMode: string;
  firstCome: string;
  reviewCandidates: string;
  participation: string;
  singlePerson: string;
  team: string;
  applyNow: string;
  confirmApplicationTitle: string;
  confirmApplicationDescription: string;
  confirmApplication: string;
  notYet: string;
  applicationAccepted: string;
  applicationPending: string;
  viewMyQuests: string;
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
    filter: 'Filter by',
    sort: 'Sort by',
    filtersTitle: 'Filter Quests',
    sortTitle: 'Sort Quests',
    applyFilters: 'Apply filters',
    clearAll: 'Clear all',
    selectedFilters: (count) => count === 0 ? 'No filters selected' : `${count} filter${count === 1 ? '' : 's'} selected`,
    close: 'Close',
    categories: 'Category',
    reward: 'Reward',
    deadline: 'Deadline',
    schedule: 'Schedule',
    modeLabel: 'Mode',
    selectionLabel: 'Selection',
    location: 'Where',
    spots: 'spots',
    endingSoon: 'Ending soon',
    perPerson: '/ person',
    noQuests: 'No quests available yet.',
    noMatches: 'No quests found',
    clearFilters: 'Clear filters',
    errorTitle: 'Quest Board unavailable',
    errorDescription: 'We could not load available Quests. Try again.',
    retry: 'Try again',
    loading: 'Loading Quests',
    previewState: 'Preview state',
    previewStateTitle: 'Preview Quest Board state',
    statePopulated: 'Populated',
    stateLoading: 'Loading',
    stateEmpty: 'Empty Board',
    stateError: 'Error',
    statePending: 'Application pending',
    stateAccepted: 'Application accepted',
    stateFull: 'Quest full',
    stateClosed: 'Applications closed',
    online: 'Online',
    onCampus: 'On campus',
    under500: 'Under ฿500',
    between500And1000: '฿500–฿1,000',
    over1000: 'Over ฿1,000',
    today: 'Today',
    within3Days: 'Within 3 days',
    within7Days: 'Within 7 days',
    recommended: 'Recommended',
    newest: 'Newest',
    deadlineSoonest: 'Deadline soonest',
    rewardHighest: 'Reward highest',
    technology: 'Technology',
    design: 'Design & creative',
    tutoring: 'Tutoring',
    campusLife: 'Campus life',
    back: 'Go back',
    details: 'Quest details',
    detailAction: 'Detail',
    takeQuest: 'Take Quest',
    creator: 'Posted by',
    postedBy: 'Posted by',
    requirements: 'Requirements',
    description: 'Description',
    completionCriteria: 'Completion criteria',
    proofRequired: 'Proof of completion',
    required: 'Required',
    optional: 'Optional',
    notNeeded: 'Not needed',
    candidateMode: 'Candidate mode',
    firstCome: 'First-come, first-served',
    reviewCandidates: 'Review candidates',
    participation: 'Participation',
    singlePerson: 'Single person',
    team: 'Team',
    applyNow: 'Apply now',
    confirmApplicationTitle: 'Confirm your application',
    confirmApplicationDescription: 'You are applying for this Quest. Review the reward and deadline before continuing.',
    confirmApplication: 'Confirm application',
    notYet: 'Not yet',
    applicationAccepted: 'Application accepted',
    applicationPending: 'Application pending',
    viewMyQuests: 'View in My Quests',
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
    filter: 'กรองโดย',
    sort: 'เรียงโดย',
    filtersTitle: 'กรองเควสต์',
    sortTitle: 'เรียงเควสต์',
    applyFilters: 'ใช้ตัวกรอง',
    clearAll: 'ล้างทั้งหมด',
    selectedFilters: (count) => count === 0 ? 'ยังไม่ได้เลือกตัวกรอง' : `เลือกตัวกรองแล้ว ${count} รายการ`,
    close: 'ปิด',
    categories: 'หมวดหมู่',
    reward: 'ค่าตอบแทน',
    deadline: 'กำหนดส่ง',
    schedule: 'เวลา',
    modeLabel: 'รูปแบบการเข้าร่วม',
    selectionLabel: 'การคัดเลือก',
    location: 'สถานที่',
    spots: 'ที่ว่าง',
    endingSoon: 'ใกล้ปิดรับสมัคร',
    perPerson: '/ คน',
    noQuests: 'ยังไม่มีเควสต์ที่พร้อมให้ค้นหา',
    noMatches: 'ไม่พบเควสต์',
    clearFilters: 'ล้างตัวกรอง',
    errorTitle: 'ไม่สามารถโหลดกระดานเควสต์ได้',
    errorDescription: 'โหลดเควสต์ที่พร้อมใช้งานไม่สำเร็จ ลองอีกครั้ง',
    retry: 'ลองอีกครั้ง',
    loading: 'กำลังโหลดเควสต์',
    previewState: 'สถานะตัวอย่าง',
    previewStateTitle: 'ดูสถานะตัวอย่างของกระดานเควสต์',
    statePopulated: 'มีเควสต์',
    stateLoading: 'กำลังโหลด',
    stateEmpty: 'กระดานว่าง',
    stateError: 'ข้อผิดพลาด',
    statePending: 'รอตรวจสอบการสมัคร',
    stateAccepted: 'สมัครสำเร็จ',
    stateFull: 'เควสต์เต็มแล้ว',
    stateClosed: 'ปิดรับสมัครแล้ว',
    online: 'ออนไลน์',
    onCampus: 'ในมหาวิทยาลัย',
    under500: 'ต่ำกว่า ฿500',
    between500And1000: '฿500–฿1,000',
    over1000: 'มากกว่า ฿1,000',
    today: 'วันนี้',
    within3Days: 'ภายใน 3 วัน',
    within7Days: 'ภายใน 7 วัน',
    recommended: 'แนะนำ',
    newest: 'ใหม่ล่าสุด',
    deadlineSoonest: 'กำหนดส่งใกล้ที่สุด',
    rewardHighest: 'ค่าตอบแทนสูงสุด',
    technology: 'เทคโนโลยี',
    design: 'การออกแบบและสร้างสรรค์',
    tutoring: 'การสอน',
    campusLife: 'ชีวิตในมหาวิทยาลัย',
    back: 'ย้อนกลับ',
    details: 'รายละเอียดเควสต์',
    detailAction: 'รายละเอียด',
    takeQuest: 'รับเควสต์',
    creator: 'โพสต์โดย',
    postedBy: 'โพสต์โดย',
    requirements: 'รายละเอียดที่ต้องทำ',
    description: 'คำอธิบาย',
    completionCriteria: 'เกณฑ์การเสร็จงาน',
    proofRequired: 'หลักฐานการทำงาน',
    required: 'จำเป็นต้องมี',
    optional: 'ไม่บังคับ',
    notNeeded: 'ไม่ต้องมี',
    candidateMode: 'รูปแบบการคัดเลือก',
    firstCome: 'มาก่อนได้ก่อน',
    reviewCandidates: 'ตรวจสอบผู้สมัคร',
    participation: 'การเข้าร่วม',
    singlePerson: 'คนเดียว',
    team: 'ทีม',
    applyNow: 'สมัครเลย',
    confirmApplicationTitle: 'ยืนยันการสมัคร',
    confirmApplicationDescription: 'คุณกำลังสมัครเควสต์นี้ ตรวจสอบค่าตอบแทนและกำหนดส่งก่อนดำเนินการต่อ',
    confirmApplication: 'ยืนยันการสมัคร',
    notYet: 'ไว้ก่อน',
    applicationAccepted: 'สมัครสำเร็จ',
    applicationPending: 'รอตรวจสอบการสมัคร',
    viewMyQuests: 'ดูในเควสต์ของฉัน',
    questFull: 'เควสต์เต็มแล้ว',
    applicationsClosed: 'ปิดรับสมัครแล้ว',
    unavailableApplication: 'เควสต์นี้ไม่เปิดรับสมัครแล้ว',
    questNotFound: 'ไม่พบเควสต์',
    questNotFoundDescription: 'ไม่มีเควสต์นี้หรือไม่พร้อมให้ดูรายละเอียดแล้ว',
  },
};
