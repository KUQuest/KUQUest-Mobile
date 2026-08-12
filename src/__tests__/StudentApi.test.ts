import { ApiClient, ApiError } from '../api/ApiClient';
import { StudentApi } from '../api/StudentApi';

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

  test('deletes a persisted certificate through the documented endpoint', async () => {
    fetchMock.mockResolvedValue(response({ success: true }));

    await api.deleteCertificate('certificate-id');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/profile/certificates/certificate-id',
      expect.objectContaining({ method: 'DELETE' })
    );
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
