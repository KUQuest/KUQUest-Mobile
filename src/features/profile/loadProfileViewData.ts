import { ApiError } from '../../api/ApiClient';
import { authService } from '../auth/AuthService';
import { AuthError } from '../auth/types';
import type { SupportedLocale } from '../../locales/LocaleProvider';
import type { ProfileSectionErrors, ProfileViewData } from './components/ProfileComponents';
import { demoCertificates, demoExperiences, demoProfileIdentity, demoProfileImage, demoProfileStats, demoProfileTags, demoReviews, demoWorks, isProfileDemoEnabled } from './profileDemoData';
import { mapApiCertificateToView, mapApiExperienceToView, mapApiPortfolioToView, mapApiReviewToView } from './profileMappers';
import { selectTopProfileTags, sortExperiences, type OptionalReadResult } from './profileViewData';

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
  const apiExperiences = (getValue(experiencesResult) ?? []).map(mapApiExperienceToView);
  const apiReviews = (getValue(reviewsResult)?.items ?? []).map(mapApiReviewToView);

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
  return {
    name: demoEnabled && !profile.firstName && !profile.lastName
      ? demoProfileIdentity.name
      : ([profile.firstName, profile.lastName].filter(Boolean).join(' ') || session.user.name),
    faculty: profile.department?.faculty.name ?? (demoEnabled ? demoProfileIdentity.faculty : ''),
    university: profile.university === undefined
      ? (demoEnabled ? 'State University' : '')
      : (profile.university ?? ''),
    occupation: profile.occupation?.name || occupation || (demoEnabled ? demoProfileIdentity.occupation : ''),
    academicYear: profile.academicYear === null ? '' : String(profile.academicYear ?? ''),
    department: profile.department?.name ?? (demoEnabled ? demoProfileIdentity.department : ''),
    tags: selectTopProfileTags(profile.tags
      ?? (profile.tags === undefined && demoEnabled ? demoProfileTags : [])),
    profileImage: profile.avatar?.url ?? session.user.image ?? (demoEnabled ? demoProfileImage : ''),
    about: profile.bio ?? (demoEnabled ? demoProfileIdentity.about : ''),
    stats: reputation
      ? { totalQuests: reputation.totalQuests, ratingAverage: reputation.rating.average, ratingCount: reputation.rating.count, distribution: reputation.rating.distribution }
      : (reputationResult.kind === 'unsupported' && demoEnabled
        ? demoProfileStats
        : { totalQuests: null, ratingAverage: null, ratingCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }),
    experiences: apiExperiences.length > 0
      ? sortExperiences(apiExperiences)
      : (demoEnabled && experiencesResult.kind !== 'error' ? demoExperiences : []),
    certificates: certificates.length > 0
      ? certificates.map((certificate) => mapApiCertificateToView(certificate, locale))
      : (demoEnabled && certificatesResult.kind !== 'error' ? demoCertificates : []),
    works: portfolio.length > 0
      ? portfolio.map(mapApiPortfolioToView)
      : (demoEnabled && portfolioResult.kind !== 'error' ? demoWorks : []),
    reviews: apiReviews.length > 0
      ? apiReviews
      : (demoEnabled && reviewsResult.kind !== 'error' ? demoReviews : []),
    sectionErrors,
  };
}
