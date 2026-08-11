import { ApiClient } from './ApiClient';
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

export class StudentApi {
  constructor(private readonly client: ApiClient) {}

  async getAcademicRegistrationOptions(): Promise<AcademicRegistrationOptions> {
    const body = await this.client.request<unknown>('/api/v1/academic-registration/options');
    return academicRegistrationOptionsResponseSchema.parse(body).data;
  }

  async getAcademicRegistrationStatus(): Promise<AcademicRegistrationStatus> {
    const body = await this.client.request<unknown>('/api/v1/academic-registration/status');
    return academicRegistrationStatusResponseSchema.parse(body).data;
  }

  async updateAcademicRegistration(update: AcademicRegistrationUpdate): Promise<void> {
    const body = await this.client.requestJson<unknown>('/api/v1/academic-registration', update, { method: 'PATCH' });
    successResponseSchema.parse(body);
  }

  async getProfile(): Promise<ProfileResponse> {
    const body = await this.client.request<unknown>('/api/v1/profile');
    return profileResponseSchema.parse(body).data;
  }

  async updateProfile(update: ProfileUpdate): Promise<void> {
    const body = await this.client.requestJson<unknown>('/api/v1/profile', update, { method: 'PATCH' });
    successResponseSchema.parse(body);
  }

  async uploadAvatar(asset: UploadAsset): Promise<string> {
    const formData = new FormData();
    appendFile(formData, 'avatar', asset);
    const body = await this.client.requestForm<{ success: true; data: { fileId: string } }>(
      '/api/v1/profile/avatar',
      formData,
      { method: 'POST' }
    );
    return body.data.fileId;
  }

  async listPortfolio(): Promise<PortfolioEntry[]> {
    const body = await this.client.request<unknown>('/api/v1/profile/portfolio');
    return portfolioResponseSchema.parse(body).data;
  }

  async createPortfolio(entry: PortfolioCreate): Promise<string> {
    const formData = new FormData();
    formData.append('title', entry.title);
    if (entry.description) formData.append('description', entry.description);
    entry.imageUris.forEach((uri, index) => appendFile(formData, 'images', {
      uri,
      name: fileNameFromUri(uri, `portfolio-${index}.jpg`),
    }));
    const body = await this.client.requestForm<unknown>('/api/v1/profile/portfolio', formData, { method: 'POST' });
    return portfolioCreateResponseSchema.parse(body).data.id;
  }

  async updatePortfolio(id: string, update: { title?: string; description?: string }): Promise<void> {
    const body = await this.client.requestJson<unknown>(`/api/v1/profile/portfolio/${id}`, update, { method: 'PATCH' });
    successResponseSchema.parse(body);
  }

  async deletePortfolio(id: string): Promise<void> {
    const body = await this.client.request<unknown>(`/api/v1/profile/portfolio/${id}`, { method: 'DELETE' });
    successResponseSchema.parse(body);
  }

  async listCertificates(): Promise<CertificateEntry[]> {
    const body = await this.client.request<unknown>('/api/v1/profile/certificates');
    return certificateResponseSchema.parse(body).data.certificates;
  }

  async createCertificate(entry: CertificateCreate): Promise<string> {
    const body = await this.client.requestJson<unknown>('/api/v1/profile/certificates', entry, { method: 'POST' });
    return certificateCreateResponseSchema.parse(body).data.certificate.id;
  }

  async updateCertificate(id: string, update: CertificateCreate): Promise<void> {
    const body = await this.client.requestJson<unknown>(`/api/v1/profile/certificates/${id}`, update, { method: 'PATCH' });
    successResponseSchema.parse(body);
  }

  async uploadCertificateImage(id: string, asset: UploadAsset): Promise<void> {
    const formData = new FormData();
    appendFile(formData, 'image', asset);
    await this.client.requestForm<unknown>(`/api/v1/profile/certificates/${id}/image`, formData, { method: 'POST' });
  }
}
