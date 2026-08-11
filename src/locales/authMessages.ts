import { AuthErrorCode } from '../features/auth/types';
import { SupportedLocale } from './LocaleProvider';

export interface AuthMessages {
  signInWithGoogle: string;
  subtitle: string;
  noticeTextPrefix: string;
  noticeEmailDomain: string;
  noticeTextSuffix: string;
  termsOfService: string;
  privacyPolicy: string;
  contactUs: string;
  retryButton: string;
  loadingAuth: string;
  errors: Record<AuthErrorCode, string>;
}

export const authMessages: Record<SupportedLocale, AuthMessages> = {
  en: {
    signInWithGoogle: 'Sign In with Google',
    subtitle: 'ACADEMIC VENTURE NETWORK',
    noticeTextPrefix: 'Please sign in with your',
    noticeEmailDomain: '@ku.th',
    noticeTextSuffix: 'student email to access the platform.',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    contactUs: 'Contact Us',
    retryButton: 'Retry',
    loadingAuth: 'Authenticating...',
    errors: {
      INVALID_EMAIL_DOMAIN: 'Access restricted to @ku.th student email addresses only.',
      OAUTH_CANCELLED: 'Google Sign-In was cancelled.',
      PLAY_SERVICES_UNAVAILABLE: 'Google Play Services is unavailable on this device.',
      OAUTH_FAILED: 'Failed to sign in with Google. Please try again.',
      API_ERROR: 'Unable to connect to authentication server. Please retry.',
      SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
    },
  },
  th: {
    signInWithGoogle: 'เข้าสู่ระบบด้วย Google',
    subtitle: 'เครือข่ายนวัตกรรมทางวิชาการ',
    noticeTextPrefix: 'กรุณาเข้าสู่ระบบด้วยอีเมลนิสิต',
    noticeEmailDomain: '@ku.th',
    noticeTextSuffix: 'เพื่อเข้าใช้งานระบบ',
    termsOfService: 'ข้อตกลงการใช้งาน',
    privacyPolicy: 'นโยบายความเป็นส่วนตัว',
    contactUs: 'ติดต่อเรา',
    retryButton: 'ลองใหม่อีกครั้ง',
    loadingAuth: 'กำลังตรวจสอบสิทธิ์...',
    errors: {
      INVALID_EMAIL_DOMAIN: 'จำกัดสิทธิ์เฉพาะอีเมลนิสิตที่ลงท้ายด้วย @ku.th เท่านั้น',
      OAUTH_CANCELLED: 'การเข้าสู่ระบบด้วย Google ถูกยกเลิก',
      PLAY_SERVICES_UNAVAILABLE: 'อุปกรณ์นี้ไม่พร้อมใช้งาน Google Play Services',
      OAUTH_FAILED: 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      API_ERROR: 'ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้ กรุณาลองใหม่อีกครั้ง',
      SESSION_EXPIRED: 'เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง',
    },
  },
};

export function getAuthErrorText(code: AuthErrorCode, locale: SupportedLocale = 'th'): string {
  return authMessages[locale].errors[code] || code;
}
