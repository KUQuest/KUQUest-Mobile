import type { MutationOptions, StudentApi } from '../../api/StudentApi';
import type { ProfileDraft } from '../profile/types';

export interface ProfilePersistenceResult {
  draft: ProfileDraft;
  completedSteps: string[];
}

export class ProfilePersistenceError extends Error {
  readonly partial: boolean;

  constructor(
    message: string,
    readonly failedStep: string,
    readonly completedSteps: string[],
    readonly draft: ProfileDraft,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProfilePersistenceError';
    this.partial = completedSteps.length > 0;
  }
}

function isFilled(value: { name?: string; issuer?: string; issuedAt?: string; imageUri?: string }): boolean {
  return Boolean(value.name || value.issuer || value.issuedAt || value.imageUri);
}

function isWorkFilled(value: { title: string; detail: string; imageUri: string }): boolean {
  return Boolean(value.title || value.detail || value.imageUri);
}

function isExperienceFilled(value: { title: string; employmentType: string; organization: string; description: string; startedAt: string; endedAt: string }): boolean {
  return Boolean(value.title || value.employmentType || value.organization || value.description || value.startedAt || value.endedAt);
}

function isLocalAsset(uri: string): boolean {
  return Boolean(uri) && !/^https?:\/\//i.test(uri);
}

function mutationHash(value: unknown): string {
  const source = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function cloneDraft(draft: ProfileDraft): ProfileDraft {
  return {
    ...draft,
    certificates: draft.certificates.map((item) => ({ ...item })),
    works: draft.works.map((item) => ({ ...item })),
    experiences: draft.experiences.map((item) => ({ ...item })),
  };
}

export class ProfilePersistenceCoordinator {
  private draft!: ProfileDraft;
  private completedSteps: string[] = [];
  private readonly uploadedAssets = new Set<string>();
  private readonly portfolioReplacements = new Map<string, { oldId: string; newId: string }>();
  private readonly deletedCertificates = new Set<string>();
  private readonly deletedPortfolio = new Set<string>();
  private readonly deletedExperiences = new Set<string>();

  markCertificateDeleted(id: string): void {
    this.deletedCertificates.add(id);
  }

  markPortfolioDeleted(id: string): void {
    this.deletedPortfolio.add(id);
  }

  markExperienceDeleted(id: string): void {
    this.deletedExperiences.add(id);
  }

  private mutationOptions(name: string, value: unknown): MutationOptions {
    return { idempotencyKey: `kuquest-profile-${name}-${mutationHash(value)}` };
  }

  async save(api: StudentApi, form: ProfileDraft, isEditMode: boolean, termsVersion?: string): Promise<ProfilePersistenceResult> {
    this.draft = cloneDraft(form);
    this.completedSteps = [];

    if (!this.draft.occupation || !this.draft.department) throw new Error('Academic registration options are incomplete');
    if (!isEditMode && this.draft.acceptedTerms && !termsVersion) throw new Error('EXPO_PUBLIC_TERMS_VERSION is required');
    const academicRegistration = {
      firstName: this.firstName,
      lastName: this.lastName,
      telephone: this.draft.telephone,
      occupationId: this.draft.occupation,
      studentId: this.draft.studentId || undefined,
      departmentId: this.draft.department,
      termsVersion: !isEditMode && this.draft.acceptedTerms && termsVersion ? termsVersion : undefined,
    };
    await this.runStep('academic-registration', () => api.updateAcademicRegistration(
      academicRegistration,
      this.mutationOptions('academic-registration', academicRegistration),
    ));

    const profile = {
      firstName: this.firstName,
      lastName: this.lastName,
      ...(this.draft.description.trim() ? { bio: this.draft.description.trim() } : {}),
      telephone: this.draft.telephone,
      ...(this.draft.department ? { departmentId: this.draft.department } : {}),
    };
    await this.runStep('profile', () => api.updateProfile(
      profile,
      this.mutationOptions('profile', profile),
    ));

    const profileImage = this.draft.profileImage;
    if (isLocalAsset(profileImage) && !this.uploadedAssets.has(`avatar:${profileImage}`)) {
      const asset = { uri: profileImage };
      await this.runStep('avatar', async () => {
        await api.uploadAvatar(asset, this.mutationOptions('avatar', asset));
        this.uploadedAssets.add(`avatar:${profileImage}`);
      });
    }

    await this.saveCertificates(api);
    await this.savePortfolio(api);
    await this.saveExperiences(api);
    await this.deletePendingRecords(api);

    return { draft: cloneDraft(this.draft), completedSteps: [...this.completedSteps] };
  }

  private get firstName(): string {
    const parts = this.draft?.name.trim().split(/\s+/).filter(Boolean) ?? [];
    return parts.shift() ?? '';
  }

  private get lastName(): string {
    const parts = this.draft?.name.trim().split(/\s+/).filter(Boolean) ?? [];
    parts.shift();
    return parts.join(' ');
  }

  private async runStep(name: string, action: () => Promise<void>): Promise<void> {
    try {
      await action();
      this.completedSteps.push(name);
    } catch (cause) {
      throw new ProfilePersistenceError(
        'Profile save stopped after a partial update',
        name,
        [...this.completedSteps],
        cloneDraft(this.draft),
        cause,
      );
    }
  }

  private async saveCertificates(api: StudentApi): Promise<void> {
    for (const [index, certificate] of this.draft.certificates.entries()) {
      if (!isFilled(certificate)) continue;
      const certificateData = { name: certificate.name, issuer: certificate.issuer, issuedAt: certificate.issuedAt };
      let id = certificate.id;
      if (id) {
        const existingId = id;
        await this.runStep(`certificate:${index}:update`, () => api.updateCertificate(
          existingId,
          certificateData,
          this.mutationOptions(`certificate-${index}-update`, { id: existingId, certificateData }),
        ));
      } else {
        id = await this.runStepWithResult(`certificate:${index}:create`, () => api.createCertificate(
          certificateData,
          this.mutationOptions(`certificate-${index}-create`, certificateData),
        ));
        this.updateCertificateId(index, id);
      }
      if (!id) continue;
      const certificateId = id;
      const imageKey = `certificate:${certificateId}:${certificate.imageUri}`;
      if (isLocalAsset(certificate.imageUri) && !this.uploadedAssets.has(imageKey)) {
        const asset = { uri: certificate.imageUri };
        await this.runStep(`certificate:${index}:image`, () => api.uploadCertificateImage(
          certificateId,
          asset,
          this.mutationOptions(`certificate-${index}-image`, { certificateId, asset }),
        ).then(() => {
          this.uploadedAssets.add(imageKey);
        }));
      }
    }
  }

  private async savePortfolio(api: StudentApi): Promise<void> {
    for (const [index, work] of this.draft.works.entries()) {
      if (!isWorkFilled(work)) continue;
      const currentWork = this.draft.works[index];
      const replacement = isLocalAsset(currentWork.imageUri) ? this.portfolioReplacements.get(currentWork.imageUri) : undefined;
      if (replacement) {
        await this.runStep(`portfolio:${index}:remove-replaced`, () => api.deletePortfolio(replacement.oldId));
        this.portfolioReplacements.delete(currentWork.imageUri);
        this.uploadedAssets.add(`portfolio:${currentWork.imageUri}`);
        continue;
      }

      const hasNewImage = isLocalAsset(currentWork.imageUri) && !this.uploadedAssets.has(`portfolio:${currentWork.imageUri}`);
      if (currentWork.id && hasNewImage) {
        const portfolioData = {
          title: currentWork.title.trim(),
          description: currentWork.detail.trim() || undefined,
          imageUris: [currentWork.imageUri],
        };
        const replacementId = await this.runStepWithResult(`portfolio:${index}:replace-create`, () => api.createPortfolio(
          portfolioData,
          this.mutationOptions(`portfolio-${index}-replace-create`, portfolioData),
        ));
        this.portfolioReplacements.set(currentWork.imageUri, { oldId: currentWork.id, newId: replacementId });
        this.updatePortfolioId(index, replacementId);
        await this.runStep(`portfolio:${index}:replace-delete`, () => api.deletePortfolio(currentWork.id as string));
        this.portfolioReplacements.delete(currentWork.imageUri);
        this.uploadedAssets.add(`portfolio:${currentWork.imageUri}`);
      } else if (currentWork.id) {
        const portfolioData = {
          title: currentWork.title.trim(),
          ...(currentWork.detail.trim() ? { description: currentWork.detail.trim() } : {}),
        };
        await this.runStep(`portfolio:${index}:update`, () => api.updatePortfolio(
          currentWork.id as string,
          portfolioData,
          this.mutationOptions(`portfolio-${index}-update`, { id: currentWork.id, portfolioData }),
        ));
      } else {
        const portfolioData = {
          title: currentWork.title.trim(),
          description: currentWork.detail.trim() || undefined,
          imageUris: currentWork.imageUri ? [currentWork.imageUri] : [],
        };
        const id = await this.runStepWithResult(`portfolio:${index}:create`, () => api.createPortfolio(
          portfolioData,
          this.mutationOptions(`portfolio-${index}-create`, portfolioData),
        ));
        this.updatePortfolioId(index, id);
        if (isLocalAsset(currentWork.imageUri)) this.uploadedAssets.add(`portfolio:${currentWork.imageUri}`);
      }
    }
  }

  private async saveExperiences(api: StudentApi): Promise<void> {
    for (const [index, experience] of this.draft.experiences.entries()) {
      if (!isExperienceFilled(experience)) continue;
      const experienceData = {
        title: experience.title.trim(),
        employmentType: experience.employmentType.trim(),
        ...(experience.organization.trim() ? { organization: experience.organization.trim() } : {}),
        ...(experience.description.trim() ? { description: experience.description.trim() } : {}),
        startedAt: experience.startedAt,
        endedAt: experience.endedAt.trim() || null,
      };
      if (experience.id) {
        await this.runStep(`experience:${index}:update`, () => api.updateExperience(
          experience.id as string,
          experienceData,
          this.mutationOptions(`experience-${index}-update`, { id: experience.id, experienceData }),
        ).then(() => undefined));
      } else {
        const saved = await this.runStepWithResult(`experience:${index}:create`, () => api.createExperience(
          experienceData,
          this.mutationOptions(`experience-${index}-create`, experienceData),
        ));
        if (saved?.id) this.updateExperienceId(index, saved.id);
      }
    }
  }

  private async deletePendingRecords(api: StudentApi): Promise<void> {
    for (const id of this.deletedCertificates) {
      if (this.uploadedAssets.has(`deleted-certificate:${id}`)) continue;
      await this.runStep(`certificate:${id}:delete`, async () => {
        await api.deleteCertificate(id);
        this.uploadedAssets.add(`deleted-certificate:${id}`);
      });
    }
    for (const id of this.deletedPortfolio) {
      if (this.uploadedAssets.has(`deleted-portfolio:${id}`)) continue;
      await this.runStep(`portfolio:${id}:delete`, async () => {
        await api.deletePortfolio(id);
        this.uploadedAssets.add(`deleted-portfolio:${id}`);
      });
    }
    for (const id of this.deletedExperiences) {
      if (this.uploadedAssets.has(`deleted-experience:${id}`)) continue;
      await this.runStep(`experience:${id}:delete`, async () => {
        await api.deleteExperience(id);
        this.uploadedAssets.add(`deleted-experience:${id}`);
      });
    }
  }

  private async runStepWithResult<T>(name: string, action: () => Promise<T>): Promise<T> {
    try {
      const result = await action();
      this.completedSteps.push(name);
      return result;
    } catch (cause) {
      throw new ProfilePersistenceError(
        'Profile save stopped after a partial update',
        name,
        [...this.completedSteps],
        cloneDraft(this.draft),
        cause,
      );
    }
  }

  private updateCertificateId(index: number, id: string): void {
    this.draft = { ...this.draft, certificates: this.draft.certificates.map((item, itemIndex) => itemIndex === index ? { ...item, id } : item) };
  }

  private updatePortfolioId(index: number, id: string): void {
    this.draft = { ...this.draft, works: this.draft.works.map((item, itemIndex) => itemIndex === index ? { ...item, id } : item) };
  }

  private updateExperienceId(index: number, id: string): void {
    this.draft = { ...this.draft, experiences: this.draft.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, id } : item) };
  }
}
