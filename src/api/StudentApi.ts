import { z } from "zod";
import { ApiClient, ApiError, type RequestOptions } from "./ApiClient";
import { debugLog, errorDetails } from "./debugLog";
import {
  appendUploadFile,
  fileNameFromUri,
  mimeTypeFromUri,
  type UploadAsset,
} from "./fileUpload";
import {
  academicRegistrationOptionsDataSchema,
  academicRegistrationStatusDataSchema,
  avatarMutationDataSchema,
  certificateDataSchema,
  certificateCreateDataSchema,
  experienceMutationDataSchema,
  experienceDataSchema,
  portfolioDataSchema,
  portfolioCreateDataSchema,
  profileDataSchema,
  reputationDataSchema,
  reviewsDataSchema,
  publicProfileDataSchema,
  publicProfileReviewsDataSchema,
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

function studentApiDebug(
  message: string,
  details: Record<string, unknown> = {}
): void {
  debugLog("student-api", message, details);
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
        error:
          error instanceof Error
            ? errorDetails(error)
            : { message: String(error) },
      });
      throw error;
    }
  }

  async getAcademicRegistrationOptions(
    options?: RequestOptions
  ): Promise<AcademicRegistrationOptions> {
    return this.client.get(
      "/api/v1/academic-registration/options",
      academicRegistrationOptionsDataSchema,
      options
    );
  }

  async getAcademicRegistrationStatus(
    options?: RequestOptions
  ): Promise<AcademicRegistrationStatus> {
    return this.client.get(
      "/api/v1/academic-registration/status",
      academicRegistrationStatusDataSchema,
      options
    );
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
        await this.client.send(
          "PATCH",
          "/api/v1/academic-registration",
          z.unknown(),
          { json: update, idempotencyKey: options?.idempotencyKey }
        );
      }
    );
  }

  async getProfile(options?: RequestOptions): Promise<ProfileResponse> {
    return this.client.get("/api/v1/profile", profileDataSchema, options);
  }

  async getPublicProfile(
    userId: string,
    options?: RequestOptions
  ): Promise<PublicProfileResponse> {
    return this.client.get(
      `/api/v1/profile/${userId}`,
      publicProfileDataSchema,
      options
    );
  }

  async listPublicReviews(
    userId: string,
    rating?: number,
    options?: RequestOptions
  ): Promise<PublicProfileReviewsData> {
    return this.client.get(
      `/api/v1/profile/${userId}/reviews`,
      publicProfileReviewsDataSchema,
      { ...options, query: { rating } }
    );
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
        await this.client.send("PATCH", "/api/v1/profile", z.unknown(), {
          json: normalizedUpdate,
          idempotencyKey: options?.idempotencyKey,
        });
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
    return this.client.get(
      "/api/v1/profile/experience",
      experienceDataSchema,
      options
    );
  }

  async createExperience(
    entry: ExperienceCreate,
    options?: MutationOptions
  ): Promise<ExperienceEntry | undefined> {
    return (
      await this.client.send(
        "POST",
        "/api/v1/profile/experience",
        experienceMutationDataSchema,
        { json: entry, idempotencyKey: options?.idempotencyKey }
      )
    )?.experience;
  }

  async updateExperience(
    id: string,
    update: Partial<ExperienceCreate>,
    options?: MutationOptions
  ): Promise<ExperienceEntry | undefined> {
    return (
      await this.client.send(
        "PATCH",
        `/api/v1/profile/experience/${id}`,
        experienceMutationDataSchema,
        { json: update, idempotencyKey: options?.idempotencyKey }
      )
    )?.experience;
  }

  async deleteExperience(id: string): Promise<void> {
    await this.client.send(
      "DELETE",
      `/api/v1/profile/experience/${id}`,
      z.unknown()
    );
  }

  async getReputation(options?: RequestOptions): Promise<Reputation> {
    return this.client.get(
      "/api/v1/profile/reputation",
      reputationDataSchema,
      options
    );
  }

  async listReviews(
    rating: "all" | 5 | 4 | 3 | 2 | 1 = "all",
    options?: RequestOptions
  ): Promise<{
    items: ProfileReview[];
    total: number;
    nextCursor?: string | null;
  }> {
    const parsed = await this.client.get(
      "/api/v1/profile/reviews",
      reviewsDataSchema,
      { ...options, query: { rating: rating === "all" ? undefined : rating } }
    );
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
        return (
          await this.client.send(
            "POST",
            "/api/v1/profile/avatar",
            avatarMutationDataSchema,
            { form: formData, idempotencyKey: options?.idempotencyKey }
          )
        ).fileId;
      }
    );
  }

  async listPortfolio(options?: RequestOptions): Promise<PortfolioEntry[]> {
    return this.client.get(
      "/api/v1/profile/portfolio",
      portfolioDataSchema,
      options
    );
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
        return (
          await this.client.send(
            "POST",
            "/api/v1/profile/portfolio",
            portfolioCreateDataSchema,
            { form: formData, idempotencyKey: options?.idempotencyKey }
          )
        ).id;
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
        await this.client.send(
          "PATCH",
          `/api/v1/profile/portfolio/${id}`,
          z.unknown(),
          { json: update, idempotencyKey: options?.idempotencyKey }
        );
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
        await this.client.send(
          "POST",
          `/api/v1/profile/portfolio/${id}/image`,
          z.unknown(),
          { form: formData, idempotencyKey: options?.idempotencyKey }
        );
      }
    );
  }

  async deletePortfolioImage(id: string): Promise<void> {
    await this.client.send(
      "DELETE",
      `/api/v1/profile/portfolio/${id}/image`,
      z.unknown()
    );
  }

  async deletePortfolio(id: string): Promise<void> {
    return this.trace("portfolio delete", { id }, async () => {
      await this.client.send(
        "DELETE",
        `/api/v1/profile/portfolio/${id}`,
        z.unknown()
      );
    });
  }

  async listCertificates(
    options?: RequestOptions
  ): Promise<CertificateEntry[]> {
    return (
      await this.client.get(
        "/api/v1/profile/certificates",
        certificateDataSchema,
        options
      )
    ).certificates;
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
        return (
          await this.client.send(
            "POST",
            "/api/v1/profile/certificates",
            certificateCreateDataSchema,
            { json: entry, idempotencyKey: options?.idempotencyKey }
          )
        ).certificate.id;
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
        await this.client.send(
          "PATCH",
          `/api/v1/profile/certificates/${id}`,
          z.unknown(),
          { json: update, idempotencyKey: options?.idempotencyKey }
        );
      }
    );
  }

  async deleteCertificate(id: string): Promise<void> {
    return this.trace("certificate delete", { id }, async () => {
      await this.client.send(
        "DELETE",
        `/api/v1/profile/certificates/${id}`,
        z.unknown()
      );
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
        await this.client.send(
          "POST",
          `/api/v1/profile/certificates/${id}/image`,
          z.unknown(),
          { form: formData, idempotencyKey: options?.idempotencyKey }
        );
      }
    );
  }

  async deleteCertificateImage(id: string): Promise<void> {
    await this.client.send(
      "DELETE",
      `/api/v1/profile/certificates/${id}/image`,
      z.unknown()
    );
  }
}
export const studentApi = new StudentApi();
