import { authService } from '../auth/AuthService';
import { ApiError } from '../../api/ApiClient';
import type { SupportedLocale } from '../../locales/LocaleProvider';
import type { ProfileExperience, ProfileReview, ProfileViewData } from './components/ProfileComponents';
import { demoExperiences, demoProfileStats, demoProfileTags, demoReviews, isProfileDemoEnabled } from './profileDemoData';

function formatDate(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' }).format(date);
}

async function loadOptional<T>(request: () => Promise<T>): Promise<T | undefined> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function loadProfileViewData(locale: SupportedLocale): Promise<ProfileViewData> {
  const session = await authService.getSession();
  if (!session) throw new Error('No active session');

  const api = await authService.getStudentApi();
  const [profile, certificates, portfolio, status, options, experiencesResult, reputationResult, reviewsResult] = await Promise.all([
    api.getProfile(),
    api.listCertificates(),
    api.listPortfolio(),
    api.getAcademicRegistrationStatus(),
    api.getAcademicRegistrationOptions(),
    loadOptional(() => api.listExperience()),
    loadOptional(() => api.getReputation()),
    loadOptional(() => api.listReviews()),
  ]);
  const occupation = options.occupations.find((item) => item.id === status.occupationId)?.name ?? '';
  const apiExperiences: ProfileExperience[] = (experiencesResult ?? [])
    .map((experience) => ({
      id: experience.id,
      title: experience.title,
      employmentType: experience.employmentType,
      organization: experience.organization ?? '',
      description: experience.description ?? '',
      startedAt: experience.startedAt,
      endedAt: experience.endedAt ?? null,
    }))
    .sort((left, right) => {
      if (left.endedAt === null && right.endedAt !== null) return -1;
      if (left.endedAt !== null && right.endedAt === null) return 1;
      return right.startedAt.localeCompare(left.startedAt);
    });
  const apiReviews: ProfileReview[] = (reviewsResult?.items ?? []).map((review) => ({
    id: review.id,
    reviewerName: review.reviewer.displayName,
    reviewerAvatar: review.reviewer.avatar?.url ?? '',
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    questTitle: review.quest?.title ?? '',
  }));

  return {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || session.user.name,
    faculty: profile.department?.faculty.name ?? '',
    university: profile.university === undefined
      ? (isProfileDemoEnabled ? 'State University' : '')
      : (profile.university ?? ''),
    occupation: profile.occupation?.name ?? occupation,
    department: profile.department?.name ?? '',
    tags: profile.tags?.slice(0, 3) ?? (profile.tags === undefined && isProfileDemoEnabled ? demoProfileTags : []),
    profileImage: profile.avatar?.url ?? session.user.image ?? '',
    about: profile.bio ?? '',
    stats: reputationResult
      ? { totalQuests: reputationResult.totalQuests, ratingAverage: reputationResult.rating.average, ratingCount: reputationResult.rating.count, distribution: reputationResult.rating.distribution }
      : (isProfileDemoEnabled ? demoProfileStats : { totalQuests: null, ratingAverage: null, ratingCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }),
    experiences: isProfileDemoEnabled && apiExperiences.length === 0
      ? demoExperiences
      : (experiencesResult !== undefined ? apiExperiences : []),
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
    reviews: reviewsResult !== undefined
      ? apiReviews
      : (isProfileDemoEnabled ? demoReviews : []),
  };
}
