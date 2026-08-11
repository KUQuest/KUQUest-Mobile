import { authService } from '../auth/AuthService';
import type { SupportedLocale } from '../../locales/LocaleProvider';
import type { ProfileViewData } from './components/ProfileComponents';

function formatDate(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' }).format(date);
}

export async function loadProfileViewData(locale: SupportedLocale): Promise<ProfileViewData> {
  const session = await authService.getSession();
  if (!session) throw new Error('No active session');

  const api = await authService.getStudentApi();
  const [profile, certificates, portfolio, status, options] = await Promise.all([
    api.getProfile(),
    api.listCertificates(),
    api.listPortfolio(),
    api.getAcademicRegistrationStatus(),
    api.getAcademicRegistrationOptions(),
  ]);
  const occupation = options.occupations.find((item) => item.id === status.occupationId)?.name ?? '';

  return {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || session.user.name,
    faculty: profile.department?.faculty.name ?? '',
    occupation,
    department: profile.department?.name ?? '',
    profileImage: profile.avatar?.url ?? session.user.image ?? '',
    about: profile.bio ?? '',
    certificates: certificates.map((certificate) => ({
      title: certificate.name,
      detail: `${certificate.issuer} · ${formatDate(certificate.issuedAt, locale)}`,
      link: certificate.image?.url ?? '',
    })),
    works: portfolio.map((entry) => ({
      title: entry.title,
      detail: entry.description ?? '',
      imageUri: entry.images[0]?.url ?? '',
    })),
  };
}
