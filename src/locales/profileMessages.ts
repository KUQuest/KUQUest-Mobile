import { SupportedLocale } from './LocaleProvider';

export interface ProfileMessages {
  loading: string;
  error: string;
  edit: string;
  about: string;
  certificates: string;
  works: string;
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
    edit: 'Edit your profile',
    about: 'About me',
    certificates: 'Certificates',
    works: 'My work',
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
    edit: 'แก้ไขโปรไฟล์',
    about: 'เกี่ยวกับฉัน',
    certificates: 'ใบรับรอง',
    works: 'ผลงานของฉัน',
    noDescription: 'ยังไม่มีคำอธิบาย',
    noCertificates: 'ยังไม่มีใบรับรอง',
    noWorks: 'ยังไม่มีผลงาน',
    certificate: 'ใบรับรอง',
    student: 'นักศึกษา',
    professor: 'อาจารย์',
  },
};
