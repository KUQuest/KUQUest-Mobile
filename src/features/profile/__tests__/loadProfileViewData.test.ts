import { ApiError } from '../../../api/ApiClient';
import { authService } from '../../auth/AuthService';
import { loadProfileViewData } from '../loadProfileViewData';

jest.mock('../../auth/AuthService', () => ({
  authService: {
    getSession: jest.fn(),
    getStudentApi: jest.fn(),
  },
}));

const mockedAuthService = authService as unknown as {
  getSession: jest.Mock;
  getStudentApi: jest.Mock;
};

function createApi(overrides: Record<string, unknown> = {}) {
  return {
    getProfile: jest.fn().mockResolvedValue({
      email: 'student@ku.th',
      firstName: 'Jane',
      lastName: 'Doe',
      bio: 'About Jane',
      telephone: null,
      studentId: null,
      academicYear: 3,
      university: 'Kasetsart University',
      occupation: null,
      tags: [
        { id: 'design', name: 'Design', questCount: 2 },
        { id: 'web', name: 'Web', questCount: 9 },
        { id: 'tutor', name: 'Tutor', questCount: 9 },
        { id: 'research', name: 'Research', questCount: 1 },
      ],
      department: { id: 'department', name: 'Software Engineering', faculty: { name: 'Engineering' } },
      avatar: null,
    }),
    getAcademicRegistrationStatus: jest.fn().mockResolvedValue({ occupationId: 'student' }),
    getAcademicRegistrationOptions: jest.fn().mockResolvedValue({ occupations: [{ id: 'student', name: 'Student' }] }),
    listCertificates: jest.fn().mockResolvedValue([{ id: 'certificate', name: 'Certificate', issuer: 'KU', issuedAt: '2024-01-01', image: null }]),
    listPortfolio: jest.fn().mockResolvedValue([{ id: 'work', title: 'Work', description: 'Details', images: [], createdAt: '2024-01-01' }]),
    listExperience: jest.fn().mockResolvedValue([]),
    getReputation: jest.fn().mockResolvedValue({ totalQuests: 2, rating: { average: 4, count: 1, distribution: { 5: 0, 4: 1, 3: 0, 2: 0, 1: 0 } } }),
    listReviews: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    ...overrides,
  };
}

describe('loadProfileViewData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_PROFILE_DEMO;
    mockedAuthService.getSession.mockResolvedValue({ user: { name: 'Jane Doe', image: null } });
  });

  test('preserves supported profile sections when optional reads fail', async () => {
    const api = createApi({
      listPortfolio: jest.fn().mockRejectedValue(new Error('portfolio unavailable')),
      getReputation: jest.fn().mockRejectedValue(new Error('reputation unavailable')),
    });
    mockedAuthService.getStudentApi.mockResolvedValue(api);

    const data = await loadProfileViewData('en');

    expect(data.name).toBe('Jane Doe');
    expect(data.certificates).toHaveLength(1);
    expect(data.sectionErrors).toEqual({ works: true, reputation: true });
    expect(data.works).toEqual([]);
    expect(data.stats).toMatchObject({ totalQuests: null, ratingAverage: null });
  });

  test('treats unsupported optional endpoints as honest empty states without demo mode', async () => {
    const api = createApi({
      listExperience: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Unsupported')),
      listReviews: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Unsupported')),
    });
    mockedAuthService.getStudentApi.mockResolvedValue(api);

    const data = await loadProfileViewData('en');

    expect(data.experiences).toEqual([]);
    expect(data.reviews).toEqual([]);
    expect(data.sectionErrors).toEqual({});
  });

  test('uses mockup-like media and sections only for unsupported endpoints in explicit demo mode', async () => {
    process.env.EXPO_PUBLIC_PROFILE_DEMO = 'true';
    const api = createApi({
      listCertificates: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Unsupported')),
      listPortfolio: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Unsupported')),
      listExperience: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Unsupported')),
      getReputation: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Unsupported')),
      listReviews: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Unsupported')),
    });
    mockedAuthService.getStudentApi.mockResolvedValue(api);

    const data = await loadProfileViewData('en');

    expect(data.profileImage).toBeTruthy();
    expect(data.certificates.length).toBeGreaterThan(0);
    expect(data.works.length).toBeGreaterThan(0);
    expect(data.experiences.length).toBeGreaterThan(0);
    expect(data.reviews.length).toBeGreaterThan(0);
    expect(data.stats.totalQuests).toBe(42);
    expect(data.sectionErrors).toEqual({});
  });
});
