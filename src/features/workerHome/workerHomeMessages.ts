import type { SupportedLocale } from "@/locales/LocaleProvider";

export interface WorkerHomeMessages {
  title: string;
  subtitle: string;
  badge: string;
  switchToHirer: string;
  activeJobs: string;
  completedJobs: string;
  workManagementShortcut: string;
  activeSectionTitle: string;
  activeSectionSubtitle: string;
  noActiveAssignmentsTitle: string;
  noActiveAssignmentsDesc: string;
  exploreQuestsAction: string;
  openWorkManagement: string;
  feedSectionTitle: string;
  feedSectionSubtitle: string;
  noAvailableQuestsTitle: string;
  noAvailableQuestsDesc: string;
  viewDetails: string;
  viewWork: string;
  reward: string;
  perPerson: string;
  online: string;
  errorTitle: string;
  errorRetry: string;
  refreshing: string;
  statusActive: string;
  statusCompleted: string;
  statusIncomplete: string;
  statusCancelled: string;
  searchPlaceholder: string;
  filter: string;
  tagAll: string;
  workingInProgress: string;
  tapToOpenWork: string;
  workTitle: string;
  uploadImagePrompt: string;
  changeImage: string;
  removeImage: string;
  proofDescriptionPlaceholder: string;
  submitWork: string;
  submitting: string;
  proofSubmittedSuccess: string;
  proofNotRequiredNote: string;
  completeQuestDirectly: string;
  confirmCompleteTitle: string;
  confirmCompleteDesc: string;
  imageRequiredAlert: string;
  currentQuest: string;
  questState: string;
  stateAssigned: string;
  stateInProgress: string;
  stateCompleted: string;
  stateCancelled: string;
  stateFailed: string;
  stageAssigned: string;
  stageInProgress: string;
  stageReview: string;
  proofRequiredLabel: string;
  proofNotRequiredLabel: string;
  submitLockedUntilStart: string;
  submitUnavailable: string;
  submissionPending: string;
  appliedTab: string;
  historyTab: string;
  workingNow: string;
  timeElapsed: string;
  noWorkPromptTitle: string;
  noWorkPromptDesc: string;
  findQuestsAction: string;
  noAppliedQuests: string;
  noHistoryQuests: string;
  waitingForHirer: string;
  questDetailsUnavailable: string;
}

export const workerHomeMessages: Record<SupportedLocale, WorkerHomeMessages> = {
  en: {
    title: "Worker Workspace",
    subtitle: "Active assignments & available quests",
    badge: "Worker",
    switchToHirer: "Switch to Hirer",
    activeJobs: "Active Work",
    completedJobs: "Completed",
    workManagementShortcut: "Work Manager",
    activeSectionTitle: "Active Assignments",
    activeSectionSubtitle: "Work on your ongoing commitments",
    noActiveAssignmentsTitle: "No active assignments",
    noActiveAssignmentsDesc:
      "Apply for quests on the board or track your applications in Work Management.",
    exploreQuestsAction: "Explore Quests",
    openWorkManagement: "Go to Work Management",
    feedSectionTitle: "Available Quests",
    feedSectionSubtitle: "Quests open for application on campus",
    noAvailableQuestsTitle: "No open quests right now",
    noAvailableQuestsDesc:
      "Check back later for new opportunities from students and faculty.",
    viewDetails: "View Details",
    viewWork: "Open Work",
    reward: "Reward",
    perPerson: "/ person",
    online: "Online",
    errorTitle: "Couldn't load worker workspace data",
    errorRetry: "Try Again",
    refreshing: "Refreshing...",
    statusActive: "In Progress",
    statusCompleted: "Completed",
    statusIncomplete: "Incomplete",
    statusCancelled: "Cancelled",
    searchPlaceholder: "Search quests...",
    filter: "Filter",
    tagAll: "All",
    workingInProgress: "Working in progress",
    tapToOpenWork: "Tap to view work",
    workTitle: "Work",
    uploadImagePrompt: "+ Image upload",
    changeImage: "Change Image",
    removeImage: "Remove",
    proofDescriptionPlaceholder:
      "Add notes or details about the work (optional)...",
    submitWork: "Submit",
    submitting: "Submitting...",
    proofSubmittedSuccess: "Work proof submitted! Hirer has been notified.",
    proofNotRequiredNote: "This quest does not require proof to complete.",
    completeQuestDirectly: "Complete Quest",
    confirmCompleteTitle: "End Quest?",
    confirmCompleteDesc: "Confirm that you have completed this quest.",
    imageRequiredAlert: "Please select an image before submitting.",
    currentQuest: "Current Quest",
    questState: "Quest State",
    stateAssigned: "Waiting to start",
    stateInProgress: "In Progress",
    stateCompleted: "Completed",
    stateCancelled: "Cancelled",
    stateFailed: "Failed",
    stageAssigned: "Assigned",
    stageInProgress: "In Progress",
    stageReview: "Review / Done",
    proofRequiredLabel: "Proof required",
    proofNotRequiredLabel: "No proof required",
    submitLockedUntilStart: "Submit unlocks when the Quest starts.",
    submitUnavailable: "Submission is unavailable for this Quest.",
    submissionPending: "Submitted — waiting for Hirer review.",
    appliedTab: "Applied Quest",
    historyTab: "History",
    workingNow: "Working Now",
    timeElapsed: "Time elapsed",
    noWorkPromptTitle: "No Active Work Yet",
    noWorkPromptDesc:
      "Go find quests you like on the Home page and start earning!",
    findQuestsAction: "Find Quests",
    noAppliedQuests: "No pending applications right now.",
    noHistoryQuests: "No completed or past quests yet.",
    questDetailsUnavailable: "Quest details unavailable",
    waitingForHirer: "Waiting for Hirer",
  },
  th: {
    title: "พื้นที่ทำงาน: ผู้รับงาน",
    subtitle: "งานที่กำลังทำและเควสต์ที่เปิดรับสมัคร",
    badge: "ผู้รับงาน",
    switchToHirer: "สลับไปผู้จ้างวาน",
    activeJobs: "งานที่กำลังทำ",
    completedJobs: "งานที่สำเร็จ",
    workManagementShortcut: "จัดการงาน",
    activeSectionTitle: "งานที่กำลังดำเนินงาน",
    activeSectionSubtitle: "ติดตามและส่งมอบงานที่คุณได้รับมอบหมาย",
    noActiveAssignmentsTitle: "ยังไม่มีงานที่กำลังทำอยู่",
    noActiveAssignmentsDesc:
      "ค้นหาเควสต์ใหม่ได้ที่กระดานด้านล่าง หรือติดตามสถานะใบสมัครในหน้าจัดการงาน",
    exploreQuestsAction: "ดูกระดานเควสต์",
    openWorkManagement: "ไปที่หน้าจัดการงาน",
    feedSectionTitle: "เควสต์ที่เปิดรับสมัคร",
    feedSectionSubtitle: "เควสต์ใหม่บนกระดานที่พร้อมให้คุณรับงาน",
    noAvailableQuestsTitle: "ไม่มีเควสต์เปิดใหม่ในขณะนี้",
    noAvailableQuestsDesc:
      "กลับมาตรวจสอบใหม่ในภายหลังเมื่อมีเควสต์ใหม่จากเพื่อนนิสิตหรืออาจารย์",
    viewDetails: "ดูรายละเอียด",
    viewWork: "เปิดห้องทำงาน",
    reward: "ค่าตอบแทน",
    perPerson: "/ คน",
    online: "ออนไลน์",
    errorTitle: "ไม่สามารถโหลดข้อมูลพื้นที่ทำงานได้",
    errorRetry: "ลองใหม่",
    refreshing: "กำลังอัปเดต...",
    statusActive: "กำลังทำ",
    statusCompleted: "สำเร็จ",
    statusIncomplete: "ไม่สำเร็จ",
    statusCancelled: "ยกเลิก",
    searchPlaceholder: "ค้นหาเควสต์...",
    filter: "ตัวกรอง",
    tagAll: "ทั้งหมด",
    workingInProgress: "กำลังทำงานอยู่",
    tapToOpenWork: "แตะเพื่อดูงาน",
    workTitle: "งาน",
    uploadImagePrompt: "+ อัปโหลดรูปภาพ",
    changeImage: "เปลี่ยนรูป",
    removeImage: "ลบ",
    proofDescriptionPlaceholder:
      "ระบุรายละเอียดงานที่ทำเสร็จสิ้น (ไม่บังคับ)...",
    submitWork: "ส่งงาน",
    submitting: "กำลังส่งงาน...",
    proofSubmittedSuccess: "ส่งมอบงานเรียบร้อยแล้ว! แจ้งเตือนผู้ว่าจ้างแล้ว",
    proofNotRequiredNote: "เควสต์นี้ไม่จำเป็นต้องส่งรูปหลักฐาน",
    completeQuestDirectly: "เสร็จสิ้นงานทันที",
    confirmCompleteTitle: "เสร็จสิ้นเควสต์?",
    confirmCompleteDesc: "ยืนยันว่าคุณได้ทำงานเสร็จสิ้นแล้ว เควสต์จะจบลงทันที",
    imageRequiredAlert: "โปรดเลือกรูปภาพหลักฐานก่อนส่งงาน",
    currentQuest: "เควสต์ปัจจุบัน",
    questState: "สถานะเควสต์",
    stateAssigned: "รอเริ่มเควสต์",
    stateInProgress: "กำลังทำ",
    stateCompleted: "เสร็จสิ้น",
    stateCancelled: "ยกเลิก",
    stateFailed: "ไม่สำเร็จ",
    stageAssigned: "มอบหมายแล้ว",
    stageInProgress: "กำลังทำ",
    stageReview: "ตรวจงาน / เสร็จสิ้น",
    proofRequiredLabel: "ต้องส่งหลักฐาน",
    proofNotRequiredLabel: "ไม่ต้องส่งหลักฐาน",
    submitLockedUntilStart: "ปุ่มส่งงานจะใช้งานได้เมื่อเควสต์เริ่ม",
    submitUnavailable: "เควสต์นี้ไม่เปิดให้ส่งงานแล้ว",
    submissionPending: "ส่งงานแล้ว — รอผู้ว่าจ้างตรวจรับ",
    appliedTab: "เควสต์ที่สมัครไว้",
    historyTab: "ประวัติเควสต์",
    workingNow: "กำลังทำงานอยู่",
    timeElapsed: "เวลาที่ผ่านไป",
    noWorkPromptTitle: "ยังไม่มีงานที่กำลังทำอยู่",
    noWorkPromptDesc: "ไปค้นหาเควสต์ที่คุณสนใจได้ที่หน้าแรกเพื่อเริ่มรับงาน!",
    findQuestsAction: "ไปค้นหาเควสต์",
    noAppliedQuests: "ไม่มีใบสมัครที่กำลังรอการตอบรับในขณะนี้",
    noHistoryQuests: "ยังไม่มีประวัติเควสต์ที่ผ่านมา",
    questDetailsUnavailable: "ไม่พบรายละเอียดเควสต์",
    waitingForHirer: "รอผู้ว่าจ้างตอบรับ",
  },
};
