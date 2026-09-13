import { ProfileApi } from '../ProfileApi';
import { ApiError } from '../ApiClient';
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
      listExperience: jest.fn().mockResolvedValue([]),
      listPortfolio: jest.fn().mockResolvedValue([]),
      listCertificates: jest.fn().mockResolvedValue([]),
    } as unknown as StudentApi;

    await expect(new ProfileApi(studentApi).getEditData()).resolves.toEqual({
      profile: createProfile(),
      experiences: [],
      portfolio: [],
      certificates: [],
      sectionErrors: {},
      sectionUnavailable: {},
    });
  });

  test('keeps unrelated editor sections available when one collection fails', async () => {
    const studentApi = {
      getProfile: jest.fn().mockResolvedValue(createProfile()),
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

  test('marks a missing collection as unsupported without hiding other sections', async () => {
    const studentApi = {
      getProfile: jest.fn().mockResolvedValue(createProfile()),
      listExperience: jest.fn().mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Not published')),
      listPortfolio: jest.fn().mockResolvedValue([]),
      listCertificates: jest.fn().mockResolvedValue([]),
    } as unknown as StudentApi;

    await expect(new ProfileApi(studentApi).getEditData()).resolves.toMatchObject({
      experiences: [],
      portfolio: [],
      certificates: [],
      sectionErrors: {},
      sectionUnavailable: { experience: true },
    });
  });
  test('saves only staging-supported basics fields through the public profile endpoint', async () => {
    const studentApi = {
      updateProfile: jest.fn().mockResolvedValue(undefined),
      getProfile: jest.fn().mockResolvedValue(createProfile()),
    } as unknown as StudentApi;
    const api = new ProfileApi(studentApi);

    await expect(api.updateBasics({
      firstName: 'Ada',
      lastName: 'Lovelace',
      bio: 'Updated',
      telephone: '0812345678',
      departmentId: 'department-id',
    })).resolves.toEqual(createProfile());

    expect(studentApi.updateProfile).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      bio: 'Updated',
      telephone: '0812345678',
      departmentId: 'department-id',
    });
  });
  test('omits a blank bio so an existing Profile value is preserved', async () => {
    const studentApi = {
      updateProfile: jest.fn().mockResolvedValue(undefined),
      getProfile: jest.fn().mockResolvedValue(createProfile()),
    } as unknown as StudentApi;

    await new ProfileApi(studentApi).updateBasics({ bio: '   ' });

    expect(studentApi.updateProfile).toHaveBeenCalledWith({});
  });

});
