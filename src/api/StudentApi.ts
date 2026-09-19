import { ApiClient, ApiError } from "./ApiClient";
import type { RequestOptions } from "./WalletApi";
import {
  appendUploadFile,
  fileNameFromUri,
  mimeTypeFromUri,
  type UploadAsset,
} from "./fileUpload";
import {
  academicRegistrationOptionsResponseSchema,
  academicRegistrationStatusResponseSchema,
  avatarMutationResponseSchema,
  certificateResponseSchema,
  certificateCreateResponseSchema,
  experienceMutationResponseSchema,
  experienceResponseSchema,
  portfolioResponseSchema,
  portfolioCreateResponseSchema,
  profileResponseSchema,
  reputationResponseSchema,
  reviewsResponseSchema,
  publicProfileResponseSchema,
  publicProfileReviewsResponseSchema,
  successResponseSchema,
  type AcademicRegistrationOptions,
  type AcademicRegistrationStatus,
  type CertificateEntry,
  type ExperienceEntry,
  type PortfolioEntry,
  type ProfileResponse,
  type ProfileReview,
  type Reputation,
  type PublicProfileResponse,
  type PublicProfileReviewsData,
} from "./contracts";
export type { UploadAsset };

export interface AcademicRegistrationUpdate {
  firstName?: string;
  lastName?: string;
  telephone?: string;
  occupationId?: string;
  studentId?: string;
  departmentId?: string;
  termsVersion?: string;
}

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  bio?: string;
  telephone?: string;
  departmentId?: string;
}

export type ProfileEditSection = "experience" | "portfolio" | "certificates";
export type ProfileEditSectionErrors = Partial<
  Record<ProfileEditSection, true>
>;

export interface ProfileEditData {
  profile: ProfileResponse;
  experiences: ExperienceEntry[];
  portfolio: PortfolioEntry[];
  certificates: CertificateEntry[];
  sectionErrors: ProfileEditSectionErrors;
  sectionUnavailable: ProfileEditSectionErrors;
}

export type ProfileBasicsUpdate = Pick<
  ProfileUpdate,
  "firstName" | "lastName" | "bio" | "telephone" | "departmentId"
>;

export interface PortfolioCreate {
  title: string;
  description?: string;
  imageUris: string[];
}

export interface CertificateCreate {
  name: string;
  issuer: string;
  issuedAt: string;
}

export interface ExperienceCreate {
  title: string;
  employmentType: string;
  organization?: string | null;
  description?: string | null;
  startedAt: string;
  endedAt?: string | null;
}

export interface MutationOptions {
  idempotencyKey?: string;
}

function mutationHeaders(
  options?: MutationOptions
): Record<string, string> | undefined {
  return options?.idempotencyKey
    ? { "Idempotency-Key": options.idempotencyKey }
    : undefined;
}

function studentApiDebug(
  message: string,
  details: Record<string, unknown> = {}
): void {
  if (__DEV__) {
    console.log(`[student-api] ${message}`, details);
  }
}

function getErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof ApiError) {
    return {
      name: error.name,
      status: error.status,
      code: error.code,
      message: error.message,
    };
  }
  if (error instanceof Error) {
    const issues =
      "issues" in error && Array.isArray(error.issues)
        ? error.issues.map((issue: { path?: unknown; message?: unknown }) => ({
            path: issue.path,
            message: issue.message,
          }))
        : undefined;
    return {
      name: error.name,
      message: error.message,
      ...(issues ? { issues } : {}),
    };
  }
  return { message: String(error) };
}

type OptionalCollectionResult<T> = {
  items: T[];
  unavailable: boolean;
};

async function readOptionalCollection<T>(
  request?: () => Promise<T[]>
): Promise<OptionalCollectionResult<T>> {
  if (!request) return { items: [], unavailable: true };

  try {
    return { items: await request(), unavailable: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { items: [], unavailable: true };
    }
    throw error;
  }
}

type CollectionResult<T> = {
  items: T[];
  failed: boolean;
  unavailable: boolean;
};

async function readCollection<T>(
  request: () => Promise<T[]>
): Promise<CollectionResult<T>> {
  try {
    const result = await readOptionalCollection(request);
    return { ...result, failed: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error;
    return { items: [], failed: true, unavailable: false };
  }
}

export class StudentApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  private async trace<T>(
    operation: string,
    details: Record<string, unknown>,
    action: () => Promise<T>
  ): Promise<T> {
    studentApiDebug(`${operation} started`, details);
    try {
      const result = await action();
      studentApiDebug(`${operation} succeeded`, details);
      return result;
    } catch (error) {
      studentApiDebug(`${operation} failed`, {
        ...details,
        error: getErrorDetails(error),
      });
      throw error;
    }
  }

  async getAcademicRegistrationOptions(
    options?: RequestOptions
  ): Promise<AcademicRegistrationOptions> {
    const body = await this.client.request<unknown>(
      "/api/v1/academic-registration/options",
      { signal: options?.signal }
    );
    return academicRegistrationOptionsResponseSchema.parse(body).data;
  }

  async getAcademicRegistrationStatus(
    options?: RequestOptions
  ): Promise<AcademicRegistrationStatus> {
    const body = await this.client.request<unknown>(
      "/api/v1/academic-registration/status",
      { signal: options?.signal }
    );
    return academicRegistrationStatusResponseSchema.parse(body).data;
  }

  async updateAcademicRegistration(
    update: AcademicRegistrationUpdate,
    options?: MutationOptions
  ): Promise<void> {
    return this.trace(
      "academic registration update",
      {
        hasFirstName: Boolean(update.firstName),
        hasLastName: Boolean(update.lastName),
        hasTelephone: Boolean(update.telephone),
        hasOccupationId: Boolean(update.occupationId),
        hasStudentId: Boolean(update.studentId),
        hasDepartmentId: Boolean(update.departmentId),
        hasTermsVersion: Boolean(update.termsVersion),
      },
      async () => {
        if (!Object.values(update).some((value) => value !== undefined)) {
          throw new ApiError(
            400,
            "VALIDATION_ERROR",
            "Academic Registration update must contain at least one field"
          );
        }
        const body = await this.client.requestJson<unknown>(
          "/api/v1/academic-registration",
          update,
          { method: "PATCH", headers: mutationHeaders(options) }
        );
        successResponseSchema.parse(body);
      }
    );
  }

  async getProfile(options?: RequestOptions): Promise<ProfileResponse> {
    const body = await this.client.request<unknown>("/api/v1/profile", {
      signal: options?.signal,
    });
    return profileResponseSchema.parse(body).data;
  }
  async getPublicProfile(
    userId: string,
    options?: RequestOptions
  ): Promise<PublicProfileResponse> {
    const body = await this.client.request<unknown>(
      `/api/v1/profile/${userId}`,
      { signal: options?.signal }
    );
    return publicProfileResponseSchema.parse(body).data;
  }

  async listPublicReviews(
    userId: string,
    rating?: number,
    options?: RequestOptions
  ): Promise<PublicProfileReviewsData> {
    const query = rating ? `?rating=${rating}` : "";
    const body = await this.client.request<unknown>(
      `/api/v1/profile/${userId}/reviews${query}`,
      { signal: options?.signal }
    );
    return publicProfileReviewsResponseSchema.parse(body).data;
  }

  async updateProfile(
    update: ProfileUpdate,
    options?: MutationOptions
  ): Promise<void> {
    return this.trace(
      "profile update",
      {
        hasFirstName: Boolean(update.firstName),
        hasLastName: Boolean(update.lastName),
        hasBio: update.bio !== undefined,
        hasTelephone: Boolean(update.telephone),
        hasDepartmentId: Boolean(update.departmentId),
      },
      async () => {
        const normalizedUpdate: ProfileUpdate = {
          ...(update.firstName === undefined
            ? {}
            : { firstName: update.firstName }),
          ...(update.lastName === undefined
            ? {}
            : { lastName: update.lastName }),
          ...(update.bio?.trim() ? { bio: update.bio.trim() } : {}),
          ...(update.telephone === undefined
            ? {}
            : { telephone: update.telephone }),
          ...(update.departmentId === undefined
            ? {}
            : { departmentId: update.departmentId }),
        };
        const body = await this.client.requestJson<unknown>(
          "/api/v1/profile",
          normalizedUpdate,
          { method: "PATCH", headers: mutationHeaders(options) }
        );
        successResponseSchema.parse(body);
      }
    );
  }

  async getEditData(options?: RequestOptions): Promise<ProfileEditData> {
    const [profile, experiences, portfolio, certificates] = await Promise.all([
      this.getProfile(options),
      readCollection(() => this.listExperience(options)),
      readCollection(() => this.listPortfolio(options)),
      readCollection(() => this.listCertificates(options)),
    ]);

    const sectionErrors: ProfileEditSectionErrors = {
      ...(experiences.failed ? { experience: true } : {}),
      ...(portfolio.failed ? { portfolio: true } : {}),
      ...(certificates.failed ? { certificates: true } : {}),
    };
    const sectionUnavailable: ProfileEditSectionErrors = {
      ...(experiences.unavailable ? { experience: true } : {}),
      ...(portfolio.unavailable ? { portfolio: true } : {}),
      ...(certificates.unavailable ? { certificates: true } : {}),
    };

    return {
      profile,
      experiences: experiences.items,
      portfolio: portfolio.items,
      certificates: certificates.items,
      sectionErrors,
      sectionUnavailable,
    };
  }

  async updateBasics(update: ProfileBasicsUpdate): Promise<ProfileResponse> {
    const normalizedUpdate: ProfileBasicsUpdate = {
      ...(update.firstName === undefined
        ? {}
        : { firstName: update.firstName }),
      ...(update.lastName === undefined ? {} : { lastName: update.lastName }),
      ...(update.bio?.trim() ? { bio: update.bio.trim() } : {}),
      ...(update.telephone === undefined
        ? {}
        : { telephone: update.telephone }),
      ...(update.departmentId === undefined
        ? {}
        : { departmentId: update.departmentId }),
    };
    await this.updateProfile(normalizedUpdate);
    return this.getProfile();
  }

  async listExperience(options?: RequestOptions): Promise<ExperienceEntry[]> {
    const body = await this.client.request<unknown>(
      "/api/v1/profile/experience",
      { signal: options?.signal }
    );
    return experienceResponseSchema.parse(body).data;
  }

  async createExperience(
    entry: ExperienceCreate,
    options?: MutationOptions
  ): Promise<ExperienceEntry | undefined> {
    const body = await this.client.requestJson<unknown>(
      "/api/v1/profile/experience",
      entry,
      { method: "POST", headers: mutationHeaders(options) }
    );
    return experienceMutationResponseSchema.parse(body).data?.experience;
  }

  async updateExperience(
    id: string,
    update: Partial<ExperienceCreate>,
    options?: MutationOptions
  ): Promise<ExperienceEntry | undefined> {
    const body = await this.client.requestJson<unknown>(
      `/api/v1/profile/experience/${id}`,
      update,
      { method: "PATCH", headers: mutationHeaders(options) }
    );
    return experienceMutationResponseSchema.parse(body).data?.experience;
  }

  async deleteExperience(id: string): Promise<void> {
    const body = await this.client.request<unknown>(
      `/api/v1/profile/experience/${id}`,
      { method: "DELETE" }
    );
    successResponseSchema.parse(body);
  }

  async getReputation(options?: RequestOptions): Promise<Reputation> {
    const body = await this.client.request<unknown>(
      "/api/v1/profile/reputation",
      { signal: options?.signal }
    );
    return reputationResponseSchema.parse(body).data;
  }

  async listReviews(
    rating: "all" | 5 | 4 | 3 | 2 | 1 = "all",
    options?: RequestOptions
  ): Promise<{
    items: ProfileReview[];
    total: number;
    nextCursor?: string | null;
  }> {
    const query = rating === "all" ? "" : `?rating=${rating}`;
    const body = await this.client.request<unknown>(
      `/api/v1/profile/reviews${query}`,
      { signal: options?.signal }
    );
    const parsed = reviewsResponseSchema.parse(body).data;
    return {
      items: parsed.items,
      total: parsed.total,
      nextCursor: parsed.nextCursor,
    };
  }

  async uploadAvatar(
    asset: UploadAsset,
    options?: MutationOptions
  ): Promise<string | null> {
    const mimeType = asset.type || mimeTypeFromUri(asset.uri);
    const ext =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";
    const fileName = asset.name ?? fileNameFromUri(asset.uri, `avatar.${ext}`);
    return this.trace(
      "avatar upload",
      {
        fileName,
        mimeType,
      },
      async () => {
        const formData = new FormData();
        appendUploadFile(formData, "avatar", {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        });
        const body = await this.client.requestForm<unknown>(
          "/api/v1/profile/avatar",
          formData,
          { method: "POST", headers: mutationHeaders(options) }
        );
        return avatarMutationResponseSchema.parse(body).data.fileId;
      }
    );
  }

  async listPortfolio(options?: RequestOptions): Promise<PortfolioEntry[]> {
    const body = await this.client.request<unknown>(
      "/api/v1/profile/portfolio",
      { signal: options?.signal }
    );
    return portfolioResponseSchema.parse(body).data;
  }

  async createPortfolio(
    entry: PortfolioCreate,
    options?: MutationOptions
  ): Promise<string> {
    return this.trace(
      "portfolio create",
      {
        titleLength: entry.title.length,
        descriptionLength: entry.description?.length ?? 0,
        imageCount: entry.imageUris.length,
        localImageCount: entry.imageUris.filter(
          (uri) => !/^https?:\/\//i.test(uri)
        ).length,
      },
      async () => {
        const formData = new FormData();
        formData.append("title", entry.title);
        if (entry.description)
          formData.append("description", entry.description);
        entry.imageUris.forEach((uri, index) =>
          appendUploadFile(
            formData,
            "images",
            {
              uri,
              name: fileNameFromUri(uri, `portfolio-${index}.jpg`),
            },
            `portfolio-${index}`
          )
        );
        const body = await this.client.requestForm<unknown>(
          "/api/v1/profile/portfolio",
          formData,
          { method: "POST", headers: mutationHeaders(options) }
        );
        return portfolioCreateResponseSchema.parse(body).data.id;
      }
    );
  }

  async updatePortfolio(
    id: string,
    update: { title?: string; description?: string | null },
    options?: MutationOptions
  ): Promise<void> {
    return this.trace(
      "portfolio update",
      {
        id,
        titleLength: update.title?.length ?? 0,
        descriptionLength: update.description?.length ?? 0,
      },
      async () => {
        const body = await this.client.requestJson<unknown>(
          `/api/v1/profile/portfolio/${id}`,
          update,
          { method: "PATCH", headers: mutationHeaders(options) }
        );
        successResponseSchema.parse(body);
      }
    );
  }

  async uploadPortfolioImage(
    id: string,
    asset: UploadAsset,
    options?: MutationOptions
  ): Promise<void> {
    const mimeType = asset.type || mimeTypeFromUri(asset.uri);
    const ext =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";
    const fileName =
      asset.name ?? fileNameFromUri(asset.uri, `portfolio.${ext}`);
    return this.trace(
      "portfolio image upload",
      {
        id,
        fileName,
        mimeType,
      },
      async () => {
        const formData = new FormData();
        appendUploadFile(formData, "image", {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        });
        const body = await this.client.requestForm<unknown>(
          `/api/v1/profile/portfolio/${id}/image`,
          formData,
          { method: "POST", headers: mutationHeaders(options) }
        );
        successResponseSchema.parse(body);
      }
    );
  }

  async deletePortfolioImage(id: string): Promise<void> {
    const body = await this.client.request<unknown>(
      `/api/v1/profile/portfolio/${id}/image`,
      { method: "DELETE" }
    );
    successResponseSchema.parse(body);
  }

  async deletePortfolio(id: string): Promise<void> {
    return this.trace("portfolio delete", { id }, async () => {
      const body = await this.client.request<unknown>(
        `/api/v1/profile/portfolio/${id}`,
        { method: "DELETE" }
      );
      successResponseSchema.parse(body);
    });
  }

  async listCertificates(
    options?: RequestOptions
  ): Promise<CertificateEntry[]> {
    const body = await this.client.request<unknown>(
      "/api/v1/profile/certificates",
      { signal: options?.signal }
    );
    return certificateResponseSchema.parse(body).data.certificates;
  }

  async createCertificate(
    entry: CertificateCreate,
    options?: MutationOptions
  ): Promise<string> {
    return this.trace(
      "certificate create",
      {
        nameLength: entry.name.length,
        issuerLength: entry.issuer.length,
        issuedAt: entry.issuedAt,
      },
      async () => {
        const body = await this.client.requestJson<unknown>(
          "/api/v1/profile/certificates",
          entry,
          { method: "POST", headers: mutationHeaders(options) }
        );
        return certificateCreateResponseSchema.parse(body).data.certificate.id;
      }
    );
  }

  async updateCertificate(
    id: string,
    update: CertificateCreate,
    options?: MutationOptions
  ): Promise<void> {
    return this.trace(
      "certificate update",
      {
        id,
        nameLength: update.name.length,
        issuerLength: update.issuer.length,
        issuedAt: update.issuedAt,
      },
      async () => {
        const body = await this.client.requestJson<unknown>(
          `/api/v1/profile/certificates/${id}`,
          update,
          { method: "PATCH", headers: mutationHeaders(options) }
        );
        successResponseSchema.parse(body);
      }
    );
  }

  async deleteCertificate(id: string): Promise<void> {
    return this.trace("certificate delete", { id }, async () => {
      const body = await this.client.request<unknown>(
        `/api/v1/profile/certificates/${id}`,
        { method: "DELETE" }
      );
      successResponseSchema.parse(body);
    });
  }

  async uploadCertificateImage(
    id: string,
    asset: UploadAsset,
    options?: MutationOptions
  ): Promise<void> {
    const mimeType = asset.type || mimeTypeFromUri(asset.uri);
    const ext =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : "jpg";
    const fileName =
      asset.name ?? fileNameFromUri(asset.uri, `certificate.${ext}`);
    return this.trace(
      "certificate image upload",
      {
        id,
        fileName,
        mimeType,
      },
      async () => {
        const formData = new FormData();
        appendUploadFile(formData, "image", {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        });
        const body = await this.client.requestForm<unknown>(
          `/api/v1/profile/certificates/${id}/image`,
          formData,
          { method: "POST", headers: mutationHeaders(options) }
        );
        successResponseSchema.parse(body);
      }
    );
  }

  async deleteCertificateImage(id: string): Promise<void> {
    const body = await this.client.request<unknown>(
      `/api/v1/profile/certificates/${id}/image`,
      { method: "DELETE" }
    );
    successResponseSchema.parse(body);
  }
}
export const studentApi = new StudentApi();
