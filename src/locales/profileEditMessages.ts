import type { SupportedLocale } from './LocaleProvider';

export interface ProfileEditMessages {
  title: string;
  save: string;
  saving: string;
  cancel: string;
  retry: string;
  loading: string;
  loadError: string;
  saveError: string;
  unsavedTitle: string;
  unsavedMessage: string;
  leave: string;
  stay: string;
  basics: string;
  basicsSummary: string;
  experience: string;
  experienceSummary: (count: number) => string;
  portfolio: string;
  portfolioSummary: (count: number) => string;
  certificates: string;
  certificatesSummary: (count: number) => string;
  add: string;
  edit: string;
  remove: string;
  deleteTitle: string;
  deleteMessage: (title: string) => string;
  confirmDelete: string;
  name: string;
  namePlaceholder: string;
  bio: string;
  bioPlaceholder: string;
  occupation: string;
  occupationPlaceholder: string;
  tags: string;
  tagsUnavailable: string;
  avatar: string;
  changeAvatar: string;
  titleLabel: string;
  titlePlaceholder: string;
  detail: string;
  detailPlaceholder: string;
  issuer: string;
  issuerPlaceholder: string;
  issuedAt: string;
  employmentType: string;
  employmentTypePlaceholder: string;
  organization: string;
  organizationPlaceholder: string;
  startDate: string;
  endDate: string;
  present: string;
  noItems: string;
  noImage: string;
  addImage: string;
  removeImage: string;
  invalidName: string;
  required: string;
  invalidDate: string;
  invalidExperienceDates: string;
  fileTooLarge: string;
  filePickerError: string;
  sessionExpired: string;
  conflict: string;
  basicsSection: string;
  experienceSection: string;
  portfolioSection: string;
  certificatesSection: string;
}

export const profileEditMessages: Record<SupportedLocale, ProfileEditMessages> = {
  en: {
    title: 'Edit Profile',
    save: 'Save changes',
    saving: 'Saving...',
    cancel: 'Cancel',
    retry: 'Try again',
    loading: 'Loading profile editor...',
    loadError: 'Unable to load profile editing data.',
    saveError: 'Unable to save these changes.',
    unsavedTitle: 'Discard changes?',
    unsavedMessage: 'Your changes have not been saved.',
    leave: 'Discard',
    stay: 'Keep editing',
    basics: 'Profile basics',
    basicsSummary: 'Name, avatar, occupation, and bio',
    experience: 'Experience',
    experienceSummary: (count) => `${count} ${count === 1 ? 'entry' : 'entries'}`,
    portfolio: 'Portfolio Work',
    portfolioSummary: (count) => `${count} ${count === 1 ? 'project' : 'projects'}`,
    certificates: 'Certificates',
    certificatesSummary: (count) => `${count} ${count === 1 ? 'certificate' : 'certificates'}`,
    add: 'Add',
    edit: 'Edit',
    remove: 'Remove',
    deleteTitle: 'Delete item?',
    deleteMessage: (title) => `Delete “${title}”? This cannot be undone.`,
    confirmDelete: 'Delete',
    name: 'Display name',
    namePlaceholder: 'Enter your full name',
    bio: 'About you',
    bioPlaceholder: 'Share your background, skills, or the Quests you are looking for...',
    occupation: 'Occupation',
    occupationPlaceholder: 'Select your occupation',
    tags: 'Profile tags',
    tagsUnavailable: 'Profile tags are managed by KUQuest.',
    avatar: 'Profile image',
    changeAvatar: 'Choose image',
    titleLabel: 'Title',
    titlePlaceholder: 'Enter a title',
    detail: 'Description',
    detailPlaceholder: 'Describe this work or experience',
    issuer: 'Issuer',
    issuerPlaceholder: 'Enter the issuer',
    issuedAt: 'Issued date',
    employmentType: 'Employment type',
    employmentTypePlaceholder: 'Select employment type',
    organization: 'Organization',
    organizationPlaceholder: 'Enter the organization',
    startDate: 'Start date',
    endDate: 'End date',
    present: 'Present',
    noItems: 'Nothing added yet.',
    noImage: 'No image selected',
    addImage: 'Add image',
    removeImage: 'Remove image',
    invalidName: 'Enter both a first and last name.',
    required: 'This field is required.',
    invalidDate: 'Use a valid date in YYYY-MM-DD format.',
    invalidExperienceDates: 'The end date must be after the start date.',
    fileTooLarge: 'Choose an image smaller than 5 MB.',
    filePickerError: 'Unable to choose that image.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    conflict: 'This profile changed elsewhere. Reload before saving again.',
    basicsSection: 'Profile basics',
    experienceSection: 'Experience',
    portfolioSection: 'Portfolio Work',
    certificatesSection: 'Certificates',
  },
  th: {
    title: 'แก้ไขโปรไฟล์',
    save: 'บันทึกการเปลี่ยนแปลง',
    saving: 'กำลังบันทึก...',
    cancel: 'ยกเลิก',
    retry: 'ลองใหม่อีกครั้ง',
    loading: 'กำลังโหลดข้อมูลโปรไฟล์...',
    loadError: 'ไม่สามารถโหลดข้อมูลสำหรับแก้ไขโปรไฟล์ได้',
    saveError: 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้',
    unsavedTitle: 'ละทิ้งการเปลี่ยนแปลงหรือไม่',
    unsavedMessage: 'การเปลี่ยนแปลงของคุณยังไม่ได้บันทึก',
    leave: 'ละทิ้ง',
    stay: 'แก้ไขต่อ',
    basics: 'ข้อมูลโปรไฟล์',
    basicsSummary: 'ชื่อ รูปโปรไฟล์ อาชีพ และคำแนะนำตัว',
    experience: 'ประสบการณ์',
    experienceSummary: (count) => `${count} รายการ`,
    portfolio: 'ผลงานของฉัน',
    portfolioSummary: (count) => `${count} ผลงาน`,
    certificates: 'ใบรับรอง',
    certificatesSummary: (count) => `${count} ใบรับรอง`,
    add: 'เพิ่ม',
    edit: 'แก้ไข',
    remove: 'ลบ',
    deleteTitle: 'ลบรายการหรือไม่',
    deleteMessage: (title) => `ต้องการลบ “${title}” หรือไม่ การกระทำนี้ย้อนกลับไม่ได้`,
    confirmDelete: 'ลบ',
    name: 'ชื่อที่แสดง',
    namePlaceholder: 'กรอกชื่อและนามสกุล',
    bio: 'เกี่ยวกับคุณ',
    bioPlaceholder: 'แชร์ประวัติ ทักษะ หรือเควสที่คุณกำลังมองหา...',
    occupation: 'อาชีพ',
    occupationPlaceholder: 'เลือกอาชีพ',
    tags: 'แท็กโปรไฟล์',
    tagsUnavailable: 'แท็กโปรไฟล์ถูกจัดการโดย KUQuest',
    avatar: 'รูปโปรไฟล์',
    changeAvatar: 'เลือกรูปภาพ',
    titleLabel: 'ชื่อเรื่อง',
    titlePlaceholder: 'กรอกชื่อเรื่อง',
    detail: 'คำอธิบาย',
    detailPlaceholder: 'อธิบายผลงานหรือประสบการณ์นี้',
    issuer: 'ผู้ออกใบรับรอง',
    issuerPlaceholder: 'กรอกชื่อผู้ออกใบรับรอง',
    issuedAt: 'วันที่ออก',
    employmentType: 'ประเภทการจ้างงาน',
    employmentTypePlaceholder: 'เลือกประเภทการจ้างงาน',
    organization: 'องค์กร',
    organizationPlaceholder: 'กรอกชื่อองค์กร',
    startDate: 'วันที่เริ่มต้น',
    endDate: 'วันที่สิ้นสุด',
    present: 'ปัจจุบัน',
    noItems: 'ยังไม่มีรายการ',
    noImage: 'ยังไม่ได้เลือกรูปภาพ',
    addImage: 'เพิ่มรูปภาพ',
    removeImage: 'ลบรูปภาพ',
    invalidName: 'กรุณากรอกทั้งชื่อและนามสกุล',
    required: 'จำเป็นต้องระบุ',
    invalidDate: 'ใช้รูปแบบวันที่ YYYY-MM-DD ที่ถูกต้อง',
    invalidExperienceDates: 'วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่มต้น',
    fileTooLarge: 'เลือกรูปภาพที่มีขนาดไม่เกิน 5 MB',
    filePickerError: 'ไม่สามารถเลือกรูปภาพนี้ได้',
    sessionExpired: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    conflict: 'โปรไฟล์นี้ถูกเปลี่ยนแปลงจากที่อื่น กรุณาโหลดใหม่ก่อนบันทึก',
    basicsSection: 'ข้อมูลโปรไฟล์',
    experienceSection: 'ประสบการณ์',
    portfolioSection: 'ผลงานของฉัน',
    certificatesSection: 'ใบรับรอง',
  },
};
