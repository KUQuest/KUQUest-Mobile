import { AuthErrorCode } from '../features/auth/types';
import { SupportedLocale } from './LocaleProvider';

export interface AuthMessages {
  signUpWithGoogle: string;
  signInWithGoogle: string;
  subtitle: string;
  noticeTextPrefix: string;
  noticeEmailDomain: string;
  noticeTextSuffix: string;
  orDivider: string;
  termsOfService: string;
  privacyPolicy: string;
  contactUs: string;
  retryButton: string;
  loadingAuth: string;
  errors: Record<AuthErrorCode, string>;
}

export const authMessages: Record<SupportedLocale, AuthMessages> = {
  en: {
    signUpWithGoogle: 'Sign Up with Google',
    signInWithGoogle: 'Sign In with Google',
    subtitle: 'ACADEMIC VENTURE NETWORK',
    noticeTextPrefix: 'Please sign in with your',
    noticeEmailDomain: '@ku.th',
    noticeTextSuffix: 'student email to access the platform.',
    orDivider: 'or',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    contactUs: 'Contact Us',
    retryButton: 'Retry',
    loadingAuth: 'Authenticating...',
    errors: {
      INVALID_EMAIL_DOMAIN: 'Access restricted to @ku.th student email addresses only.',
      ACCOUNT_NOT_FOUND: 'Account not found. Please Sign Up with Google first.',
      ACCOUNT_ALREADY_EXISTS: 'Account already exists. You have been signed in.',
      OAUTH_CANCELLED: 'Google Sign-In was cancelled.',
      OAUTH_FAILED: 'Failed to sign in with Google. Please try again.',
      API_ERROR: 'Unable to connect to authentication server. Please retry.',
      SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
    },
  },
  th: {
    signUpWithGoogle: 'สมัครสมาชิกด้วย Google',
    signInWithGoogle: 'เข้าสู่ระบบด้วย Google',
    subtitle: 'เครือข่ายนวัตกรรมทางวิชาการ',
    noticeTextPrefix: 'กรุณาเข้าสู่ระบบด้วยอีเมลนิสิต',
    noticeEmailDomain: '@ku.th',
    noticeTextSuffix: 'เพื่อเข้าใช้งานระบบ',
    orDivider: 'หรือ',
    termsOfService: 'ข้อตกลงการใช้งาน',
    privacyPolicy: 'นโยบายความเป็นส่วนตัว',
    contactUs: 'ติดต่อเรา',
    retryButton: 'ลองใหม่อีกครั้ง',
    loadingAuth: 'กำลังตรวจสอบสิทธิ์...',
    errors: {
      INVALID_EMAIL_DOMAIN: 'จำกัดสิทธิ์เฉพาะอีเมลนิสิตที่ลงท้ายด้วย @ku.th เท่านั้น',
      ACCOUNT_NOT_FOUND: 'ไม่พบบัญชีผู้ใช้ กรุณากดสมัครสมาชิก (Sign Up with Google) ก่อน',
      ACCOUNT_ALREADY_EXISTS: 'มีบัญชีนี้ในระบบแล้ว ระบบได้นำท่านเข้าสู่ระบบเรียบร้อยแล้ว',
      OAUTH_CANCELLED: 'การเข้าสู่ระบบด้วย Google ถูกยกเลิก',
      OAUTH_FAILED: 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      API_ERROR: 'ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้ กรุณาลองใหม่อีกครั้ง',
      SESSION_EXPIRED: 'เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง',
    },
  },
};

export function getAuthErrorText(code: AuthErrorCode, locale: SupportedLocale = 'th'): string {
  return authMessages[locale].errors[code] || code;
}
