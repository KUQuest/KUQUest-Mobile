import type {
  AcademicRegistrationOptions,
  AcademicRegistrationStatus,
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
  ProfileResponse,
  ProfileReview as ApiProfileReview,
} from '../../api/contracts';
import type { SupportedLocale } from '../../locales/LocaleProvider';
import type { Certificate, Experience, ProfileDraft, Work } from './types';
import type { ProfileCertificate, ProfileExperience, ProfileReview, ProfileWork } from './components/ProfileComponents';

function formatDate(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' }).format(date);
}

export function mapApiCertificateToDraft(certificate: CertificateEntry): Certificate {
  return {
    id: certificate.id,
    name: certificate.name,
    issuer: certificate.issuer,
    issuedAt: certificate.issuedAt,
    imageUri: certificate.image?.url ?? '',
  };
}

export function mapApiPortfolioToDraft(entry: PortfolioEntry): Work {
  return {
    id: entry.id,
    title: entry.title,
    detail: entry.description ?? '',
    imageUri: entry.images[0]?.url ?? '',
  };
}

export function mapApiExperienceToDraft(entry: ExperienceEntry): Experience {
  return {
    id: entry.id,
    title: entry.title,
    employmentType: entry.employmentType,
    organization: entry.organization ?? '',
    description: entry.description ?? '',
    startedAt: entry.startedAt,
    endedAt: entry.endedAt ?? '',
  };
}

export function mapApiCertificateToView(certificate: CertificateEntry, locale: SupportedLocale): ProfileCertificate {
  return {
    id: certificate.id,
    title: certificate.name,
    issuer: certificate.issuer,
    issuedYear: formatDate(certificate.issuedAt, locale).split(' ').pop() ?? certificate.issuedAt,
    link: certificate.image?.url ?? '',
  };
}

export function mapApiPortfolioToView(entry: PortfolioEntry): ProfileWork {
  return {
    id: entry.id,
    title: entry.title,
    detail: entry.description ?? '',
    imageUri: entry.images[0]?.url ?? '',
  };
}

export function mapApiExperienceToView(entry: ExperienceEntry): ProfileExperience {
  return {
    id: entry.id,
    title: entry.title,
    employmentType: entry.employmentType,
    organization: entry.organization ?? '',
    description: entry.description ?? '',
    startedAt: entry.startedAt,
    endedAt: entry.endedAt ?? null,
  };
}

export function mapApiReviewToView(review: ApiProfileReview): ProfileReview {
  return {
    id: review.id,
    reviewerName: review.reviewer.displayName,
    reviewerAvatar: review.reviewer.avatar?.url ?? '',
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    questTitle: review.quest?.title ?? '',
  };
}

export interface ProfileDraftMapperInput {
  profile: ProfileResponse;
  status: AcademicRegistrationStatus;
  options: AcademicRegistrationOptions;
  certificates: CertificateEntry[];
  portfolio: PortfolioEntry[];
  experiences: ExperienceEntry[];
  fallbackName: string;
  fallbackImage: string;
}

export function mapProfileRecordsToDraft(input: ProfileDraftMapperInput): ProfileDraft {
  const departmentId = input.status.departmentId ?? input.profile.department?.id ?? '';
  const faculty = input.options.faculties.find((item) => item.departments.some((department) => department.id === departmentId));
  const firstName = input.status.firstName || input.profile.firstName;
  const lastName = input.status.lastName || input.profile.lastName;

  return {
    name: [firstName, lastName].filter(Boolean).join(' ') || input.fallbackName,
    telephone: input.status.telephone ?? input.profile.telephone ?? '',
    occupation: input.status.occupationId ?? '',
    studentId: input.status.studentId ?? input.profile.studentId ?? '',
    faculty: faculty?.id ?? '',
    department: departmentId,
    acceptedTerms: Boolean(input.status.termsAcceptedAt),
    description: input.profile.bio ?? '',
    profileImage: input.profile.avatar?.url ?? input.fallbackImage,
    certificates: input.certificates.map(mapApiCertificateToDraft),
    works: input.portfolio.map(mapApiPortfolioToDraft),
    experiences: input.experiences.map(mapApiExperienceToDraft),
  };
}
