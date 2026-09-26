import type { SupportedLocale } from "@/locales/locale";

export interface WorkerHomeMessages {
  title: string;
  subtitle: string;
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
  viewWork: string;
  reward: string;
  perPerson: string;
  online: string;
  errorTitle: string;
  errorDescription: string;
  boardErrorTitle: string;
  assignmentsErrorDescription: string;
  assignmentsError: string;
  tagsUnavailable: string;
  errorRetry: string;
  refreshing: string;
  statusActive: string;
  statusCompleted: string;
  statusIncomplete: string;
  statusCancelled: string;
  searchPlaceholder: string;
  clearSearch: string;
  filter: string;
  tagFilter: (tag: string) => string;
  tagAll: string;
  workingInProgress: string;
  tapToOpenWork: string;
  workTitle: string;
  questState: string;
  stateAssigned: string;
  stateInProgress: string;
  workingNow: string;
  timeElapsed: string;
  waitingForHirer: string;
}

export const workerHomeMessages: Record<SupportedLocale, WorkerHomeMessages> = {
  en: {
    title: "Worker Workspace",
    subtitle: "Active assignments & available quests",
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
    viewWork: "Open Work",
    reward: "Reward",
    perPerson: "/ person",
    online: "Online",
    errorTitle: "Couldn't load worker workspace data",
    errorDescription: "Check your connection, then try again.",
    boardErrorTitle: "Couldn't load available quests",
    assignmentsError: "Couldn't load active assignments",
    assignmentsErrorDescription: "Try again to load your active work.",
    tagsUnavailable: "Tags unavailable",
    errorRetry: "Try again",
    refreshing: "Refreshing...",
    statusActive: "In Progress",
    statusCompleted: "Completed",
    statusIncomplete: "Incomplete",
    statusCancelled: "Cancelled",
    searchPlaceholder: "Search quests...",
    clearSearch: "Clear search",
    filter: "Filter",
    tagAll: "All",
    tagFilter: (tag) => `${tag} filter`,
    workingInProgress: "Working in progress",
    tapToOpenWork: "Tap to view work",
    workTitle: "Work",
    questState: "Quest State",
    stateAssigned: "Waiting to start",
    stateInProgress: "In Progress",
    workingNow: "Working Now",
    timeElapsed: "Time elapsed",
    waitingForHirer: "Waiting for Hirer",
  },
  th: {
    title: "พื้นที่ทำงาน: ผู้รับงาน",
    subtitle: "งานที่กำลังทำและเควสต์ที่เปิดรับสมัคร",
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
    viewWork: "เปิดห้องทำงาน",
    reward: "ค่าตอบแทน",
    perPerson: "/ คน",
    online: "ออนไลน์",
    errorTitle: "ไม่สามารถโหลดข้อมูลพื้นที่ทำงานได้",
    errorDescription: "ตรวจสอบการเชื่อมต่อ แล้วลองอีกครั้ง",
    boardErrorTitle: "ไม่สามารถโหลดเควสต์ที่เปิดรับสมัครได้",
    assignmentsError: "ไม่สามารถโหลดงานที่กำลังดำเนินการได้",
    assignmentsErrorDescription: "ลองอีกครั้งเพื่อโหลดงานที่กำลังทำอยู่",
    tagsUnavailable: "ไม่สามารถโหลดแท็กได้",
    errorRetry: "ลองอีกครั้ง",
    refreshing: "กำลังอัปเดต...",
    statusActive: "กำลังทำ",
    statusCompleted: "สำเร็จ",
    statusIncomplete: "ไม่สำเร็จ",
    statusCancelled: "ยกเลิก",
    searchPlaceholder: "ค้นหาเควสต์...",
    clearSearch: "ล้างการค้นหา",
    filter: "ตัวกรอง",
    tagAll: "ทั้งหมด",
    tagFilter: (tag) => `ตัวกรอง ${tag}`,
    workingInProgress: "กำลังทำงานอยู่",
    tapToOpenWork: "แตะเพื่อดูงาน",
    workTitle: "งาน",
    questState: "สถานะเควสต์",
    stateAssigned: "รอเริ่มเควสต์",
    stateInProgress: "กำลังทำ",
    workingNow: "กำลังทำงานอยู่",
    timeElapsed: "เวลาที่ผ่านไป",
    waitingForHirer: "รอผู้ว่าจ้างตอบรับ",
  },
};
