import { ApiClient, ApiError } from '../ApiClient';
import { StudentApi } from '../StudentApi';

jest.mock('expo-file-system', () => ({
  File: class MockFile extends Blob {
    readonly uri: string;

    constructor(uri: string) {
      super([], { type: 'image/jpeg' });
      this.uri = uri;
    }

    get name(): string {
      return this.uri.split('/').pop() || 'file.jpg';
    }
  },
}));

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('StudentApi', () => {
  let fetchMock: jest.Mock;
  let api: StudentApi;

  beforeEach(() => {
    fetchMock = jest.fn();
    api = new StudentApi(new ApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => 'better-auth.session_token=session-cookie',
    }));
  });

  test('loads academic registration status with the Better Auth session cookie', async () => {
    fetchMock.mockResolvedValue(response({
      success: true,
      data: {
        firstName: 'KU',
        lastName: 'Student',
        telephone: null,
        occupationId: null,
        studentId: null,
        departmentId: null,
        termsAcceptedAt: null,
        termsVersion: null,
        completed: false,
      },
    }));
    await expect(api.getAcademicRegistrationStatus()).resolves.toMatchObject({ completed: false });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/academic-registration/status',
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
        headers: expect.objectContaining({
          Cookie: 'better-auth.session_token=session-cookie',
        }),
      })
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = request.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers['authorization']).toBeUndefined();
  });

  test('does not attach auth headers when no Better Auth cookie exists', async () => {
    const publicApi = new StudentApi(new ApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: fetchMock as unknown as typeof fetch,
      cookieProvider: () => '',
    }));
    fetchMock.mockResolvedValue(response({ success: true, data: [] }));

    await publicApi.listPortfolio();

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = request.headers as Record<string, string>;
    expect(request.credentials).toBe('omit');
    expect(headers.Cookie).toBeUndefined();
    expect(headers.Authorization).toBeUndefined();
  });

  test('updates academic registration using the documented field names', async () => {
    fetchMock.mockResolvedValue(response({ success: true }));
    await api.updateAcademicRegistration({
      firstName: 'KU',
      lastName: 'Student',
      telephone: '0812345678',
      occupationId: 'occupation-id',
      studentId: '6712345678',
      departmentId: 'department-id',
      termsVersion: '2026-01-01',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/academic-registration',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          firstName: 'KU',
          lastName: 'Student',
          telephone: '0812345678',
          occupationId: 'occupation-id',
          studentId: '6712345678',
          departmentId: 'department-id',
          termsVersion: '2026-01-01',
        }),
      })
    );
  });

  test('forwards a stable idempotency key for profile mutations', async () => {
    fetchMock.mockResolvedValue(response({ success: true }));

    await api.updateProfile({ bio: null }, { idempotencyKey: 'profile-bio-clear-1' });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.headers).toEqual(expect.objectContaining({
      'Idempotency-Key': 'profile-bio-clear-1',
    }));
  });

  test('deletes a persisted certificate through the documented endpoint', async () => {
    fetchMock.mockResolvedValue(response({ success: true }));

    await api.deleteCertificate('certificate-id');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/profile/certificates/certificate-id',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  test('loads Experience through the profile endpoint', async () => {
    fetchMock.mockResolvedValue(response({
      success: true,
      data: [{ id: 'experience-id', title: 'Tutor', employmentType: 'Part-time', organization: 'KU', description: null, startedAt: '2024-06-01', endedAt: null }],
    }));

    await expect(api.listExperience()).resolves.toEqual([
      expect.objectContaining({ id: 'experience-id', title: 'Tutor' }),
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/profile/experience',
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('creates Experience with the backend-required employment type', async () => {
    fetchMock.mockResolvedValue(response({
      success: true,
      data: { experience: { id: 'experience-id', title: 'Tutor', employmentType: 'Part-time', startedAt: '2024-06-01' } },
    }));

    await api.createExperience({ title: 'Tutor', employmentType: 'Part-time', startedAt: '2024-06-01' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/profile/experience',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Tutor', employmentType: 'Part-time', startedAt: '2024-06-01' }),
      })
    );
  });

  test('updates and deletes an existing Experience without creating a duplicate', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ success: true, data: { experience: { id: 'experience-id', title: 'Lead Tutor', employmentType: 'Part-time', startedAt: '2024-06-01', endedAt: null } } }))
      .mockResolvedValueOnce(response({ success: true }));

    await api.updateExperience('experience-id', { title: 'Lead Tutor', endedAt: null });
    await api.deleteExperience('experience-id');

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/api/v1/profile/experience/experience-id');
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ title: 'Lead Tutor', endedAt: null }),
    }));
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
  });

  test('creates Portfolio Work without an image when the optional image is absent', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: { id: 'work-id' } }));

    await api.createPortfolio({ title: 'Text-only project', description: 'Details', imageUris: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/profile/portfolio',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
    );
    const formData = (fetchMock.mock.calls[0][1] as RequestInit).body as FormData;
    expect(formData.get('title')).toBe('Text-only project');
    expect(formData.get('images')).toBeNull();
  });

  test('loads reputation and review data with the selected review filter', async () => {
    fetchMock
      .mockResolvedValueOnce(response({
        success: true,
        data: { totalQuests: 3, rating: { average: 4.5, count: 2, distribution: { '5': 1, '4': 1, '3': 0, '2': 0, '1': 0 } } },
      }))
      .mockResolvedValueOnce(response({
        success: true,
        data: { items: [], total: 0, nextCursor: null },
      }));

    await expect(api.getReputation()).resolves.toMatchObject({ totalQuests: 3 });
    await expect(api.listReviews(1)).resolves.toEqual({ items: [], total: 0 });
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.example.test/api/v1/profile/reviews?rating=1');
  });

  test('uploads certificate images as supported FormData file parts', async () => {
    fetchMock.mockResolvedValue(response({ success: true }));

    await api.uploadCertificateImage('certificate-id', { uri: 'file:///tmp/certificate.jpeg' });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const formData = request.body as FormData;
    expect(formData.get('image')).toBeInstanceOf(Blob);
  });

  test('maps API errors to ApiError with the documented error payload', async () => {
    fetchMock.mockResolvedValue(response({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No active session.' },
    }, 401));

    await expect(api.getAcademicRegistrationStatus()).rejects.toEqual(
      new ApiError(401, 'UNAUTHORIZED', 'No active session.')
    );
  });
});
