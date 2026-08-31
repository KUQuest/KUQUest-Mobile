import type {
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
  ProfileResponse,
} from "../../api/contracts";
import type {
  CertificateCreate,
  ExperienceCreate,
  PortfolioCreate,
  UploadAsset,
} from "../../api/StudentApi";
import type { SupportedLocale } from "../../locales/LocaleProvider";
import type { PrototypePersonaId } from "../../components/ui/prototypeMenuData";
import { getActivePrototypePersonaId } from "../../components/ui/prototypeMenuState";
import { isPrototypeDemoEnabled } from "../auth/demoMode";
import { LiveProfileAdapter } from "./adapters/liveProfileAdapter";
import { DemoProfileAdapter } from "./adapters/demoProfileAdapter";
import type {
  Certificate,
  Experience,
  ProfileAdapter,
  ProfileBasicsUpdate,
  ProfileDraft,
  ProfileDraftMapperInput,
  ProfileEditData,
  ProfileViewData,
  Work,
} from "./types";

function mapApiCertificateToDraft(certificate: CertificateEntry): Certificate {
  return {
    id: certificate.id,
    name: certificate.name,
    issuer: certificate.issuer,
    issuedAt: certificate.issuedAt,
    imageUri: certificate.image?.url ?? "",
  };
}

function mapApiPortfolioToDraft(entry: PortfolioEntry): Work {
  return {
    id: entry.id,
    title: entry.title,
    detail: entry.description ?? "",
    imageUri: entry.images[0]?.url ?? "",
  };
}

function mapApiExperienceToDraft(entry: ExperienceEntry): Experience {
  return {
    id: entry.id,
    title: entry.title,
    employmentType: entry.employmentType,
    organization: entry.organization ?? "",
    description: entry.description ?? "",
    startedAt: entry.startedAt,
    endedAt: entry.endedAt ?? "",
  };
}

export class ProfileModule {
  private readonly liveAdapter: LiveProfileAdapter;
  private readonly demoAdapter: DemoProfileAdapter;

  constructor(
    liveAdapter = new LiveProfileAdapter(),
    demoAdapter = new DemoProfileAdapter()
  ) {
    this.liveAdapter = liveAdapter;
    this.demoAdapter = demoAdapter;
  }

  getAdapter(): ProfileAdapter {
    return this.isDemoEnabled() ? this.demoAdapter : this.liveAdapter;
  }

  isDemoEnabled(): boolean {
    return isPrototypeDemoEnabled();
  }

  async loadProfile(options?: {
    locale?: SupportedLocale;
    personaId?: PrototypePersonaId;
  }): Promise<ProfileViewData> {
    const locale = options?.locale ?? "en";
    const personaId = options?.personaId ?? getActivePrototypePersonaId();
    return this.getAdapter().loadProfile(locale, personaId);
  }

  async getEditData(personaId?: PrototypePersonaId): Promise<ProfileEditData> {
    return this.getAdapter().getEditData(personaId);
  }

  async updateBasics(
    update: ProfileBasicsUpdate,
    personaId?: PrototypePersonaId
  ): Promise<ProfileResponse> {
    return this.getAdapter().updateBasics(update, personaId);
  }

  async uploadAvatar(
    asset: UploadAsset,
    personaId?: PrototypePersonaId
  ): Promise<string> {
    return this.getAdapter().uploadAvatar(asset, personaId);
  }

  async createExperience(
    entry: ExperienceCreate,
    personaId?: PrototypePersonaId
  ): Promise<ExperienceEntry | undefined> {
    return this.getAdapter().createExperience(entry, personaId);
  }

  async updateExperience(
    id: string,
    update: Partial<ExperienceCreate>,
    personaId?: PrototypePersonaId
  ): Promise<ExperienceEntry | undefined> {
    return this.getAdapter().updateExperience(id, update, personaId);
  }

  async deleteExperience(
    id: string,
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().deleteExperience(id, personaId);
  }

  async createPortfolio(
    entry: PortfolioCreate,
    personaId?: PrototypePersonaId
  ): Promise<string> {
    return this.getAdapter().createPortfolio(entry, personaId);
  }

  async updatePortfolio(
    id: string,
    update: { title?: string; description?: string | null },
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().updatePortfolio(id, update, personaId);
  }

  async uploadPortfolioImage(
    id: string,
    asset: UploadAsset,
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().uploadPortfolioImage(id, asset, personaId);
  }

  async deletePortfolioImage(
    id: string,
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().deletePortfolioImage(id, personaId);
  }

  async deletePortfolio(
    id: string,
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().deletePortfolio(id, personaId);
  }

  async createCertificate(
    entry: CertificateCreate,
    personaId?: PrototypePersonaId
  ): Promise<string> {
    return this.getAdapter().createCertificate(entry, personaId);
  }

  async updateCertificate(
    id: string,
    update: CertificateCreate,
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().updateCertificate(id, update, personaId);
  }

  async uploadCertificateImage(
    id: string,
    asset: UploadAsset,
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().uploadCertificateImage(id, asset, personaId);
  }

  async deleteCertificateImage(
    id: string,
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().deleteCertificateImage(id, personaId);
  }

  async deleteCertificate(
    id: string,
    personaId?: PrototypePersonaId
  ): Promise<void> {
    return this.getAdapter().deleteCertificate(id, personaId);
  }

  mapProfileRecordsToDraft(input: ProfileDraftMapperInput): ProfileDraft {
    const departmentId =
      input.status.departmentId ?? input.profile.department?.id ?? "";
    const faculty = input.options.faculties.find((item) =>
      item.departments.some((department) => department.id === departmentId)
    );
    const firstName = input.status.firstName || input.profile.firstName;
    const lastName = input.status.lastName || input.profile.lastName;

    return {
      name:
        [firstName, lastName].filter(Boolean).join(" ") || input.fallbackName,
      telephone: input.status.telephone ?? input.profile.telephone ?? "",
      occupation: input.status.occupationId ?? "",
      studentId: input.status.studentId ?? input.profile.studentId ?? "",
      faculty: faculty?.id ?? "",
      department: departmentId,
      acceptedTerms: Boolean(input.status.termsAcceptedAt),
      description: input.profile.bio ?? "",
      profileImage: input.profile.avatar?.url ?? input.fallbackImage,
      certificates: input.certificates.map(mapApiCertificateToDraft),
      works: input.portfolio.map(mapApiPortfolioToDraft),
      experiences: input.experiences.map(mapApiExperienceToDraft),
    };
  }

  resetDemoProfiles(): void {
    this.demoAdapter.resetDemoData();
  }

  getDemoProfileRecordForTests(personaId: PrototypePersonaId): ProfileResponse {
    return this.demoAdapter.getDemoProfileRecordForTests(personaId);
  }
}

export const profileModule = new ProfileModule();
