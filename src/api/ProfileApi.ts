import { ApiError } from './ApiClient';
import type {
  AcademicRegistrationOptions,
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
  ProfileResponse,
} from './contracts';
import type { StudentApi, ProfileUpdate, UploadAsset, CertificateCreate, ExperienceCreate, PortfolioCreate } from './StudentApi';

export interface ProfileTagOption {
  id: string;
  name: string;
}

export interface ProfileEditData {
  profile: ProfileResponse;
  occupations: AcademicRegistrationOptions['occupations'];
  experiences: ExperienceEntry[];
  portfolio: PortfolioEntry[];
  certificates: CertificateEntry[];
  tagOptions: ProfileTagOption[];
}

export type ProfileBasicsUpdate = Pick<ProfileUpdate, 'firstName' | 'lastName' | 'bio' | 'occupationId' | 'tagIds'>;

export class ProfileApi {
  constructor(private readonly studentApi: StudentApi) {}

  async getEditData(): Promise<ProfileEditData> {
    const [profile, options, experiences, portfolio, certificates, tagOptions] = await Promise.all([
      this.studentApi.getProfile(),
      this.studentApi.getAcademicRegistrationOptions().catch((error) => {
        if (error instanceof ApiError && error.status === 404) return { occupations: [], faculties: [] };
        throw error;
      }),
      this.studentApi.listExperience(),
      this.studentApi.listPortfolio(),
      this.studentApi.listCertificates(),
      typeof this.studentApi.listProfileTagOptions === 'function'
        ? this.studentApi.listProfileTagOptions()
        : Promise.resolve([]),
    ]);

    return {
      profile,
      occupations: options.occupations,
      experiences,
      portfolio,
      certificates,
      tagOptions,
    };
  }

  async updateBasics(update: ProfileBasicsUpdate): Promise<ProfileResponse> {
    const { occupationId, ...profileUpdate } = update;
    await this.studentApi.updateProfile(profileUpdate);
    if (occupationId !== undefined) {
      await this.studentApi.updateAcademicRegistration({ occupationId });
    }
    return this.studentApi.getProfile();
  }

  async uploadAvatar(asset: UploadAsset): Promise<string> {
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
