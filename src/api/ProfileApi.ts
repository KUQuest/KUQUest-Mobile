import { ApiError } from './ApiClient';
import type {
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
  ProfileResponse,
} from './contracts';
import type { StudentApi, ProfileUpdate, UploadAsset, CertificateCreate, ExperienceCreate, PortfolioCreate } from './StudentApi';

export type ProfileEditSection = 'experience' | 'portfolio' | 'certificates';
export type ProfileEditSectionErrors = Partial<Record<ProfileEditSection, true>>;

export interface ProfileEditData {
  profile: ProfileResponse;
  experiences: ExperienceEntry[];
  portfolio: PortfolioEntry[];
  certificates: CertificateEntry[];
  sectionErrors: ProfileEditSectionErrors;
  sectionUnavailable: ProfileEditSectionErrors;
}

export type ProfileBasicsUpdate = Pick<ProfileUpdate, 'firstName' | 'lastName' | 'bio' | 'telephone' | 'departmentId'>;

export type OptionalCollectionResult<T> = {
  items: T[];
  unavailable: boolean;
};

export async function readOptionalCollection<T>(
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

export class ProfileApi {
  constructor(private readonly studentApi: StudentApi) {}

  async getEditData(): Promise<ProfileEditData> {
    const [profile, experiences, portfolio, certificates] = await Promise.all([
      this.studentApi.getProfile(),
      readCollection(() => this.studentApi.listExperience()),
      readCollection(() => this.studentApi.listPortfolio()),
      readCollection(() => this.studentApi.listCertificates()),
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
      ...(update.firstName === undefined ? {} : { firstName: update.firstName }),
      ...(update.lastName === undefined ? {} : { lastName: update.lastName }),
      ...(update.bio?.trim() ? { bio: update.bio.trim() } : {}),
      ...(update.telephone === undefined ? {} : { telephone: update.telephone }),
      ...(update.departmentId === undefined ? {} : { departmentId: update.departmentId }),
    };
    await this.studentApi.updateProfile(normalizedUpdate);
    return this.studentApi.getProfile();
  }

  async uploadAvatar(asset: UploadAsset): Promise<string | null> {
    return this.studentApi.uploadAvatar(asset);
  }

  async createExperience(entry: ExperienceCreate): Promise<ExperienceEntry | undefined> {
    return this.studentApi.createExperience(entry);
  }

  async updateExperience(id: string, update: Partial<ExperienceCreate>): Promise<ExperienceEntry | undefined> {
    return this.studentApi.updateExperience(id, update);
  }

  async deleteExperience(id: string): Promise<void> {
    return this.studentApi.deleteExperience(id);
  }

  async createPortfolio(entry: PortfolioCreate): Promise<string> {
    return this.studentApi.createPortfolio(entry);
  }

  async updatePortfolio(id: string, update: { title?: string; description?: string | null }): Promise<void> {
    return this.studentApi.updatePortfolio(id, update);
  }

  async uploadPortfolioImage(id: string, asset: UploadAsset): Promise<void> {
    return this.studentApi.uploadPortfolioImage(id, asset);
  }

  async deletePortfolioImage(id: string): Promise<void> {
    return this.studentApi.deletePortfolioImage(id);
  }

  async deletePortfolio(id: string): Promise<void> {
    return this.studentApi.deletePortfolio(id);
  }

  async createCertificate(entry: CertificateCreate): Promise<string> {
    return this.studentApi.createCertificate(entry);
  }

  async updateCertificate(id: string, update: CertificateCreate): Promise<void> {
    return this.studentApi.updateCertificate(id, update);
  }

  async uploadCertificateImage(id: string, asset: UploadAsset): Promise<void> {
    return this.studentApi.uploadCertificateImage(id, asset);
  }

  async deleteCertificateImage(id: string): Promise<void> {
    return this.studentApi.deleteCertificateImage(id);
  }

  async deleteCertificate(id: string): Promise<void> {
    return this.studentApi.deleteCertificate(id);
  }
}
