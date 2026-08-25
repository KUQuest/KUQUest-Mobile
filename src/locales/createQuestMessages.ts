import type { SupportedLocale } from './LocaleProvider';

export interface CreateQuestMessages {
  title: string;
  step: (current: number, total: number) => string;
  details: string;
  schedule: string;
  questSummary: string;
  questDetails: string;
  questDetailsDescription: string;
  scheduleLocation: string;
  scheduleLocationDescription: string;
  participantsReward: string;
  participantsRewardDescription: string;
  titleLabel: string;
  titlePlaceholder: string;
  questTag: string;
  chooseQuestTag: string;
  description: string;
  descriptionPlaceholder: string;
  completionCriteria: string;
  completionCriteriaPlaceholder: string;
  proofOfCompletion: string;
  proofPlaceholder: string;
  required: string;
  optional: string;
  notNeeded: string;
  startDate: string;
  deadline: string;
  startDateTime: string;
  deadlineDateTime: string;
  dateTimeHelper: string;
  dateDone: string;
  startTime: string;
  endTime: string;
  location: string;
  online: string;
  onlineQuest: string;
  onlineQuestHint: string;
  locationPlaceholder: string;
  locationError: string;
  images: string;
  addImages: string;
  changeImages: string;
  imagesOptional: string;
  questImage: (index: number) => string;
  removeImage: (index: number) => string;
  candidateMode: string;
  firstCome: string;
  reviewCandidates: string;
  firstComeHint: string;
  reviewCandidatesHint: string;
  singleFirstComeHint: string;
  singleCandidateHint: string;
  groupFirstComeHint: string;
  groupCandidateHint: string;
  participation: string;
  singlePerson: string;
  team: string;
  headcount: string;
  headcountPlaceholder: string;
  rewardPerPerson: string;
  rewardPlaceholder: string;
  rewardHelper: string;
  questSummaryLabel: string;
  singleHeadcountHint: string;
  back: string;
  next: string;
  saveDraft: string;
  savingDraft: string;
  publishQuest: string;
  publishingQuest: string;
  loadingDraft: string;
  savedDraftTitle: string;
  savedDraftDescription: string;
  publishedQuestTitle: string;
  publishedQuestDescription: string;
  createAnotherDraft: string;
  notSelected: string;
  onlineOrAgreed: string;
  noImages: string;
  selectedImages: (count: number) => string;
  discardTitle: string;
  discardDescription: string;
  discard: string;
  keepEditing: string;
  autosaveSaving: string;
  autosaveSaved: string;
  savePreview: string;
  savingPreview: string;
  viewQuestBoard: string;
  imageError: string;
  titleError: string;
  questTagError: string;
  descriptionError: string;
  completionCriteriaError: string;
  startDateError: string;
  startDatePastError: string;
  deadlineError: string;
  deadlineOrderError: string;
  startTimeError: string;
  endTimeError: string;
  timeOrderError: string;
  headcountError: string;
  rewardEmptyError: string;
  rewardFormatError: string;
  rewardBoundsError: (maximum: number) => string;
  summary: {
    title: string;
    questTag: string;
    description: string;
    completionCriteria: string;
    proof: string;
    schedule: string;
    location: string;
    images: string;
    candidateMode: string;
    participation: string;
    headcount: string;
    reward: string;
  };
}

export const createQuestMessages: Record<SupportedLocale, CreateQuestMessages> = {
  en: {
    title: 'Create Quest',
    step: (current, total) => `Step ${current} of ${total}`,
    details: 'Details',
    schedule: 'Schedule',
    questSummary: 'Summary',
    questDetails: 'Quest details',
    questDetailsDescription: 'Give people enough context to decide if this Quest is right for them.',
    scheduleLocation: 'Schedule & location',
    scheduleLocationDescription: 'Choose the work dates and time. Add a location, or mark it as online.',
    participantsReward: 'Participants & reward',
    participantsRewardDescription: 'Choose how people join and what each participant receives.',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Design a poster for the faculty fair',
    questTag: 'Quest Tag',
    chooseQuestTag: 'Choose a Quest Tag',
    description: 'Description',
    descriptionPlaceholder: 'What needs to be done and what should the result look like?',
    completionCriteria: 'Completion criteria',
    completionCriteriaPlaceholder: 'How will you know the Quest is complete?',
    proofOfCompletion: 'Proof of completion',
    proofPlaceholder: 'Choose proof requirement',
    required: 'Required',
    optional: 'Optional',
    notNeeded: 'Not needed',
    startDate: 'Start date',
    deadline: 'Deadline',
    startDateTime: 'Start date & time',
    deadlineDateTime: 'Deadline date & time',
    dateTimeHelper: 'Choose the date and time together.',
    dateDone: 'Done',
    startTime: 'Start time',
    endTime: 'End time',
    location: 'Location',
    online: 'Online',
    onlineQuest: 'This is an online Quest',
    onlineQuestHint: 'No physical location is needed.',
    locationPlaceholder: 'e.g. Faculty building or meeting point',
    locationError: 'Add a location for this Quest.',
    images: 'Images',
    addImages: 'Add images',
    changeImages: 'Add or change images',
    imagesOptional: 'Up to 3 photos · optional',
    questImage: (index) => `Quest image ${index}`,
    removeImage: (index) => `Remove Quest image ${index}`,
    candidateMode: 'Candidate mode',
    firstCome: 'First-come, first-served',
    reviewCandidates: 'Review candidates',
    firstComeHint: 'People join directly while places are available.',
    reviewCandidatesHint: 'You review applicants and choose who can join.',
    singleFirstComeHint: 'One person can join immediately while a place is available.',
    singleCandidateHint: 'Review individual applications before selecting one person.',
    groupFirstComeHint: 'People join independently in arrival order; no team is created.',
    groupCandidateHint: 'A Quest Team submits one proposal with a leader for your review.',
    participation: 'Participation',
    singlePerson: 'Single person',
    team: 'Team',
    headcount: 'Headcount',
    headcountPlaceholder: 'e.g. 3',
    rewardPerPerson: 'Reward per person',
    rewardPlaceholder: '0.00',
    rewardHelper: 'Paid to each accepted participant.',
    questSummaryLabel: 'Quest Summary',
    singleHeadcountHint: 'SINGLE always has one Worker.',
    back: 'Back',
    next: 'Next',
    saveDraft: 'Save draft',
    savingDraft: 'Saving draft…',
    publishQuest: 'Publish Quest',
    publishingQuest: 'Publishing Quest…',
    loadingDraft: 'Restoring your draft…',
    savedDraftTitle: 'Quest draft saved locally',
    savedDraftDescription: 'Your draft is stored securely on this device and is not visible on the Quest Board yet.',
    publishedQuestTitle: 'Quest preview saved locally',
    publishedQuestDescription: 'This development preview is stored on this device only. It has not been funded, sent to the API, or published to the Quest Board.',
    createAnotherDraft: 'Create another draft',
    notSelected: 'Not selected',
    onlineOrAgreed: 'Online or to be agreed',
    noImages: 'None',
    selectedImages: (count) => `${count} selected`,
    discardTitle: 'Leave this Quest?',
    discardDescription: 'Your draft is saved locally. Leave the form and continue later?',
    discard: 'Leave',
    keepEditing: 'Keep editing',
    autosaveSaving: 'Saving draft…',
    autosaveSaved: 'Draft saved',
    savePreview: 'Save Quest preview',
    savingPreview: 'Saving preview…',
    viewQuestBoard: 'Back to Quest Board',
    imageError: 'We could not add images. Check photo permissions and try again.',
    titleError: 'Add a short title so people know what they will do.',
    questTagError: 'Choose the Quest Tag that best matches this Quest.',
    descriptionError: 'Describe the work and expected outcome.',
    completionCriteriaError: 'Add the criteria for marking the Quest complete.',
    startDateError: 'Choose when the Quest can begin.',
    startDatePastError: 'Start date cannot be in the past.',
    deadlineError: 'Choose the final date for applications or work.',
    deadlineOrderError: 'Deadline must be on or after the start date.',
    startTimeError: 'Enter a start time, for example 09:00.',
    endTimeError: 'Enter an end time, for example 12:00.',
    timeOrderError: 'End time must be after the start time.',
    headcountError: 'Enter at least 1 participant.',
    rewardEmptyError: 'Enter a reward amount in THB.',
    rewardFormatError: 'Enter a valid amount in THB with up to 2 decimal places.',
    rewardBoundsError: (maximum) => `Reward must be between ฿0 and ฿${maximum.toLocaleString('en-US')}.`,
    summary: {
      title: 'Title', questTag: 'Quest Tag', description: 'Description', completionCriteria: 'Completion criteria',
      proof: 'Proof', schedule: 'Schedule', location: 'Location', images: 'Images', candidateMode: 'Candidate mode',
      participation: 'Participation', headcount: 'Headcount', reward: 'Reward',
    },
  },
  th: {
    title: 'สร้างเควสต์',
    step: (current, total) => `ขั้นตอนที่ ${current} จาก ${total}`,
    details: 'รายละเอียด',
    schedule: 'กำหนดการ',
    questSummary: 'สรุป',
    questDetails: 'รายละเอียดเควสต์',
    questDetailsDescription: 'ให้ข้อมูลเพียงพอเพื่อช่วยให้ผู้สนใจตัดสินใจว่าเควสต์นี้เหมาะกับพวกเขาหรือไม่',
    scheduleLocation: 'กำหนดการและสถานที่',
    scheduleLocationDescription: 'เลือกวันและเวลาทำงาน แล้วระบุสถานที่หรือเลือกว่างานออนไลน์',
    participantsReward: 'ผู้เข้าร่วมและค่าตอบแทน',
    participantsRewardDescription: 'เลือกรูปแบบการเข้าร่วมและสิ่งที่ผู้เข้าร่วมแต่ละคนจะได้รับ',
    titleLabel: 'ชื่อเควสต์',
    titlePlaceholder: 'เช่น ออกแบบโปสเตอร์สำหรับงานคณะ',
    questTag: 'แท็กเควสต์',
    chooseQuestTag: 'เลือกแท็กเควสต์',
    description: 'รายละเอียดงาน',
    descriptionPlaceholder: 'ต้องทำอะไร และผลลัพธ์ควรเป็นอย่างไร',
    completionCriteria: 'เกณฑ์การเสร็จงาน',
    completionCriteriaPlaceholder: 'จะรู้ได้อย่างไรว่าเควสต์เสร็จสมบูรณ์',
    proofOfCompletion: 'หลักฐานการเสร็จงาน',
    proofPlaceholder: 'เลือกข้อกำหนดหลักฐาน',
    required: 'จำเป็น',
    optional: 'ไม่บังคับ',
    notNeeded: 'ไม่ต้องมี',
    startDate: 'วันที่เริ่มต้น',
    deadline: 'กำหนดส่ง',
    startDateTime: 'วันที่และเวลาเริ่มต้น',
    deadlineDateTime: 'วันที่และเวลาสิ้นสุด',
    dateTimeHelper: 'เลือกวันและเวลาได้ในครั้งเดียว',
    dateDone: 'เสร็จสิ้น',
    startTime: 'เวลาเริ่มต้น',
    endTime: 'เวลาสิ้นสุด',
    location: 'สถานที่',
    online: 'ออนไลน์',
    onlineQuest: 'เควสต์นี้เป็นงานออนไลน์',
    onlineQuestHint: 'ไม่ต้องระบุสถานที่สำหรับงานออนไลน์',
    locationPlaceholder: 'เช่น อาคารคณะหรือจุดนัดพบ',
    locationError: 'เพิ่มสถานที่สำหรับเควสต์นี้',
    images: 'รูปภาพ',
    addImages: 'เพิ่มรูปภาพ',
    changeImages: 'เพิ่มหรือเปลี่ยนรูปภาพ',
    imagesOptional: 'ไม่เกิน 3 รูป · ไม่บังคับ',
    questImage: (index) => `รูปเควสต์ที่ ${index}`,
    removeImage: (index) => `ลบรูปเควสต์ที่ ${index}`,
    candidateMode: 'รูปแบบการคัดเลือก',
    firstCome: 'มาก่อนได้ก่อน',
    reviewCandidates: 'พิจารณาผู้สมัคร',
    firstComeHint: 'ผู้สนใจเข้าร่วมได้ทันทีเมื่อยังมีที่ว่าง',
    reviewCandidatesHint: 'คุณจะตรวจสอบผู้สมัครและเลือกผู้ที่เข้าร่วมได้',
    singleFirstComeHint: 'หนึ่งคนเข้าร่วมได้ทันทีเมื่อยังมีที่ว่าง',
    singleCandidateHint: 'ตรวจสอบใบสมัครรายบุคคลก่อนเลือกหนึ่งคน',
    groupFirstComeHint: 'ผู้เข้าร่วมแต่ละคนเข้าตามลำดับ ไม่มีการสร้างทีม',
    groupCandidateHint: 'ทีมเควสต์ส่งข้อเสนอหนึ่งรายการพร้อมหัวหน้าทีมให้คุณพิจารณา',
    participation: 'รูปแบบการเข้าร่วม',
    singlePerson: 'บุคคลเดียว',
    team: 'ทีม',
    headcount: 'จำนวนผู้เข้าร่วม',
    headcountPlaceholder: 'เช่น 3',
    rewardPerPerson: 'ค่าตอบแทนต่อคน',
    rewardPlaceholder: '0.00',
    rewardHelper: 'จ่ายให้ผู้เข้าร่วมแต่ละคนที่ได้รับเลือก',
    questSummaryLabel: 'สรุป Quest',
    singleHeadcountHint: 'SINGLE มี Worker ได้ 1 คนเสมอ',
    back: 'ย้อนกลับ',
    next: 'ถัดไป',
    saveDraft: 'บันทึกฉบับร่าง',
    savingDraft: 'กำลังบันทึกฉบับร่าง…',
    publishQuest: 'เผยแพร่ Quest',
    publishingQuest: 'กำลังเผยแพร่ Quest…',
    loadingDraft: 'กำลังกู้คืนฉบับร่าง…',
    savedDraftTitle: 'บันทึกฉบับร่างเควสต์แล้ว',
    savedDraftDescription: 'ฉบับร่างถูกเก็บไว้อย่างปลอดภัยในอุปกรณ์นี้ และยังไม่แสดงบนกระดานเควสต์',
    publishedQuestTitle: 'บันทึกตัวอย่างเควสต์ในเครื่องแล้ว',
    publishedQuestDescription: 'ตัวอย่างสำหรับ development นี้เก็บไว้ในอุปกรณ์เท่านั้น ยังไม่ได้เติมเงิน ส่งไปยัง API หรือเผยแพร่บนกระดานเควสต์',
    createAnotherDraft: 'สร้างฉบับร่างใหม่',
    notSelected: 'ยังไม่ได้เลือก',
    onlineOrAgreed: 'ออนไลน์หรือรอตกลงกัน',
    noImages: 'ไม่มี',
    selectedImages: (count) => `เลือกแล้ว ${count} รูป`,
    discardTitle: 'ออกจากการสร้างเควสต์หรือไม่?',
    discardDescription: 'ฉบับร่างถูกบันทึกไว้ในอุปกรณ์ ออกจากแบบฟอร์มและทำต่อภายหลังได้',
    discard: 'ออกจากหน้านี้',
    keepEditing: 'แก้ไขต่อ',
    autosaveSaving: 'กำลังบันทึกฉบับร่าง…',
    autosaveSaved: 'บันทึกฉบับร่างแล้ว',
    savePreview: 'บันทึกตัวอย่างเควสต์',
    savingPreview: 'กำลังบันทึกตัวอย่าง…',
    viewQuestBoard: 'กลับไปกระดานเควสต์',
    imageError: 'ไม่สามารถเพิ่มรูปภาพได้ ตรวจสอบสิทธิ์การเข้าถึงรูปภาพแล้วลองอีกครั้ง',
    titleError: 'เพิ่มชื่อสั้น ๆ เพื่อให้ผู้สนใจเข้าใจว่าจะต้องทำอะไร',
    questTagError: 'เลือกแท็กเควสต์ที่ตรงกับเควสต์นี้ที่สุด',
    descriptionError: 'อธิบายงานและผลลัพธ์ที่คาดหวัง',
    completionCriteriaError: 'เพิ่มเกณฑ์สำหรับตรวจว่างานเสร็จสมบูรณ์',
    startDateError: 'เลือกวันที่เริ่มต้นเควสต์',
    startDatePastError: 'วันที่เริ่มต้นต้องไม่อยู่ในอดีต',
    deadlineError: 'เลือกวันสุดท้ายสำหรับสมัครหรือทำงาน',
    deadlineOrderError: 'กำหนดส่งต้องไม่ก่อนวันที่เริ่มต้น',
    startTimeError: 'กรอกเวลาเริ่มต้น เช่น 09:00',
    endTimeError: 'กรอกเวลาสิ้นสุด เช่น 12:00',
    timeOrderError: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น',
    headcountError: 'ระบุผู้เข้าร่วมอย่างน้อย 1 คน',
    rewardEmptyError: 'กรอกค่าตอบแทนเป็นเงินบาท',
    rewardFormatError: 'กรอกจำนวนเงินที่ถูกต้อง โดยมีทศนิยมไม่เกิน 2 ตำแหน่ง',
    rewardBoundsError: (maximum) => `ค่าตอบแทนต้องอยู่ระหว่าง ฿0 ถึง ฿${maximum.toLocaleString('th-TH')}`,
    summary: {
      title: 'ชื่อเควสต์', questTag: 'แท็กเควสต์', description: 'รายละเอียดงาน', completionCriteria: 'เกณฑ์การเสร็จงาน',
      proof: 'หลักฐาน', schedule: 'กำหนดการ', location: 'สถานที่', images: 'รูปภาพ', candidateMode: 'รูปแบบการคัดเลือก',
      participation: 'การเข้าร่วม', headcount: 'จำนวนผู้เข้าร่วม', reward: 'ค่าตอบแทน',
    },
  },
};
