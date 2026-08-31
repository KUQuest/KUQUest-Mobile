import type {
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
  ProfileResponse,
} from "../../../api/contracts";
import type {
  CertificateCreate,
  ExperienceCreate,
  PortfolioCreate,
  UploadAsset,
} from "../../../api/StudentApi";
import type { PrototypePersonaId } from "../../../components/ui/prototypeMenuData";
import { getActivePrototypePersonaId } from "../../../components/ui/prototypeMenuState";
import { getDemoProfileViewData } from "../profileDemoData";
import type {
  ProfileAdapter,
  ProfileBasicsUpdate,
  ProfileEditData,
  ProfileViewData,
} from "../types";

const PROFILE_TAG_LIMIT = 3;

type DemoProfileRecord = {
  view: ProfileViewData;
  profile: ProfileResponse;
  occupations: ProfileEditData["occupations"];
  experiences: ExperienceEntry[];
  portfolio: PortfolioEntry[];
  certificates: CertificateEntry[];
};

const records = new Map<PrototypePersonaId, DemoProfileRecord>();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function getImageUri(view: ProfileViewData): string | undefined {
  return typeof view.profileImage === "string" && view.profileImage
    ? view.profileImage
    : undefined;
}

function toProfileResponse(
  personaId: PrototypePersonaId,
  view: ProfileViewData
): ProfileResponse {
  const { firstName, lastName } = splitName(view.name);
  const occupationId = `demo-occupation-${personaId}`;
  const departmentId = `demo-department-${personaId}`;
  const imageUri = getImageUri(view);
  return {
    email: `${personaId}@ku.th`,
    firstName,
    lastName,
    bio: view.about,
    telephone: null,
    studentId: null,
    academicYear: null,
    university: view.university,
    occupation: { id: occupationId, name: view.occupation },
    tags: view.tags.map((tag, index) => ({
      id: tag.id ?? `demo-tag-${index}`,
      name: tag.name,
      ...(tag.questCount === undefined ? {} : { questCount: tag.questCount }),
    })),
    department: {
      id: departmentId,
      name: view.department,
      faculty: { name: view.faculty },
    },
    avatar: imageUri
      ? { fileId: `demo-avatar-${personaId}`, url: imageUri }
      : null,
  };
}

function toExperienceEntry(
  experience: ProfileViewData["experiences"][number]
): ExperienceEntry {
  return {
    id: experience.id ?? `demo-experience-${Date.now()}`,
    title: experience.title,
    employmentType: experience.employmentType,
    organization: experience.organization || null,
    description: experience.description || null,
    startedAt: experience.startedAt,
    endedAt: experience.endedAt,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function toPortfolioEntry(
  work: ProfileViewData["works"][number]
): PortfolioEntry {
  const imageUris = work.imageUris?.length
    ? work.imageUris
    : work.imageUri
      ? [work.imageUri]
      : [];
  return {
    id: work.id ?? `demo-portfolio-${Date.now()}`,
    title: work.title,
    description: work.detail || null,
    images: imageUris.map((url, index) => ({
      fileId: `demo-portfolio-image-${index}`,
      position: index,
      url,
    })),
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function toCertificateEntry(
  certificate: ProfileViewData["certificates"][number]
): CertificateEntry {
  const year = /^\d{4}$/.test(certificate.issuedYear)
    ? certificate.issuedYear
    : "2026";
  const imageUri =
    typeof certificate.imageSource === "string"
      ? certificate.imageSource
      : undefined;
  return {
    id: certificate.id ?? `demo-certificate-${Date.now()}`,
    name: certificate.title,
    issuer: certificate.issuer,
    issuedAt: `${year}-01-01`,
    image: imageUri
      ? {
          fileId: `demo-certificate-image-${certificate.id ?? "new"}`,
          url: imageUri,
        }
      : null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function createRecord(personaId: PrototypePersonaId): DemoProfileRecord {
  const view = getDemoProfileViewData(personaId);
  return {
    view,
    profile: toProfileResponse(personaId, view),
    occupations: [
      {
        id: `demo-occupation-${personaId}`,
        name: view.occupation,
        requiresStudentId: false,
      },
    ],
    experiences: view.experiences.map(toExperienceEntry),
    portfolio: view.works.map(toPortfolioEntry),
    certificates: view.certificates.map(toCertificateEntry),
  };
}

function getRecord(personaId: PrototypePersonaId): DemoProfileRecord {
  const existing = records.get(personaId);
  if (existing) return existing;
  const created = createRecord(personaId);
  records.set(personaId, created);
  return created;
}

function syncBasics(record: DemoProfileRecord): void {
  const { firstName, lastName } = record.profile;
  record.view = {
    ...record.view,
    name: [firstName, lastName].filter(Boolean).join(" "),
    about: record.profile.bio ?? "",
    occupation: record.profile.occupation?.name ?? "",
    faculty: record.profile.department?.faculty.name ?? "",
    department: record.profile.department?.name ?? "",
    university: record.profile.university ?? "",
    profileImage: record.profile.avatar?.url ?? record.view.profileImage,
    tags: clone(record.profile.tags ?? record.view.tags),
  };
}

function syncExperiences(record: DemoProfileRecord): void {
  record.view = {
    ...record.view,
    experiences: record.experiences.map((experience) => ({
      id: experience.id,
      title: experience.title,
      employmentType: experience.employmentType,
      organization: experience.organization ?? "",
      description: experience.description ?? "",
      startedAt: experience.startedAt,
      endedAt: experience.endedAt ?? null,
    })),
  };
}

function syncPortfolio(record: DemoProfileRecord): void {
  record.view = {
    ...record.view,
    works: record.portfolio.map((work) => ({
      id: work.id,
      title: work.title,
      detail: work.description ?? "",
      imageUri: work.images[0]?.url ?? "",
      imageUris: work.images.map((image) => image.url),
    })),
  };
}

function syncCertificates(record: DemoProfileRecord): void {
  record.view = {
    ...record.view,
    certificates: record.certificates.map((certificate) => ({
      id: certificate.id,
      title: certificate.name,
      issuer: certificate.issuer,
      issuedYear: certificate.issuedAt.slice(0, 4),
      link: "",
      imageSource: certificate.image
        ? { uri: certificate.image.url }
        : undefined,
    })),
  };
}

function nextId(record: DemoProfileRecord, prefix: string): string {
  const count =
    prefix === "experience"
      ? record.experiences.length
      : prefix === "portfolio"
        ? record.portfolio.length
        : record.certificates.length;
  return `demo-${prefix}-${count + 1}`;
}

export class DemoProfileAdapter implements ProfileAdapter {
  async loadProfile(
    _locale?: string,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<ProfileViewData> {
    const record = getRecord(personaId);
    return {
      ...clone(record.view),
      tags: record.view.tags.slice(0, PROFILE_TAG_LIMIT),
    };
  }

  async getEditData(
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<ProfileEditData> {
    const record = getRecord(personaId);
    return {
      profile: clone(record.profile),
      occupations: clone(record.occupations),
      experiences: clone(record.experiences),
      portfolio: clone(record.portfolio),
      certificates: clone(record.certificates),
      sectionErrors: {},
    };
  }

  async updateBasics(
    update: ProfileBasicsUpdate,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<ProfileResponse> {
    const record = getRecord(personaId);
    if (update.firstName !== undefined)
      record.profile.firstName = update.firstName;
    if (update.lastName !== undefined)
      record.profile.lastName = update.lastName;
    if (update.bio !== undefined) record.profile.bio = update.bio;
    if (update.occupationId !== undefined) {
      const occupation = record.occupations.find(
        (item) => item.id === update.occupationId
      );
      if (occupation)
        record.profile.occupation = {
          id: occupation.id,
          name: occupation.name,
        };
    }
    syncBasics(record);
    return clone(record.profile);
  }

  async uploadAvatar(
    asset: UploadAsset,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<string> {
    const record = getRecord(personaId);
    record.profile.avatar = {
      fileId: `demo-avatar-${personaId}`,
      url: asset.uri,
    };
    syncBasics(record);
    return record.profile.avatar.fileId;
  }

  async createExperience(
    entry: ExperienceCreate,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<ExperienceEntry | undefined> {
    const record = getRecord(personaId);
    const experience: ExperienceEntry = {
      id: nextId(record, "experience"),
      title: entry.title,
      employmentType: entry.employmentType,
      organization: entry.organization ?? null,
      description: entry.description ?? null,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    record.experiences.push(experience);
    syncExperiences(record);
    return clone(experience);
  }

  async updateExperience(
    id: string,
    update: Partial<ExperienceCreate>,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<ExperienceEntry | undefined> {
    const record = getRecord(personaId);
    const index = record.experiences.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    record.experiences[index] = {
      ...record.experiences[index],
      ...update,
      id,
      updatedAt: new Date().toISOString(),
    };
    syncExperiences(record);
    return clone(record.experiences[index]);
  }

  async deleteExperience(
    id: string,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    record.experiences = record.experiences.filter((item) => item.id !== id);
    syncExperiences(record);
  }

  async createPortfolio(
    entry: PortfolioCreate,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<string> {
    const record = getRecord(personaId);
    const portfolio: PortfolioEntry = {
      id: nextId(record, "portfolio"),
      title: entry.title,
      description: entry.description ?? null,
      images: entry.imageUris.map((url, index) => ({
        fileId: `demo-portfolio-image-${index}`,
        position: index,
        url,
      })),
      createdAt: new Date().toISOString(),
    };
    record.portfolio.push(portfolio);
    syncPortfolio(record);
    return portfolio.id;
  }

  async updatePortfolio(
    id: string,
    update: { title?: string; description?: string | null },
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    const item = record.portfolio.find((portfolio) => portfolio.id === id);
    if (!item) return;
    if (update.title !== undefined) item.title = update.title;
    if (update.description !== undefined) item.description = update.description;
    syncPortfolio(record);
  }

  async uploadPortfolioImage(
    id: string,
    asset: UploadAsset,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    const item = record.portfolio.find((portfolio) => portfolio.id === id);
    if (!item) return;
    item.images = [
      { fileId: `demo-portfolio-image-${id}`, position: 0, url: asset.uri },
    ];
    syncPortfolio(record);
  }

  async deletePortfolioImage(
    id: string,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    const item = record.portfolio.find((portfolio) => portfolio.id === id);
    if (!item) return;
    item.images = [];
    syncPortfolio(record);
  }

  async deletePortfolio(
    id: string,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    record.portfolio = record.portfolio.filter((item) => item.id !== id);
    syncPortfolio(record);
  }

  async createCertificate(
    entry: CertificateCreate,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<string> {
    const record = getRecord(personaId);
    const certificate: CertificateEntry = {
      id: nextId(record, "certificate"),
      name: entry.name,
      issuer: entry.issuer,
      issuedAt: entry.issuedAt,
      image: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    record.certificates.push(certificate);
    syncCertificates(record);
    return certificate.id;
  }

  async updateCertificate(
    id: string,
    update: CertificateCreate,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    const item = record.certificates.find(
      (certificate) => certificate.id === id
    );
    if (!item) return;
    item.name = update.name;
    item.issuer = update.issuer;
    item.issuedAt = update.issuedAt;
    item.updatedAt = new Date().toISOString();
    syncCertificates(record);
  }

  async uploadCertificateImage(
    id: string,
    asset: UploadAsset,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    const item = record.certificates.find(
      (certificate) => certificate.id === id
    );
    if (!item) return;
    item.image = { fileId: `demo-certificate-image-${id}`, url: asset.uri };
    syncCertificates(record);
  }

  async deleteCertificateImage(
    id: string,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    const item = record.certificates.find(
      (certificate) => certificate.id === id
    );
    if (!item) return;
    item.image = null;
    syncCertificates(record);
  }

  async deleteCertificate(
    id: string,
    personaId: PrototypePersonaId = getActivePrototypePersonaId()
  ): Promise<void> {
    const record = getRecord(personaId);
    record.certificates = record.certificates.filter((item) => item.id !== id);
    syncCertificates(record);
  }

  resetDemoData(): void {
    records.clear();
  }

  getDemoProfileRecordForTests(personaId: PrototypePersonaId): ProfileResponse {
    return clone(getRecord(personaId).profile);
  }
}
