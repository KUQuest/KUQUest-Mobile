import { ApiError } from "../../../api/ApiClient";
import type {
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
  ProfileReview as ApiProfileReview,
} from "../../../api/contracts";
import type {
  CertificateCreate,
  ExperienceCreate,
  PortfolioCreate,
  UploadAsset,
} from "../../../api/StudentApi";
import { authService } from "../../auth/AuthService";
import { AuthError } from "../../auth/types";
import type { SupportedLocale } from "../../../locales/LocaleProvider";
import type {
  ProfileAdapter,
  ProfileBasicsUpdate,
  ProfileCertificate,
  ProfileEditData,
  ProfileExperience,
  ProfileReview,
  ProfileSectionErrors,
  ProfileViewData,
  ProfileWork,
} from "../types";

const PROFILE_TAG_LIMIT = 3;

type OptionalReadResult<T> =
  | { kind: "value"; value: T }
  | { kind: "unsupported" }
  | { kind: "error"; error: unknown };

async function readOptional<T>(
  request: () => Promise<T>
): Promise<OptionalReadResult<T>> {
  try {
    return { kind: "value", value: await request() };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404)
      return { kind: "unsupported" };
    if (error instanceof ApiError && error.status === 401)
      throw new AuthError("SESSION_EXPIRED");
    return { kind: "error", error };
  }
}

async function readRequired<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      throw new AuthError("SESSION_EXPIRED");
    throw error;
  }
}

function formatDate(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(date);
}

function mapApiCertificateToView(
  certificate: CertificateEntry,
  locale: SupportedLocale
): ProfileCertificate {
  return {
    id: certificate.id,
    title: certificate.name,
    issuer: certificate.issuer,
    issuedYear:
      formatDate(certificate.issuedAt, locale).split(" ").pop() ??
      certificate.issuedAt,
    link: certificate.image?.url ?? "",
  };
}

function mapApiPortfolioToView(entry: PortfolioEntry): ProfileWork {
  return {
    id: entry.id,
    title: entry.title,
    detail: entry.description ?? "",
    imageUri: entry.images[0]?.url ?? "",
    imageUris: entry.images
      .slice()
      .sort((left, right) => Number(left.position) - Number(right.position))
      .map((image) => image.url),
  };
}

function mapApiExperienceToView(entry: ExperienceEntry): ProfileExperience {
  return {
    id: entry.id,
    title: entry.title,
    employmentType: entry.employmentType,
    organization: entry.organization ?? "",
    description: entry.description ?? "",
    startedAt: entry.startedAt,
    endedAt: entry.endedAt ?? null,
  };
}

function mapApiReviewToView(review: ApiProfileReview): ProfileReview {
  return {
    id: review.id,
    reviewerName: review.reviewer.displayName,
    reviewerAvatar: review.reviewer.avatar?.url ?? "",
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    questTitle: review.quest?.title ?? "",
  };
}

function sortExperiences(
  experiences: ProfileExperience[]
): ProfileExperience[] {
  return experiences
    .map((experience, index) => ({ experience, index }))
    .sort((left, right) => {
      const leftStartedAt = Date.parse(left.experience.startedAt);
      const rightStartedAt = Date.parse(right.experience.startedAt);
      const leftTime = Number.isNaN(leftStartedAt)
        ? Number.NEGATIVE_INFINITY
        : leftStartedAt;
      const rightTime = Number.isNaN(rightStartedAt)
        ? Number.NEGATIVE_INFINITY
        : rightStartedAt;
      return rightTime - leftTime || left.index - right.index;
    })
    .map(({ experience }) => experience);
}

export class LiveProfileAdapter implements ProfileAdapter {
  async loadProfile(locale: SupportedLocale): Promise<ProfileViewData> {
    const session = await authService.getSession();
    if (!session) throw new AuthError("SESSION_EXPIRED", "No active session");

    const api = await authService.getStudentApi();
    const profile = await readRequired(() => api.getProfile());
    const [
      statusResult,
      optionsResult,
      certificatesResult,
      portfolioResult,
      experiencesResult,
      reputationResult,
      reviewsResult,
    ] = await Promise.all([
      readOptional(() => api.getAcademicRegistrationStatus()),
      readOptional(() => api.getAcademicRegistrationOptions()),
      readOptional(() => api.listCertificates()),
      readOptional(() => api.listPortfolio()),
      readOptional(() => api.listExperience()),
      readOptional(() => api.getReputation()),
      readOptional(() => api.listReviews()),
    ]);

    const status =
      statusResult.kind === "value" ? statusResult.value : undefined;
    const options =
      optionsResult.kind === "value" ? optionsResult.value : undefined;
    const occupation =
      options?.occupations.find((item) => item.id === status?.occupationId)
        ?.name ?? "";
    const apiExperiences = (
      experiencesResult.kind === "value" ? experiencesResult.value : []
    ).map(mapApiExperienceToView);
    const apiReviews = (
      reviewsResult.kind === "value" ? reviewsResult.value.items : []
    ).map(mapApiReviewToView);

    const sectionErrors: ProfileSectionErrors = {
      ...(experiencesResult.kind === "error" ? { experience: true } : {}),
      ...(portfolioResult.kind === "error" ? { works: true } : {}),
      ...(certificatesResult.kind === "error" ? { certificates: true } : {}),
      ...(reputationResult.kind === "error" ? { reputation: true } : {}),
      ...(reviewsResult.kind === "error" ? { reviews: true } : {}),
    };
    const apiCertificates =
      certificatesResult.kind === "value" ? certificatesResult.value : [];
    const portfolio =
      portfolioResult.kind === "value" ? portfolioResult.value : [];
    const reputation =
      reputationResult.kind === "value" ? reputationResult.value : undefined;
    const profileTags = profile.tags ?? [];

    return {
      name:
        [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
        session.user.name,
      faculty: profile.department?.faculty.name ?? "",
      university:
        profile.university === undefined ? "" : (profile.university ?? ""),
      occupation: profile.occupation?.name || occupation || "",
      academicYear:
        profile.academicYear === null ? "" : String(profile.academicYear ?? ""),
      department: profile.department?.name ?? "",
      tags: profileTags.slice(0, PROFILE_TAG_LIMIT),
      profileImage: profile.avatar
        ? { uri: profile.avatar.url, cacheKey: profile.avatar.fileId }
        : (session.user.image ?? ""),
      about: profile.bio ?? "",
      stats: reputation
        ? {
            totalQuests: reputation.totalQuests,
            ratingAverage: reputation.rating.average,
            ratingCount: reputation.rating.count,
            distribution: reputation.rating.distribution,
          }
        : {
            totalQuests: null,
            ratingAverage: null,
            ratingCount: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          },
      experiences:
        apiExperiences.length > 0 ? sortExperiences(apiExperiences) : [],
      certificates: apiCertificates.map((certificate) =>
        mapApiCertificateToView(certificate, locale)
      ),
      works: portfolio.length > 0 ? portfolio.map(mapApiPortfolioToView) : [],
      reviews: apiReviews.length > 0 ? apiReviews : [],
      sectionErrors,
    };
  }

  async getEditData(): Promise<ProfileEditData> {
    const profileApi = await authService.getProfileApi();
    return profileApi.getEditData();
  }

  async updateBasics(update: ProfileBasicsUpdate) {
    const profileApi = await authService.getProfileApi();
    return profileApi.updateBasics(update);
  }

  async uploadAvatar(asset: UploadAsset) {
    const profileApi = await authService.getProfileApi();
    return profileApi.uploadAvatar(asset);
  }

  async createExperience(entry: ExperienceCreate) {
    const profileApi = await authService.getProfileApi();
    return profileApi.createExperience(entry);
  }

  async updateExperience(id: string, update: Partial<ExperienceCreate>) {
    const profileApi = await authService.getProfileApi();
    return profileApi.updateExperience(id, update);
  }

  async deleteExperience(id: string) {
    const profileApi = await authService.getProfileApi();
    return profileApi.deleteExperience(id);
  }

  async createPortfolio(entry: PortfolioCreate) {
    const profileApi = await authService.getProfileApi();
    return profileApi.createPortfolio(entry);
  }

  async updatePortfolio(
    id: string,
    update: { title?: string; description?: string | null }
  ) {
    const profileApi = await authService.getProfileApi();
    return profileApi.updatePortfolio(id, update);
  }

  async uploadPortfolioImage(id: string, asset: UploadAsset) {
    const profileApi = await authService.getProfileApi();
    return profileApi.uploadPortfolioImage(id, asset);
  }

  async deletePortfolioImage(id: string) {
    const profileApi = await authService.getProfileApi();
    return profileApi.deletePortfolioImage(id);
  }

  async deletePortfolio(id: string) {
    const profileApi = await authService.getProfileApi();
    return profileApi.deletePortfolio(id);
  }

  async createCertificate(entry: CertificateCreate) {
    const profileApi = await authService.getProfileApi();
    return profileApi.createCertificate(entry);
  }

  async updateCertificate(id: string, update: CertificateCreate) {
    const profileApi = await authService.getProfileApi();
    return profileApi.updateCertificate(id, update);
  }

  async uploadCertificateImage(id: string, asset: UploadAsset) {
    const profileApi = await authService.getProfileApi();
    return profileApi.uploadCertificateImage(id, asset);
  }

  async deleteCertificateImage(id: string) {
    const profileApi = await authService.getProfileApi();
    return profileApi.deleteCertificateImage(id);
  }

  async deleteCertificate(id: string) {
    const profileApi = await authService.getProfileApi();
    return profileApi.deleteCertificate(id);
  }
}
