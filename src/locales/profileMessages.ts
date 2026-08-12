import { SupportedLocale } from './LocaleProvider';

export interface ProfileMessages {
  loading: string;
  error: string;
  retry: string;
  edit: string;
  about: string;
  certificates: string;
  works: string;
  experience: string;
  reviews: string;
  rating: string;
  totalQuests: string;
  allReviews: string;
  noReviews: string;
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
  certificate: string;
  student: string;
  professor: string;
}

export const profileMessages: Record<SupportedLocale, ProfileMessages> = {
  en: {
    loading: 'Loading profile...',
    error: 'Unable to load your profile.',
    retry: 'Try again',
    edit: 'Edit Profile',
    about: 'About Me',
    certificates: 'Certificates',
    works: 'My work',
    experience: 'Experience',
    reviews: 'Reviews',
    rating: 'User Rating',
    totalQuests: 'Total Quests',
    allReviews: 'All',
    noReviews: 'No reviews yet.',
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
    noWorks: 'No work samples added yet.',
    certificate: 'Certificate',
    student: 'Student',
    professor: 'Professor',
  },
  th: {
    loading: 'กำลังโหลดโปรไฟล์...',
    error: 'ไม่สามารถโหลดโปรไฟล์ของคุณได้',
    retry: 'ลองใหม่อีกครั้ง',
    edit: 'แก้ไขโปรไฟล์',
    about: 'เกี่ยวกับฉัน',
    certificates: 'ใบรับรอง',
    works: 'ผลงานของฉัน',
    experience: 'ประสบการณ์',
    reviews: 'รีวิว',
    rating: 'คะแนนโปรไฟล์',
    totalQuests: 'เควสทั้งหมด',
    allReviews: 'ทั้งหมด',
    noReviews: 'ยังไม่มีรีวิว',
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
    noWorks: 'ยังไม่มีผลงาน',
    certificate: 'ใบรับรอง',
    student: 'นักศึกษา',
    professor: 'อาจารย์',
  },
};
