import { ApiError } from '../../api/ApiClient';
import { authService } from '../auth/AuthService';
import { AuthError } from '../auth/types';
import type { SupportedLocale } from '../../locales/LocaleProvider';
import type { ProfileExperience, ProfileReview, ProfileSectionErrors, ProfileViewData } from './components/ProfileComponents';
import { demoExperiences, demoProfileStats, demoProfileTags, demoReviews, isProfileDemoEnabled } from './profileDemoData';
import { selectTopProfileTags, sortExperiences, type OptionalReadResult } from './profileViewData';

function formatDate(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' }).format(date);
}

async function readOptional<T>(request: () => Promise<T>): Promise<OptionalReadResult<T>> {
  try {
    return { kind: 'value', value: await request() };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { kind: 'unsupported' };
    if (error instanceof ApiError && error.status === 401) throw new AuthError('SESSION_EXPIRED');
    return { kind: 'error', error };
  }
}

async function readRequired<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw new AuthError('SESSION_EXPIRED');
    throw error;
  }
}

function getValue<T>(result: OptionalReadResult<T>): T | undefined {
  return result.kind === 'value' ? result.value : undefined;
}

function hasReadError(result: OptionalReadResult<unknown>): boolean {
  return result.kind === 'error';
}

export async function loadProfileViewData(locale: SupportedLocale): Promise<ProfileViewData> {
  const demoEnabled = isProfileDemoEnabled();
  const session = await authService.getSession();
  if (!session) throw new AuthError('SESSION_EXPIRED', 'No active session');

  const api = await authService.getStudentApi();
  const profile = await readRequired(() => api.getProfile());
  const [statusResult, optionsResult, certificatesResult, portfolioResult, experiencesResult, reputationResult, reviewsResult] = await Promise.all([
    readOptional(() => api.getAcademicRegistrationStatus()),
    readOptional(() => api.getAcademicRegistrationOptions()),
    readOptional(() => api.listCertificates()),
    readOptional(() => api.listPortfolio()),
    readOptional(() => api.listExperience()),
    readOptional(() => api.getReputation()),
    readOptional(() => api.listReviews()),
  ]);

  const status = getValue(statusResult);
  const options = getValue(optionsResult);
  const occupation = options?.occupations.find((item) => item.id === status?.occupationId)?.name ?? '';
  const apiExperiences: ProfileExperience[] = (getValue(experiencesResult) ?? []).map((experience) => ({
    id: experience.id,
    title: experience.title,
    employmentType: experience.employmentType,
    organization: experience.organization ?? '',
    description: experience.description ?? '',
    startedAt: experience.startedAt,
    endedAt: experience.endedAt ?? null,
  }));
  const apiReviews: ProfileReview[] = (getValue(reviewsResult)?.items ?? []).map((review) => ({
    id: review.id,
    reviewerName: review.reviewer.displayName,
    reviewerAvatar: review.reviewer.avatar?.url ?? '',
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    questTitle: review.quest?.title ?? '',
  }));

  const sectionErrors: ProfileSectionErrors = {
    ...(hasReadError(experiencesResult) ? { experience: true } : {}),
    ...(hasReadError(portfolioResult) ? { works: true } : {}),
    ...(hasReadError(certificatesResult) ? { certificates: true } : {}),
    ...(hasReadError(reputationResult) ? { reputation: true } : {}),
    ...(hasReadError(reviewsResult) ? { reviews: true } : {}),
  };
  const certificates = getValue(certificatesResult) ?? [];
  const portfolio = getValue(portfolioResult) ?? [];
  const reputation = getValue(reputationResult);
  const reviews = getValue(reviewsResult);

  return {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || session.user.name,
    faculty: profile.department?.faculty.name ?? '',
    university: profile.university === undefined
      ? (demoEnabled ? 'State University' : '')
      : (profile.university ?? ''),
    occupation: profile.occupation?.name || occupation,
    academicYear: profile.academicYear === null ? '' : String(profile.academicYear ?? ''),
    department: profile.department?.name ?? '',
    tags: selectTopProfileTags(profile.tags
      ?? (profile.tags === undefined && demoEnabled ? demoProfileTags : [])),
    profileImage: profile.avatar?.url ?? session.user.image ?? '',
    about: profile.bio ?? '',
    stats: reputation
      ? { totalQuests: reputation.totalQuests, ratingAverage: reputation.rating.average, ratingCount: reputation.rating.count, distribution: reputation.rating.distribution }
      : (reputationResult.kind === 'unsupported' && demoEnabled
        ? demoProfileStats
        : { totalQuests: null, ratingAverage: null, ratingCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }),
    experiences: experiencesResult.kind === 'unsupported' && demoEnabled
      ? demoExperiences
      : sortExperiences(apiExperiences),
    certificates: certificates.map((certificate) => ({
      id: certificate.id,
      title: certificate.name,
      detail: `${certificate.issuer} · ${formatDate(certificate.issuedAt, locale)}`,
      link: certificate.image?.url ?? '',
    })),
    works: portfolio.map((entry) => ({
      id: entry.id,
      title: entry.title,
      detail: entry.description ?? '',
      imageUri: entry.images[0]?.url ?? '',
    })),
    reviews: reviews
      ? apiReviews
      : (reviewsResult.kind === 'unsupported' && demoEnabled ? demoReviews : []),
    sectionErrors,
  };
}
