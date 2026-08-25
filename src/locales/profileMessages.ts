import { SupportedLocale } from './LocaleProvider';

export interface ProfileMessages {
  loading: string;
  error: string;
  retry: string;
  title: string;
  edit: string;
  about: string;
  portfolio: string;
  portfolioWork: string;
  certificates: string;
  works: string;
  experience: string;
  reviews: string;
  rating: string;
  totalQuests: string;
  allReviews: string;
  noReviews: string;
  noMatchingReviews: string;
  showAllReviews: string;
  noExperience: string;
  present: string;
  previewUnavailable: string;
  noRating: string;
  reviewsCount: string;
  noImage: string;
  imageUnavailable: string;
  closePreview: string;
  noDescription: string;
  noCertificates: string;
  noWorks: string;
  sectionUnavailable: string;
  ratingUnavailable: string;
  profileImageLabel: (name: string) => string;
  questCategoriesLabel: string;
  sectionsLabel: string;
  statisticsLabel: string;
  ratingSummaryLabel: string;
  ratingDistributionLabel: string;
  certificatePreviewLabel: (title: string) => string;
  certificateImageLabel: (title: string) => string;
  workImageLabel: (title: string) => string;
  reviewerAvatarLabel: (name: string) => string;
  reviewFilterLabel: (rating: number) => string;
  reviewRatingLabel: (rating: number) => string;
  viewCertificate: string;
  viewWork: string;
  closeWork: string;
  manageInSettings: string;
  eligibleQuestReviews: (count: number) => string;
  filteredReviews: (count: number, rating: number) => string;
  certificate: string;
  student: string;
  professor: string;
}

export const profileMessages: Record<SupportedLocale, ProfileMessages> = {
  en: {
    loading: 'Loading profile...',
    error: 'Unable to load your profile.',
    retry: 'Try again',
    title: 'Student Profile',
    edit: 'Edit Profile',
    about: 'About',
    portfolio: 'Portfolio',
    portfolioWork: 'Portfolio Work',
    certificates: 'Certificates',
    works: 'Works',
    experience: 'Experience',
    reviews: 'Reviews',
    rating: 'Profile Rating',
    totalQuests: 'Total Quests',
    allReviews: 'All',
    noReviews: 'No reviews yet.',
    noMatchingReviews: 'No reviews match this rating.',
    showAllReviews: 'Show all reviews',
    noExperience: 'No experience added yet.',
    present: 'Present',
    previewUnavailable: 'image unavailable',
    noRating: 'No ratings yet',
    reviewsCount: 'reviews',
    noImage: 'No image',
    imageUnavailable: 'Certificate image unavailable',
    closePreview: 'Close certificate preview',
    noDescription: 'No description added yet.',
    noCertificates: 'No certificates added yet.',
    noWorks: 'No works added yet.',
    sectionUnavailable: 'This section is temporarily unavailable.',
    ratingUnavailable: 'Profile Rating is temporarily unavailable.',
    profileImageLabel: (name) => `${name} profile image`,
    questCategoriesLabel: 'Most frequent Quest categories',
    sectionsLabel: 'Profile sections',
    statisticsLabel: 'Profile statistics',
    ratingSummaryLabel: 'Rating summary',
    ratingDistributionLabel: 'Rating distribution',
    certificatePreviewLabel: (title) => `${title} preview`,
    certificateImageLabel: (title) => `${title} certificate`,
    workImageLabel: (title) => `${title} image`,
    reviewerAvatarLabel: (name) => `${name} avatar`,
    reviewFilterLabel: (rating) => `${rating} stars`,
    reviewRatingLabel: (rating) => `${rating} out of 5 stars`,
    viewCertificate: 'View certificate preview',
    viewWork: 'View project details',
    closeWork: 'Close project details',
    manageInSettings: 'Manage in Settings',
    eligibleQuestReviews: (count) => `${count} review${count === 1 ? '' : 's'} from completed Quests`,
    filteredReviews: (count, rating) => `Showing ${count} ${rating}-star review${count === 1 ? '' : 's'}`,
    certificate: 'Certificate',
    student: 'Student',
    professor: 'Professor',
  },
  th: {
    loading: 'กำลังโหลดโปรไฟล์...',
    error: 'ไม่สามารถโหลดโปรไฟล์ของคุณได้',
    retry: 'ลองใหม่อีกครั้ง',
    title: 'โปรไฟล์นักศึกษา',
    edit: 'แก้ไขโปรไฟล์',
    about: 'เกี่ยวกับ',
    portfolio: 'ผลงาน',
    portfolioWork: 'ผลงานพอร์ตโฟลิโอ',
    certificates: 'ใบรับรอง',
    works: 'ผลงานของฉัน',
    experience: 'ประสบการณ์',
    reviews: 'รีวิว',
    rating: 'คะแนนโปรไฟล์',
    totalQuests: 'เควสทั้งหมด',
    allReviews: 'ทั้งหมด',
    noReviews: 'ยังไม่มีรีวิว',
    noMatchingReviews: 'ไม่มีรีวิวที่ตรงกับคะแนนนี้',
    showAllReviews: 'ดูรีวิวทั้งหมด',
    noExperience: 'ยังไม่มีประสบการณ์',
    present: 'ปัจจุบัน',
    previewUnavailable: 'ไม่มีรูปภาพ',
    noRating: 'ยังไม่มีคะแนน',
    reviewsCount: 'รีวิว',
    noImage: 'ไม่มีรูปภาพ',
    imageUnavailable: 'ไม่มีรูปใบรับรอง',
    closePreview: 'ปิดตัวอย่างใบรับรอง',
    noDescription: 'ยังไม่มีคำอธิบาย',
    noCertificates: 'ยังไม่มีใบรับรอง',
    noWorks: 'ยังไม่มีผลงานพอร์ตโฟลิโอ',
    sectionUnavailable: 'ส่วนนี้ไม่พร้อมใช้งานชั่วคราว',
    ratingUnavailable: 'คะแนนโปรไฟล์ไม่พร้อมใช้งานชั่วคราว',
    profileImageLabel: (name) => `รูปโปรไฟล์ของ ${name}`,
    questCategoriesLabel: 'หมวดหมู่เควสต์ที่ทำบ่อย',
    sectionsLabel: 'ส่วนของโปรไฟล์',
    statisticsLabel: 'สถิติโปรไฟล์',
    ratingSummaryLabel: 'สรุปคะแนน',
    ratingDistributionLabel: 'การกระจายคะแนน',
    certificatePreviewLabel: (title) => `ดูตัวอย่าง${title}`,
    certificateImageLabel: (title) => `ใบรับรอง ${title}`,
    workImageLabel: (title) => `รูปภาพ ${title}`,
    reviewerAvatarLabel: (name) => `รูปโปรไฟล์ของ ${name}`,
    reviewFilterLabel: (rating) => `${rating} ดาว`,
    reviewRatingLabel: (rating) => `${rating} จาก 5 ดาว`,
    viewCertificate: 'ดูตัวอย่างใบรับรอง',
    viewWork: 'ดูรายละเอียดผลงาน',
    closeWork: 'ปิดรายละเอียดผลงาน',
    manageInSettings: 'จัดการในหน้าการตั้งค่า',
    eligibleQuestReviews: (count) => `${count} รีวิวจากเควสต์ที่เสร็จสมบูรณ์`,
    filteredReviews: (count, rating) => `แสดง ${count} รีวิว ${rating} ดาว`,
    certificate: 'ใบรับรอง',
    student: 'นักศึกษา',
    professor: 'อาจารย์',
  },
};
