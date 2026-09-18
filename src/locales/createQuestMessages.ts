import type { SupportedLocale } from "./LocaleProvider";

export interface CreateQuestMessages {
  title: string;
  headerSubtitle: string;
  editTitle: string;
  editHeaderSubtitle: string;
  step: (current: number, total: number) => string;
  helpLabel: string;
  helpTitle: string;
  helpDescription: string;
  missionInfo: string;
  teamSetup: string;
  review: string;
  details: string;
  schedule: string;
  questSummary: string;
  questSetup: string;
  setupHint: string;
  teamSize: string;
  teamSizeValue: (count: string) => string;
  acceptanceMethod: string;
  chooseWorkFormat: string;
  chooseWorkFormatDescription: string;
  chooseAcceptanceMethod: string;
  chooseAcceptanceMethodDescription: string;
  singleFormat: string;
  singleFormatDescription: string;
  teamFormat: string;
  teamFormatDescription: string;
  instantAccept: string;
  instantAcceptDescription: string;
  selectCandidate: string;
  selectCandidateDescription: string;
  selectedMode: string;
  capacityAndReward: string;
  logistics: string;
  logisticsDescription: string;
  logisticsSummary: string;
  logisticsSummaryComplete: (dateTime: string, location: string) => string;
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
  searchQuestTags: string;
  noMatchingQuestTags: string;
  clearSearch: string;
  close: string;
  description: string;
  descriptionPlaceholder: string;
  completionCriteria: string;
  completionCriteriaPlaceholder: string;
  proofOfCompletion: string;
  proofRequiredDescription: string;
  proofNotNeededDescription: string;
  proofRequiredToggle: string;
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
  selectTime: string;
  selectDate: string;
  selectStartTime: string;
  selectEndTime: string;
  hour: string;
  minute: string;
  confirmTime: string;
  cancel: string;
  quickPresets: string;
  now: string;
  in30m: string;
  in1h: string;
  in2h: string;
  today: string;
  tomorrow: string;
  sameDay: string;
  plus1Day: string;
  endOfDay: string;
  questDuration: string;
  fixDeadlineQuick: string;
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
  reviewQuest: string;
  saveDraft: string;
  savingDraft: string;
  saveChanges: string;
  savingChanges: string;
  publishQuest: string;
  publishingQuest: string;
  loadingDraft: string;
  loadingTags: string;
  savedDraftTitle: string;
  savedDraftDescription: string;
  updatedQuestTitle: string;
  updatedQuestDescription: string;
  publishedQuestTitle: string;
  publishedQuestDescription: string;
  createAnotherDraft: string;
  backToQuest: string;
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
  saveError: string;
  retrySave: string;
  loadDraftError: string;
  retryLoadDraft: string;
  savePreview: string;
  savingPreview: string;
  viewQuestBoard: string;
  publishCheckTitle: string;
  publishCheckReady: string;
  publishCheckBlocked: string;
  publishCheckWarning: string;
  rewardPool: string;
  platformFee: string;
  escrowTotal: string;
  escrowDescription: string;
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
  blockingGuidance: {
    QUEST_TAG_REQUIRED: string;
    QUEST_DUE_AT_REQUIRED: string;
    QUEST_DUE_AT_NOT_AFTER_START_TIME: string;
    QUEST_START_TIME_NOT_IN_FUTURE: string;
    QUEST_CONDITION_REQUIRED: string;
    QUEST_HEADCOUNT_INVALID: string;
    WALLET_NOT_ACTIVE: string;
    INSUFFICIENT_SPENDING_BALANCE: (missingAmount: string) => string;
  };
  topUpAction: string;
  apiErrors: Record<string, string>;
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

export const createQuestMessages: Record<SupportedLocale, CreateQuestMessages> =
  {
    en: {
      title: "Create Quest",
      step: (current, total) => `Step ${current} of ${total}`,
      headerSubtitle: "Set up your Quest step by step",
      editTitle: "Edit Quest",
      editHeaderSubtitle: "Update your Quest before it is published",
      helpLabel: "Quest creation help",
      helpTitle: "Create a Quest",
      helpDescription:
        "Complete each step to define the Quest, choose whether one person or multiple people can join, select how applicants are accepted, and review the details before saving.",
      missionInfo: "Quest Info",
      teamSetup: "Team Setup",
      review: "Review",
      details: "Details",
      schedule: "Schedule",
      questSummary: "Summary",
      questSetup: "Quest Setup",
      setupHint: "You can change these details anytime before publishing.",
      teamSize: "Team Size",
      teamSizeValue: (count) =>
        count === "1" ? "1 person" : `Up to ${count} people`,
      acceptanceMethod: "Acceptance method",
      chooseWorkFormat: "Choose work format",
      chooseWorkFormatDescription:
        "Select whether this Quest is for one person or a team.",
      chooseAcceptanceMethod: "Choose acceptance method",
      chooseAcceptanceMethodDescription: "Decide how applicants get accepted.",
      singleFormat: "Single",
      singleFormatDescription: "For one participant",
      teamFormat: "Team",
      teamFormatDescription: "For multiple participants",
      instantAccept: "Instant accept",
      instantAcceptDescription: "First come, first served",
      selectCandidate: "Select Candidate",
      selectCandidateDescription: "Review applicants before accepting",
      selectedMode: "Selected mode",
      capacityAndReward: "Capacity & Quest funding",
      logistics: "Quest logistics",
      logisticsDescription: "Add when and where the work happens.",
      logisticsSummary: "Dates, place, and photos",
      logisticsSummaryComplete: (dateTime, location) =>
        `${dateTime} · ${location}`,
      questDetails: "Quest details",
      questDetailsDescription:
        "Give people enough context to decide if this Quest is right for them.",
      scheduleLocation: "Schedule & location",
      scheduleLocationDescription:
        "Choose the work dates and time. Add a location, or mark it as online.",
      participantsReward: "Participants & Quest funding",
      participantsRewardDescription:
        "Set the maximum participants and inclusive Quest Funding Total per person.",
      titleLabel: "Title",
      titlePlaceholder: "e.g. Design a poster for the faculty fair",
      questTag: "Quest Tag",
      chooseQuestTag: "Choose a Quest Tag",
      searchQuestTags: "Search Quest Tags",
      noMatchingQuestTags: "No matching Quest Tags",
      clearSearch: "Clear search",
      close: "Close",
      description: "Description",
      descriptionPlaceholder:
        "What needs to be done and what should the result look like?",
      completionCriteria: "Completion criteria",
      completionCriteriaPlaceholder: "How will you know the Quest is complete?",
      proofOfCompletion: "Proof of completion",
      proofRequiredDescription:
        "Participants must submit proof of completion when the Quest is done.",
      proofNotNeededDescription: "No proof of completion is needed.",
      proofRequiredToggle: "Require proof of completion",
      required: "Required",
      optional: "Optional",
      notNeeded: "Not needed",
      startDate: "Start date",
      deadline: "Deadline",
      startDateTime: "Start date & time",
      deadlineDateTime: "Deadline date & time",
      dateTimeHelper: "Choose the date and time together.",
      dateDone: "Done",
      startTime: "Start time",
      endTime: "End time",
      selectTime: "Select time",
      selectDate: "Select date",
      selectStartTime: "Select start time",
      selectEndTime: "Select deadline time",
      hour: "Hour",
      minute: "Minute",
      confirmTime: "Confirm time",
      cancel: "Cancel",
      quickPresets: "Quick presets",
      now: "Now",
      in30m: "+30m",
      in1h: "+1 hr",
      in2h: "+2 hrs",
      today: "Today",
      tomorrow: "Tomorrow",
      sameDay: "Same day",
      plus1Day: "+1 day",
      endOfDay: "End of day (23:59)",
      questDuration: "Duration",
      fixDeadlineQuick: "Set to +2 hrs from start",
      location: "Location",
      online: "Online",
      onlineQuest: "This is an online Quest",
      onlineQuestHint: "No physical location is needed.",
      locationPlaceholder: "e.g. Faculty building or meeting point",
      locationError: "Add a location for this Quest.",
      images: "Images",
      addImages: "Add images",
      changeImages: "Add or change images",
      imagesOptional: "Up to 3 photos · optional",
      questImage: (index) => `Quest image ${index}`,
      removeImage: (index) => `Remove Quest image ${index}`,
      candidateMode: "Candidate mode",
      firstCome: "First-come, first-served",
      reviewCandidates: "Review candidates",
      firstComeHint: "People join directly while places are available.",
      reviewCandidatesHint: "You review applicants and choose who can join.",
      singleFirstComeHint:
        "One person can join immediately while a place is available.",
      singleCandidateHint:
        "Review individual applications before selecting one person.",
      groupFirstComeHint:
        "People join independently in arrival order; no team is created.",
      groupCandidateHint:
        "A Quest Team submits one proposal with a leader for your review.",
      participation: "Participation",
      singlePerson: "Single person",
      team: "Team",
      headcount: "Headcount",
      headcountPlaceholder: "e.g. 3",
      rewardPerPerson: "Quest Funding Total per person",
      rewardPlaceholder: "0.00",
      rewardHelper:
        "This inclusive amount covers the worker reward and Platform Fee for each place.",
      questSummaryLabel: "Quest Summary",
      singleHeadcountHint: "Single format always has one participant.",
      back: "Back",
      next: "Next",
      reviewQuest: "Review Quest",
      saveDraft: "Save draft",
      savingDraft: "Saving draft…",
      saveChanges: "Save changes",
      savingChanges: "Saving changes…",
      publishQuest: "Publish Quest",
      publishingQuest: "Publishing Quest…",
      loadingDraft: "Restoring your draft…",
      loadingTags: "Loading tags…",
      savedDraftTitle: "Quest draft saved locally",
      savedDraftDescription:
        "Your draft is stored securely on this device and is not visible on the Quest Board yet.",
      updatedQuestTitle: "Quest updated",
      updatedQuestDescription: "Your Quest changes were saved to the server.",
      publishedQuestTitle: "Quest published",
      publishedQuestDescription:
        "Your Quest is now published on the Quest Board and will appear in My Quests for the Hirer.",
      createAnotherDraft: "Create another draft",
      backToQuest: "Back to Quest",
      notSelected: "Not selected",
      onlineOrAgreed: "Online or to be agreed",
      noImages: "None",
      selectedImages: (count) => `${count} selected`,
      discardTitle: "Leave this Quest?",
      discardDescription:
        "Your draft is saved locally. Leave the form and continue later?",
      discard: "Leave",
      keepEditing: "Keep editing",
      autosaveSaving: "Saving draft…",
      autosaveSaved: "Draft saved",
      saveError: "We couldn't save this Quest draft on your device. Try again.",
      retrySave: "Try again",
      loadDraftError: "We couldn't restore your Quest draft. Try again.",
      retryLoadDraft: "Try again",
      savePreview: "Save Quest preview",
      savingPreview: "Saving preview…",
      viewQuestBoard: "Back to Quest Board",
      publishCheckTitle: "Publish check & Escrow",
      publishCheckReady: "Ready to publish",
      publishCheckBlocked: "Resolve the publish blockers before publishing.",
      publishCheckWarning:
        "Images are optional; this warning does not block publishing.",
      rewardPool: "Reward pool",
      platformFee: "Platform Fee",
      escrowTotal: "Total Escrow required",
      escrowDescription:
        "The server reserves this inclusive Quest Funding Total for each participant.",
      imageError:
        "We could not add images. Check photo permissions and try again.",
      titleError: "Add a short title so people know what they will do.",
      questTagError: "Choose the Quest Tag that best matches this Quest.",
      descriptionError: "Describe the work and expected outcome.",
      completionCriteriaError:
        "Add the criteria for marking the Quest complete.",
      startDateError: "Choose when the Quest can begin.",
      startDatePastError: "Start date cannot be in the past.",
      deadlineError: "Choose the final date for applications or work.",
      deadlineOrderError: "Deadline must be on or after the start date.",
      startTimeError: "Enter a start time, for example 09:00.",
      endTimeError: "Enter an end time, for example 12:00.",
      timeOrderError: "End time must be after the start time.",
      headcountError: "Enter at least 1 participant.",
      rewardEmptyError: "Enter a reward amount in THB.",
      rewardFormatError:
        "Enter a valid amount in THB with up to 2 decimal places.",
      rewardBoundsError: (maximum) =>
        `Reward must be between ฿0 and ฿${maximum.toLocaleString("en-US")}.`,
      blockingGuidance: {
        QUEST_TAG_REQUIRED:
          "Please select a skill category Tag for your Quest.",
        QUEST_DUE_AT_REQUIRED: "Please set a due deadline for the Quest.",
        QUEST_DUE_AT_NOT_AFTER_START_TIME:
          "The deadline must be strictly after the start time.",
        QUEST_START_TIME_NOT_IN_FUTURE: "The start time must be in the future.",
        QUEST_CONDITION_REQUIRED: "Add at least one completion condition item.",
        QUEST_HEADCOUNT_INVALID:
          "Headcount must be 1 for Single, or 2–20 for Team.",
        WALLET_NOT_ACTIVE:
          "Your wallet is inactive or suspended. Please contact support.",
        INSUFFICIENT_SPENDING_BALANCE: (missingAmount) =>
          `Insufficient spending balance. You need ${missingAmount} more.`,
      },
      topUpAction: "Top up Wallet",
      apiErrors: {
        INVALID_TITLE: "Title must be 1 to 120 characters.",
        INVALID_DESCRIPTION: "Description cannot exceed 1000 characters.",
        INVALID_CONDITION:
          "Add at least one condition item of up to 255 characters.",
        INVALID_HEADCOUNT: "Headcount does not match the participation mode.",
        INVALID_QUEST_FUNDING_TOTAL:
          "Quest funding total must be between ฿1 and ฿700,000 with up to 2 decimal places.",
        INVALID_QUEST_DATES:
          "The schedule times are invalid, or the deadline is not after the start time.",
        INVALID_LOCATIONS: "Use at most 10 locations with a valid label.",
        TAG_NOT_FOUND: "The selected Quest Tag no longer exists.",
        QUEST_NOT_FOUND:
          "We could not find this Quest, or you are not the Hirer.",
        QUEST_NOT_DRAFT: "This Quest is no longer a draft.",
        QUEST_IMAGE_LIMIT_REACHED: "A Quest gallery can hold at most 3 images.",
        IMAGE_TOO_LARGE: "Each image must be 5 MB or smaller.",
        UNSUPPORTED_IMAGE_TYPE: "Images must be JPEG, PNG, or WebP.",
        QUEST_EDIT_CONFLICT:
          "This draft changed elsewhere. Reload it and try again.",
        QUEST_ESCROW_UNAVAILABLE:
          "The payment ledger is temporarily unavailable. Try again.",
        IDEMPOTENCY_KEY_REUSED:
          "This action was replayed with different data. Reload and try again.",
        IDEMPOTENCY_IN_PROGRESS:
          "The previous request is still in progress. Please wait a moment.",
        IDEMPOTENCY_UNAVAILABLE:
          "We could not confirm your request. Try again.",
      },
      summary: {
        title: "Title",
        questTag: "Quest Tag",
        description: "Description",
        completionCriteria: "Completion criteria",
        proof: "Proof",
        schedule: "Schedule",
        location: "Location",
        images: "Images",
        candidateMode: "Acceptance method",
        participation: "Participation",
        headcount: "Headcount",
        reward: "Reward",
      },
    },
    th: {
      title: "สร้างเควสต์",
      step: (current, total) => `ขั้นตอนที่ ${current} จาก ${total}`,
      headerSubtitle: "สร้างเควสต์ทีละขั้นตอน",
      editTitle: "แก้ไขเควสต์",
      editHeaderSubtitle: "อัปเดตเควสต์ก่อนเผยแพร่",
      helpLabel: "ความช่วยเหลือในการสร้างเควสต์",
      helpTitle: "สร้างเควสต์",
      helpDescription:
        "ทำตามแต่ละขั้นตอนเพื่อกำหนดรายละเอียด เลือกจำนวนผู้เข้าร่วม เลือกวิธีรับผู้สมัคร และตรวจสอบข้อมูลก่อนบันทึก",
      missionInfo: "ข้อมูลเควสต์",
      teamSetup: "ตั้งค่าทีม",
      review: "ตรวจสอบ",
      details: "รายละเอียด",
      schedule: "กำหนดการ",
      questSummary: "สรุป",
      questSetup: "ตั้งค่าเควสต์",
      setupHint: "คุณแก้ไขรายละเอียดเหล่านี้ได้ก่อนเผยแพร่",
      teamSize: "ขนาดทีม",
      teamSizeValue: (count) =>
        count === "1" ? "1 คน" : `ไม่เกิน ${count} คน`,
      acceptanceMethod: "วิธีรับผู้สมัคร",
      chooseWorkFormat: "เลือกรูปแบบการทำงาน",
      chooseWorkFormatDescription:
        "เลือกว่างานนี้สำหรับผู้เข้าร่วมคนเดียวหรือเป็นทีม",
      chooseAcceptanceMethod: "เลือกรูปแบบการรับผู้สมัคร",
      chooseAcceptanceMethodDescription: "กำหนดวิธีรับผู้สมัครเข้าร่วม",
      singleFormat: "บุคคลเดียว",
      singleFormatDescription: "สำหรับผู้เข้าร่วม 1 คน",
      teamFormat: "ทีม",
      teamFormatDescription: "สำหรับผู้เข้าร่วมหลายคน",
      instantAccept: "รับทันที",
      instantAcceptDescription: "มาก่อนได้ก่อน",
      selectCandidate: "เลือกผู้สมัคร",
      selectCandidateDescription: "ตรวจสอบผู้สมัครก่อนรับเข้าร่วม",
      selectedMode: "โหมดที่เลือก",
      capacityAndReward: "จำนวนผู้เข้าร่วมและเงินทุนเควสต์",
      logistics: "กำหนดการเควสต์",
      logisticsDescription: "ระบุวันเวลา สถานที่ และรูปภาพของงาน",
      logisticsSummary: "วันเวลา สถานที่ และรูปภาพ",
      logisticsSummaryComplete: (dateTime, location) =>
        `${dateTime} · ${location}`,
      questDetails: "รายละเอียดเควสต์",
      questDetailsDescription:
        "ให้ข้อมูลเพียงพอเพื่อช่วยให้ผู้สนใจตัดสินใจว่าเควสต์นี้เหมาะกับพวกเขาหรือไม่",
      scheduleLocation: "กำหนดการและสถานที่",
      scheduleLocationDescription:
        "เลือกวันและเวลาทำงาน แล้วระบุสถานที่หรือเลือกว่างานออนไลน์",
      participantsReward: "ผู้เข้าร่วมและเงินทุนเควสต์",
      participantsRewardDescription:
        "กำหนดจำนวนผู้เข้าร่วมสูงสุดและเงินทุนเควสต์รวมต่อคน",
      titleLabel: "ชื่อเควสต์",
      titlePlaceholder: "เช่น ออกแบบโปสเตอร์สำหรับงานคณะ",
      questTag: "แท็กเควสต์",
      chooseQuestTag: "เลือกแท็กเควสต์",
      searchQuestTags: "ค้นหาแท็กเควสต์",
      noMatchingQuestTags: "ไม่พบแท็กเควสต์ที่ตรงกัน",
      clearSearch: "ล้างการค้นหา",
      close: "ปิด",
      description: "รายละเอียดงาน",
      descriptionPlaceholder: "ต้องทำอะไร และผลลัพธ์ควรเป็นอย่างไร",
      completionCriteria: "เกณฑ์การเสร็จงาน",
      completionCriteriaPlaceholder: "จะรู้ได้อย่างไรว่าเควสต์เสร็จสมบูรณ์",
      proofOfCompletion: "หลักฐานการเสร็จงาน",
      proofRequiredDescription:
        "ผู้เข้าร่วมต้องส่งหลักฐานการเสร็จงานเมื่อทำเควสต์เสร็จ",
      proofNotNeededDescription: "ไม่จำเป็นต้องส่งหลักฐานการเสร็จงาน",
      proofRequiredToggle: "ต้องการหลักฐานการเสร็จงาน",
      required: "จำเป็น",
      optional: "ไม่บังคับ",
      notNeeded: "ไม่ต้องมี",
      startDate: "วันที่เริ่มต้น",
      deadline: "กำหนดส่ง",
      startDateTime: "วันที่และเวลาเริ่มต้น",
      deadlineDateTime: "วันที่และเวลาสิ้นสุด",
      dateTimeHelper: "เลือกวันและเวลาได้ในครั้งเดียว",
      dateDone: "เสร็จสิ้น",
      startTime: "เวลาเริ่มต้น",
      endTime: "เวลาสิ้นสุด",
      selectTime: "เลือกเวลา",
      selectDate: "เลือกวันที่",
      selectStartTime: "เลือกเวลาเริ่มต้น",
      selectEndTime: "เลือกเวลาสิ้นสุด (เดดไลน์)",
      hour: "ชั่วโมง",
      minute: "นาที",
      confirmTime: "ยืนยันเวลา",
      cancel: "ยกเลิก",
      quickPresets: "เลือกด่วน",
      now: "ตอนนี้",
      in30m: "+30 นาที",
      in1h: "+1 ชม.",
      in2h: "+2 ชม.",
      today: "วันนี้",
      tomorrow: "พรุ่งนี้",
      sameDay: "วันเดียวกัน",
      plus1Day: "+1 วัน",
      endOfDay: "สิ้นสุดวัน (23:59)",
      questDuration: "ระยะเวลาเควสต์",
      fixDeadlineQuick: "ตั้งเป็น +2 ชม. จากเวลาเริ่ม",
      location: "สถานที่",
      online: "ออนไลน์",
      onlineQuest: "เควสต์นี้เป็นงานออนไลน์",
      onlineQuestHint: "ไม่ต้องระบุสถานที่สำหรับงานออนไลน์",
      locationPlaceholder: "เช่น อาคารคณะหรือจุดนัดพบ",
      locationError: "เพิ่มสถานที่สำหรับเควสต์นี้",
      images: "รูปภาพ",
      addImages: "เพิ่มรูปภาพ",
      changeImages: "เพิ่มหรือเปลี่ยนรูปภาพ",
      imagesOptional: "ไม่เกิน 3 รูป · ไม่บังคับ",
      questImage: (index) => `รูปเควสต์ที่ ${index}`,
      removeImage: (index) => `ลบรูปเควสต์ที่ ${index}`,
      candidateMode: "รูปแบบการคัดเลือก",
      firstCome: "มาก่อนได้ก่อน",
      reviewCandidates: "พิจารณาผู้สมัคร",
      firstComeHint: "ผู้สนใจเข้าร่วมได้ทันทีเมื่อยังมีที่ว่าง",
      reviewCandidatesHint: "คุณจะตรวจสอบผู้สมัครและเลือกผู้ที่เข้าร่วมได้",
      singleFirstComeHint: "หนึ่งคนเข้าร่วมได้ทันทีเมื่อยังมีที่ว่าง",
      singleCandidateHint: "ตรวจสอบใบสมัครรายบุคคลก่อนเลือกหนึ่งคน",
      groupFirstComeHint: "ผู้เข้าร่วมแต่ละคนเข้าตามลำดับ ไม่มีการสร้างทีม",
      groupCandidateHint:
        "ทีมเควสต์ส่งข้อเสนอหนึ่งรายการพร้อมหัวหน้าทีมให้คุณพิจารณา",
      participation: "รูปแบบการเข้าร่วม",
      singlePerson: "บุคคลเดียว",
      team: "ทีม",
      headcount: "จำนวนผู้เข้าร่วม",
      headcountPlaceholder: "เช่น 3",
      rewardPerPerson: "เงินทุนเควสต์รวมต่อคน",
      rewardPlaceholder: "0.00",
      rewardHelper:
        "จำนวนนี้รวมค่าตอบแทนผู้เข้าร่วมและค่าธรรมเนียมแพลตฟอร์มต่อหนึ่งที่แล้ว",
      questSummaryLabel: "สรุปเควสต์",
      singleHeadcountHint: "รูปแบบบุคคลเดียวมีผู้เข้าร่วมได้ 1 คนเสมอ",
      back: "ย้อนกลับ",
      next: "ถัดไป",
      reviewQuest: "ตรวจสอบเควสต์",
      saveDraft: "บันทึกฉบับร่าง",
      savingDraft: "กำลังบันทึกฉบับร่าง…",
      saveChanges: "บันทึกการแก้ไข",
      savingChanges: "กำลังบันทึกการแก้ไข…",
      publishQuest: "เผยแพร่เควสต์",
      publishingQuest: "กำลังเผยแพร่เควสต์…",
      loadingDraft: "กำลังกู้คืนฉบับร่าง…",
      loadingTags: "กำลังโหลดแท็ก…",
      savedDraftTitle: "บันทึกฉบับร่างเควสต์แล้ว",
      savedDraftDescription:
        "ฉบับร่างถูกเก็บไว้อย่างปลอดภัยในอุปกรณ์นี้ และยังไม่แสดงบนกระดานเควสต์",
      updatedQuestTitle: "อัปเดตเควสต์แล้ว",
      updatedQuestDescription: "บันทึกการแก้ไขเควสต์ไปยังเซิร์ฟเวอร์แล้ว",
      publishedQuestTitle: "เผยแพร่เควสต์แล้ว",
      publishedQuestDescription:
        "เควสต์ของคุณเผยแพร่บนกระดานเควสต์แล้ว และจะแสดงใน My Quests ของผู้ว่าจ้าง",
      createAnotherDraft: "สร้างฉบับร่างใหม่",
      backToQuest: "กลับไปที่เควสต์",
      notSelected: "ยังไม่ได้เลือก",
      onlineOrAgreed: "ออนไลน์หรือรอตกลงกัน",
      noImages: "ไม่มี",
      selectedImages: (count) => `เลือกแล้ว ${count} รูป`,
      discardTitle: "ออกจากการสร้างเควสต์หรือไม่?",
      discardDescription:
        "ฉบับร่างถูกบันทึกไว้ในอุปกรณ์ ออกจากแบบฟอร์มและทำต่อภายหลังได้",
      discard: "ออกจากหน้านี้",
      keepEditing: "แก้ไขต่อ",
      autosaveSaving: "กำลังบันทึกฉบับร่าง…",
      autosaveSaved: "บันทึกฉบับร่างแล้ว",
      saveError: "ไม่สามารถบันทึกฉบับร่างเควสต์ลงในอุปกรณ์ได้ ลองอีกครั้ง",
      retrySave: "ลองอีกครั้ง",
      loadDraftError: "ไม่สามารถกู้คืนฉบับร่างเควสต์ได้ ลองอีกครั้ง",
      retryLoadDraft: "ลองอีกครั้ง",
      savePreview: "บันทึกตัวอย่างเควสต์",
      savingPreview: "กำลังบันทึกตัวอย่าง…",
      viewQuestBoard: "กลับไปกระดานเควสต์",
      publishCheckTitle: "ตรวจสอบการเผยแพร่และ Escrow",
      publishCheckReady: "พร้อมเผยแพร่",
      publishCheckBlocked: "แก้ไขข้อขัดข้องก่อนเผยแพร่เควสต์",
      publishCheckWarning:
        "รูปภาพเป็นข้อมูลเสริม คำเตือนนี้ไม่ขัดขวางการเผยแพร่",
      rewardPool: "รวมค่าตอบแทน",
      platformFee: "ค่าธรรมเนียมแพลตฟอร์ม",
      escrowTotal: "Escrow ที่ต้องสำรองทั้งหมด",
      escrowDescription:
        "ระบบจะสำรองเงินทุนเควสต์รวมต่อผู้เข้าร่วมตามผลจากเซิร์ฟเวอร์",
      imageError:
        "ไม่สามารถเพิ่มรูปภาพได้ ตรวจสอบสิทธิ์การเข้าถึงรูปภาพแล้วลองอีกครั้ง",
      titleError: "เพิ่มชื่อสั้น ๆ เพื่อให้ผู้สนใจเข้าใจว่าจะต้องทำอะไร",
      questTagError: "เลือกแท็กเควสต์ที่ตรงกับเควสต์นี้ที่สุด",
      descriptionError: "อธิบายงานและผลลัพธ์ที่คาดหวัง",
      completionCriteriaError: "เพิ่มเกณฑ์สำหรับตรวจว่างานเสร็จสมบูรณ์",
      startDateError: "เลือกวันที่เริ่มต้นเควสต์",
      startDatePastError: "วันที่เริ่มต้นต้องไม่อยู่ในอดีต",
      deadlineError: "เลือกวันสุดท้ายสำหรับสมัครหรือทำงาน",
      deadlineOrderError: "กำหนดส่งต้องไม่ก่อนวันที่เริ่มต้น",
      startTimeError: "กรอกเวลาเริ่มต้น เช่น 09:00",
      endTimeError: "กรอกเวลาสิ้นสุด เช่น 12:00",
      timeOrderError: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น",
      headcountError: "ระบุผู้เข้าร่วมอย่างน้อย 1 คน",
      rewardEmptyError: "กรอกค่าตอบแทนเป็นเงินบาท",
      rewardFormatError: "กรอกจำนวนเงินที่ถูกต้อง โดยมีทศนิยมไม่เกิน 2 ตำแหน่ง",
      rewardBoundsError: (maximum) =>
        `ค่าตอบแทนต้องอยู่ระหว่าง ฿0 ถึง ฿${maximum.toLocaleString("th-TH")}`,
      blockingGuidance: {
        QUEST_TAG_REQUIRED: "กรุณาเลือกแท็กหมวดหมู่สำหรับเควสต์",
        QUEST_DUE_AT_REQUIRED: "กรุณากำหนดเวลาส่งงาน (Deadline)",
        QUEST_DUE_AT_NOT_AFTER_START_TIME:
          "เวลาส่งงานต้องอยู่หลังเวลาเริ่มต้นเควสต์",
        QUEST_START_TIME_NOT_IN_FUTURE: "เวลาเริ่มต้นเควสต์ต้องอยู่ในอนาคต",
        QUEST_CONDITION_REQUIRED: "ต้องมีเกณฑ์การเสร็จงานอย่างน้อย 1 ข้อ",
        QUEST_HEADCOUNT_INVALID:
          "จำนวนผู้ทำงานไม่ถูกต้อง (เดี่ยว 1 คน, ทีม 2-20 คน)",
        WALLET_NOT_ACTIVE: "กระเป๋าเงินของคุณถูกระงับหรือไม่พร้อมใช้งาน",
        INSUFFICIENT_SPENDING_BALANCE: (missingAmount) =>
          `ยอดเงินพร้อมใช้ไม่เพียงพอ ขาดอีก ${missingAmount}`,
      },
      topUpAction: "เติมเงิน",
      apiErrors: {
        INVALID_TITLE: "ชื่อเควสต์ต้องมี 1 ถึง 120 ตัวอักษร",
        INVALID_DESCRIPTION: "รายละเอียดงานต้องไม่เกิน 1000 ตัวอักษร",
        INVALID_CONDITION:
          "ต้องมีเกณฑ์การเสร็จงานอย่างน้อย 1 ข้อ แต่ละข้อไม่เกิน 255 ตัวอักษร",
        INVALID_HEADCOUNT: "จำนวนผู้เข้าร่วมไม่ถูกต้องตามรูปแบบการเข้าร่วม",
        INVALID_QUEST_FUNDING_TOTAL:
          "เงินทุนเควสต์ต้องอยู่ระหว่าง ฿1 ถึง ฿700,000 โดยมีทศนิยมไม่เกิน 2 ตำแหน่ง",
        INVALID_QUEST_DATES:
          "วันเวลาไม่ถูกต้อง หรือเวลาส่งงานต้องอยู่หลังเวลาเริ่มต้น",
        INVALID_LOCATIONS:
          "ระบุสถานที่ได้ไม่เกิน 10 แห่ง พร้อมป้ายชื่อที่ถูกต้อง",
        TAG_NOT_FOUND: "ไม่พบแท็กเควสต์ที่เลือก",
        QUEST_NOT_FOUND: "ไม่พบเควสต์นี้ หรือคุณไม่ใช่ผู้ว่าจ้าง",
        QUEST_NOT_DRAFT: "เควสต์นี้ไม่ได้อยู่ในสถานะฉบับร่างแล้ว",
        QUEST_IMAGE_LIMIT_REACHED: "แนบรูปภาพได้ไม่เกิน 3 รูป",
        IMAGE_TOO_LARGE: "รูปภาพแต่ละรูปต้องไม่เกิน 5 MB",
        UNSUPPORTED_IMAGE_TYPE: "รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP",
        QUEST_EDIT_CONFLICT:
          "ฉบับร่างนี้ถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่แล้วลองอีกครั้ง",
        QUEST_ESCROW_UNAVAILABLE:
          "ระบบการเงินไม่พร้อมใช้งานชั่วคราว กรุณาลองอีกครั้ง",
        IDEMPOTENCY_KEY_REUSED:
          "คำขอนี้ถูกส่งซ้ำด้วยข้อมูลที่แตกต่างกัน กรุณาโหลดใหม่แล้วลองอีกครั้ง",
        IDEMPOTENCY_IN_PROGRESS:
          "คำขอก่อนหน้ากำลังดำเนินการอยู่ กรุณารอสักครู่",
        IDEMPOTENCY_UNAVAILABLE:
          "ไม่สามารถยืนยันคำขอของคุณได้ กรุณาลองอีกครั้ง",
      },
      summary: {
        title: "ชื่อเควสต์",
        questTag: "แท็กเควสต์",
        description: "รายละเอียดงาน",
        completionCriteria: "เกณฑ์การเสร็จงาน",
        proof: "หลักฐาน",
        schedule: "กำหนดการ",
        location: "สถานที่",
        images: "รูปภาพ",
        candidateMode: "วิธีรับผู้สมัคร",
        participation: "การเข้าร่วม",
        headcount: "จำนวนผู้เข้าร่วม",
        reward: "ค่าตอบแทน",
      },
    },
  };
