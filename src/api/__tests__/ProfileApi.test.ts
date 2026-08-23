import { ProfileApi } from '../ProfileApi';
import type { StudentApi } from '../StudentApi';

function createProfile() {
  return {
    email: 'student@ku.th',
    firstName: 'Ada',
    lastName: 'Student',
    bio: 'A bio',
    telephone: '0812345678',
    studentId: '6712345678',
    academicYear: '3',
    university: 'Kasetsart University',
    occupation: { id: 'occupation-id', name: 'Student' },
    tags: [{ id: 'design', name: 'Design' }],
    department: { id: 'department-id', name: 'Software Engineering', faculty: { name: 'Science' } },
    avatar: { fileId: 'avatar-id', url: 'https://example.test/avatar.jpg' },
  };
}

describe('ProfileApi', () => {
  test('loads the editable Student Profile data as one feature-facing document', async () => {
    const studentApi = {
      getProfile: jest.fn().mockResolvedValue(createProfile()),
      getAcademicRegistrationOptions: jest.fn().mockResolvedValue({
        occupations: [{ id: 'occupation-id', name: 'Student', requiresStudentId: true }],
        faculties: [],
      }),
      listExperience: jest.fn().mockResolvedValue([]),
      listPortfolio: jest.fn().mockResolvedValue([]),
      listCertificates: jest.fn().mockResolvedValue([]),
    } as unknown as StudentApi;

    await expect(new ProfileApi(studentApi).getEditData()).resolves.toEqual({
      profile: createProfile(),
      occupations: [{ id: 'occupation-id', name: 'Student', requiresStudentId: true }],
      experiences: [],
      portfolio: [],
      certificates: [],
      sectionErrors: {},
    });
  });

  test('keeps unrelated editor sections available when one collection fails', async () => {
    const studentApi = {
      getProfile: jest.fn().mockResolvedValue(createProfile()),
      getAcademicRegistrationOptions: jest.fn().mockResolvedValue({ occupations: [], faculties: [] }),
      listExperience: jest.fn().mockRejectedValue(new Error('Experience unavailable')),
      listPortfolio: jest.fn().mockResolvedValue([]),
      listCertificates: jest.fn().mockResolvedValue([]),
    } as unknown as StudentApi;

    await expect(new ProfileApi(studentApi).getEditData()).resolves.toMatchObject({
      experiences: [],
      portfolio: [],
      certificates: [],
      sectionErrors: { experience: true },
    });
  });

  test('saves a focused basics edit through the public profile endpoint', async () => {
    const studentApi = {
      updateProfile: jest.fn().mockResolvedValue(undefined),
      getProfile: jest.fn().mockResolvedValue(createProfile()),
    } as unknown as StudentApi;
    const api = new ProfileApi(studentApi);

    await expect(api.updateBasics({
      firstName: 'Ada',
      lastName: 'Lovelace',
      bio: 'Updated',
      occupationId: 'occupation-id',
    })).resolves.toEqual(createProfile());

    expect(studentApi.updateProfile).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      bio: 'Updated',
      occupationId: 'occupation-id',
    });
  });

  test('sends null when a Student clears their bio', async () => {
    const studentApi = {
      updateProfile: jest.fn().mockResolvedValue(undefined),
      getProfile: jest.fn().mockResolvedValue(createProfile()),
    } as unknown as StudentApi;

    await new ProfileApi(studentApi).updateBasics({ bio: null });

    expect(studentApi.updateProfile).toHaveBeenCalledWith({ bio: null });
  });

  test('rethrows non-404 occupation option failures', async () => {
    const studentApi = {
      getProfile: jest.fn().mockResolvedValue(createProfile()),
      getAcademicRegistrationOptions: jest.fn().mockRejectedValue(new Error('temporary failure')),
      listExperience: jest.fn().mockResolvedValue([]),
      listPortfolio: jest.fn().mockResolvedValue([]),
      listCertificates: jest.fn().mockResolvedValue([]),
    } as unknown as StudentApi;

    await expect(new ProfileApi(studentApi).getEditData()).rejects.toThrow('temporary failure');
  });

});
