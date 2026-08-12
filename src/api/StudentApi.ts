import { ApiClient, ApiError } from './ApiClient';
import {
  academicRegistrationOptionsResponseSchema,
  academicRegistrationStatusResponseSchema,
  certificateResponseSchema,
  certificateCreateResponseSchema,
  portfolioResponseSchema,
  portfolioCreateResponseSchema,
  profileResponseSchema,
  successResponseSchema,
  type AcademicRegistrationOptions,
  type AcademicRegistrationStatus,
  type CertificateEntry,
  type PortfolioEntry,
  type ProfileResponse,
} from './contracts';

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

export interface UploadAsset {
  uri: string;
  name?: string;
  type?: string;
}

function appendFile(formData: FormData, field: string, asset: UploadAsset): void {
  formData.append(field, {
    uri: asset.uri,
    name: asset.name ?? `${field}.jpg`,
    type: asset.type ?? 'image/jpeg',
  } as unknown as Blob);
}

function fileNameFromUri(uri: string, fallback: string): string {
  const lastSegment = uri.split('/').pop();
  return lastSegment || fallback;
}

function studentApiDebug(message: string, details: Record<string, unknown> = {}): void {
  if (__DEV__) {
    console.log(`[student-api] ${message}`, details);
  }
}

function getErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof ApiError) {
    return { name: error.name, status: error.status, code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    const issues = 'issues' in error && Array.isArray(error.issues)
      ? error.issues.map((issue: { path?: unknown; message?: unknown }) => ({ path: issue.path, message: issue.message }))
      : undefined;
    return { name: error.name, message: error.message, ...(issues ? { issues } : {}) };
  }
  return { message: String(error) };
}

export class StudentApi {
  constructor(private readonly client: ApiClient) {}

  private async trace<T>(operation: string, details: Record<string, unknown>, action: () => Promise<T>): Promise<T> {
    studentApiDebug(`${operation} started`, details);
    try {
      const result = await action();
      studentApiDebug(`${operation} succeeded`, details);
      return result;
    } catch (error) {
      studentApiDebug(`${operation} failed`, { ...details, error: getErrorDetails(error) });
      throw error;
    }
  }

  async getAcademicRegistrationOptions(): Promise<AcademicRegistrationOptions> {
    const body = await this.client.request<unknown>('/api/v1/academic-registration/options');
    return academicRegistrationOptionsResponseSchema.parse(body).data;
  }

  async getAcademicRegistrationStatus(): Promise<AcademicRegistrationStatus> {
    const body = await this.client.request<unknown>('/api/v1/academic-registration/status');
    return academicRegistrationStatusResponseSchema.parse(body).data;
  }

  async updateAcademicRegistration(update: AcademicRegistrationUpdate): Promise<void> {
    return this.trace('academic registration update', {
      hasFirstName: Boolean(update.firstName),
      hasLastName: Boolean(update.lastName),
      hasTelephone: Boolean(update.telephone),
      hasOccupationId: Boolean(update.occupationId),
      hasStudentId: Boolean(update.studentId),
      hasDepartmentId: Boolean(update.departmentId),
      hasTermsVersion: Boolean(update.termsVersion),
    }, async () => {
      const body = await this.client.requestJson<unknown>('/api/v1/academic-registration', update, { method: 'PATCH' });
      successResponseSchema.parse(body);
    });
  }

  async getProfile(): Promise<ProfileResponse> {
    const body = await this.client.request<unknown>('/api/v1/profile');
    return profileResponseSchema.parse(body).data;
  }

  async updateProfile(update: ProfileUpdate): Promise<void> {
    return this.trace('profile update', {
      hasFirstName: Boolean(update.firstName),
      hasLastName: Boolean(update.lastName),
      hasBio: Boolean(update.bio),
      hasTelephone: Boolean(update.telephone),
      hasDepartmentId: Boolean(update.departmentId),
    }, async () => {
      const body = await this.client.requestJson<unknown>('/api/v1/profile', update, { method: 'PATCH' });
      successResponseSchema.parse(body);
    });
  }

  async uploadAvatar(asset: UploadAsset): Promise<string> {
    return this.trace('avatar upload', {
      fileName: asset.name ?? fileNameFromUri(asset.uri, 'avatar.jpg'),
      mimeType: asset.type ?? 'image/jpeg',
    }, async () => {
      const formData = new FormData();
      appendFile(formData, 'avatar', asset);
      const body = await this.client.requestForm<{ success: true; data: { fileId: string } }>(
        '/api/v1/profile/avatar',
        formData,
        { method: 'POST' }
      );
      return body.data.fileId;
    });
  }

  async listPortfolio(): Promise<PortfolioEntry[]> {
    const body = await this.client.request<unknown>('/api/v1/profile/portfolio');
    return portfolioResponseSchema.parse(body).data;
  }

  async createPortfolio(entry: PortfolioCreate): Promise<string> {
    return this.trace('portfolio create', {
      titleLength: entry.title.length,
      descriptionLength: entry.description?.length ?? 0,
      imageCount: entry.imageUris.length,
      localImageCount: entry.imageUris.filter((uri) => !/^https?:\/\//i.test(uri)).length,
    }, async () => {
      const formData = new FormData();
      formData.append('title', entry.title);
      if (entry.description) formData.append('description', entry.description);
      entry.imageUris.forEach((uri, index) => appendFile(formData, 'images', {
        uri,
        name: fileNameFromUri(uri, `portfolio-${index}.jpg`),
      }));
      const body = await this.client.requestForm<unknown>('/api/v1/profile/portfolio', formData, { method: 'POST' });
      return portfolioCreateResponseSchema.parse(body).data.id;
    });
  }

  async updatePortfolio(id: string, update: { title?: string; description?: string }): Promise<void> {
    return this.trace('portfolio update', {
      id,
      titleLength: update.title?.length ?? 0,
      descriptionLength: update.description?.length ?? 0,
    }, async () => {
      const body = await this.client.requestJson<unknown>(`/api/v1/profile/portfolio/${id}`, update, { method: 'PATCH' });
      successResponseSchema.parse(body);
    });
  }

  async deletePortfolio(id: string): Promise<void> {
    return this.trace('portfolio delete', { id }, async () => {
      const body = await this.client.request<unknown>(`/api/v1/profile/portfolio/${id}`, { method: 'DELETE' });
      successResponseSchema.parse(body);
    });
  }

  async listCertificates(): Promise<CertificateEntry[]> {
    const body = await this.client.request<unknown>('/api/v1/profile/certificates');
    return certificateResponseSchema.parse(body).data.certificates;
  }

  async createCertificate(entry: CertificateCreate): Promise<string> {
    return this.trace('certificate create', {
      nameLength: entry.name.length,
      issuerLength: entry.issuer.length,
      issuedAt: entry.issuedAt,
    }, async () => {
      const body = await this.client.requestJson<unknown>('/api/v1/profile/certificates', entry, { method: 'POST' });
      return certificateCreateResponseSchema.parse(body).data.certificate.id;
    });
  }

  async updateCertificate(id: string, update: CertificateCreate): Promise<void> {
    return this.trace('certificate update', {
      id,
      nameLength: update.name.length,
      issuerLength: update.issuer.length,
      issuedAt: update.issuedAt,
    }, async () => {
      const body = await this.client.requestJson<unknown>(`/api/v1/profile/certificates/${id}`, update, { method: 'PATCH' });
      successResponseSchema.parse(body);
    });
  }

  async deleteCertificate(id: string): Promise<void> {
    return this.trace('certificate delete', { id }, async () => {
      const body = await this.client.request<unknown>(`/api/v1/profile/certificates/${id}`, { method: 'DELETE' });
      successResponseSchema.parse(body);
    });
  }

  async uploadCertificateImage(id: string, asset: UploadAsset): Promise<void> {
    return this.trace('certificate image upload', {
      id,
      fileName: asset.name ?? fileNameFromUri(asset.uri, 'certificate.jpg'),
      mimeType: asset.type ?? 'image/jpeg',
    }, async () => {
      const formData = new FormData();
      appendFile(formData, 'image', asset);
      await this.client.requestForm<unknown>(`/api/v1/profile/certificates/${id}/image`, formData, { method: 'POST' });
    });
  }
}
