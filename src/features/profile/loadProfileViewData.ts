import { ApiError } from '../../api/ApiClient';
import { authService } from '../auth/AuthService';
import { AuthError } from '../auth/types';
import type { SupportedLocale } from '../../locales/LocaleProvider';
import type { ProfileSectionErrors, ProfileViewData } from './components/ProfileComponents';
import { demoCertificates, demoExperiences, demoProfileIdentity, demoProfileImage, demoProfileStats, demoProfileTags, demoReviews, demoWorks, isProfileDemoEnabled } from './profileDemoData';
import { mapApiCertificateToView, mapApiExperienceToView, mapApiPortfolioToView, mapApiReviewToView } from './profileMappers';
import { sortExperiences, type OptionalReadResult } from './profileViewData';

const PROFILE_TAG_LIMIT = 3;

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

function getDemoProfileViewData(): ProfileViewData {
  return {
    name: demoProfileIdentity.name,
    faculty: demoProfileIdentity.faculty,
    university: 'State University',
    occupation: demoProfileIdentity.occupation,
    academicYear: '',
    department: demoProfileIdentity.department,
    tags: demoProfileTags.slice(0, PROFILE_TAG_LIMIT),
    profileImage: demoProfileImage,
    about: demoProfileIdentity.about,
    stats: demoProfileStats,
    experiences: demoExperiences,
    certificates: demoCertificates,
    works: demoWorks,
    reviews: demoReviews,
    sectionErrors: {},
  };
}

export async function loadProfileViewData(locale: SupportedLocale): Promise<ProfileViewData> {
  const demoEnabled = isProfileDemoEnabled();
  if (demoEnabled) return getDemoProfileViewData();

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
  const apiExperiences = (getValue(experiencesResult) ?? []).map(mapApiExperienceToView);
  const apiReviews = (getValue(reviewsResult)?.items ?? []).map(mapApiReviewToView);

  const sectionErrors: ProfileSectionErrors = {
    ...(hasReadError(experiencesResult) ? { experience: true } : {}),
    ...(hasReadError(portfolioResult) ? { works: true } : {}),
    ...(hasReadError(certificatesResult) ? { certificates: true } : {}),
    ...(hasReadError(reputationResult) ? { reputation: true } : {}),
    ...(hasReadError(reviewsResult) ? { reviews: true } : {}),
  };
  const apiCertificates = getValue(certificatesResult) ?? [];
  const portfolio = getValue(portfolioResult) ?? [];
  const reputation = getValue(reputationResult);
  const profileTags = profile.tags ?? [];
  return {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || session.user.name,
    faculty: profile.department?.faculty.name ?? '',
    university: profile.university === undefined ? '' : (profile.university ?? ''),
    occupation: profile.occupation?.name || occupation || '',
    academicYear: profile.academicYear === null ? '' : String(profile.academicYear ?? ''),
    department: profile.department?.name ?? '',
    tags: profileTags.slice(0, PROFILE_TAG_LIMIT),
    profileImage: profile.avatar
      ? { uri: profile.avatar.url, cacheKey: profile.avatar.fileId }
      : session.user.image ?? '',
    about: profile.bio ?? '',
    stats: reputation
      ? { totalQuests: reputation.totalQuests, ratingAverage: reputation.rating.average, ratingCount: reputation.rating.count, distribution: reputation.rating.distribution }
      : { totalQuests: null, ratingAverage: null, ratingCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
    experiences: apiExperiences.length > 0
      ? sortExperiences(apiExperiences)
      : [],
    certificates: apiCertificates.map((certificate) => mapApiCertificateToView(certificate, locale)),
    works: portfolio.length > 0
      ? portfolio.map(mapApiPortfolioToView)
      : [],
    reviews: apiReviews.length > 0
      ? apiReviews
      : [],
    sectionErrors,
  };
}
