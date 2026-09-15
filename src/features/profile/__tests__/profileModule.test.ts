import { ApiError } from "../../../api/ApiClient";
import type {
  AcademicRegistrationOptions,
  AcademicRegistrationStatus,
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
  ProfileResponse,
  ProfileReview,
  Reputation,
} from "../../../api/contracts";
import { authService } from "../../auth/AuthService";
import { AuthError } from "../../auth/types";
import { profileModule } from "../profileModule";

jest.mock("../../auth/AuthService", () => ({
  authService: {
    getSession: jest.fn(),
    getStudentApi: jest.fn(),
    getProfileApi: jest.fn(),
  },
}));

const mockedAuthService = authService as unknown as {
  getSession: jest.Mock;
  getStudentApi: jest.Mock;
  getProfileApi: jest.Mock;
};

const fakeProfile: ProfileResponse = {
  email: "student@ku.th",
  firstName: "Jane",
  lastName: "Doe",
  telephone: "0812345678",
  studentId: "6510000000",
  academicYear: 3,
  university: "State University",
  occupation: { id: "occ-1", name: "Software Engineer" },
  tags: [
    { id: "1", name: "Design" },
    { id: "2", name: "Web" },
    { id: "3", name: "Tutor" },
    { id: "4", name: "Volunteer" },
  ],
  department: {
    id: "dept-1",
    name: "Computer Engineering",
    faculty: { name: "Engineering" },
  },
  avatar: { fileId: "avatar-file", url: "https://example.test/avatar.jpg" },
  bio: "A motivated engineer",
};

const fakeOptions: AcademicRegistrationOptions = {
  faculties: [
    {
      id: "fac-1",
      name: "Engineering",
      departments: [{ id: "dept-1", name: "Computer Engineering" }],
    },
  ],
  occupations: [
    { id: "occ-1", name: "Software Engineer", requiresStudentId: false },
  ],
};

const fakeStatus: AcademicRegistrationStatus = {
  firstName: "Jane",
  lastName: "Doe",
  telephone: "0812345678",
  occupationId: "occ-1",
  studentId: "6510000000",
  departmentId: "dept-1",
  termsAcceptedAt: "2026-01-01T00:00:00.000Z",
  termsVersion: "1.0",
  completed: true,
};

const fakeCertificates: CertificateEntry[] = [
  {
    id: "cert-1",
    name: "React Expert",
    issuer: "Frontend Masters",
    issuedAt: "2023-05-15",
    image: { fileId: "f1", url: "https://example.test/cert.png" },
    createdAt: "2023-05-15T00:00:00.000Z",
    updatedAt: "2023-05-15T00:00:00.000Z",
  },
];

const fakePortfolio: PortfolioEntry[] = [
  {
    id: "port-1",
    title: "KUQuest App",
    description: "A mobile app",
    images: [{ fileId: "p1", position: 0, url: "https://example.test/p1.png" }],
    createdAt: "2023-06-01T00:00:00.000Z",
  },
];

const fakeExperiences: ExperienceEntry[] = [
  {
    id: "exp-1",
    title: "Junior Dev",
    employmentType: "Full-time",
    organization: "Tech Corp",
    description: "Built APIs",
    startedAt: "2022-01-01",
    endedAt: "2023-01-01",
    createdAt: "2022-01-01T00:00:00.000Z",
    updatedAt: "2022-01-01T00:00:00.000Z",
  },
  {
    id: "exp-2",
    title: "Senior Dev",
    employmentType: "Full-time",
    organization: "Innovate Inc",
    description: "Leading features",
    startedAt: "2024-01-01",
    endedAt: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

const fakeReputation: Reputation = {
  totalQuests: 12,
  rating: {
    average: 4.8,
    count: 10,
    distribution: { 5: 8, 4: 2, 3: 0, 2: 0, 1: 0 },
  },
};

const fakeReviews: { items: ProfileReview[]; total: number } = {
  items: [
    {
      id: "rev-1",
      reviewer: {
        displayName: "Professor Oak",
        avatar: { url: "https://example.test/oak.png" },
      },
      rating: 5,
      comment: "Excellent work!",
      createdAt: "2026-02-01T00:00:00.000Z",
      quest: { id: "q-1", title: "Lab Assistant" },
    },
  ],
  total: 1,
};

describe("profileModule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Live Mode", () => {
    it("throws SESSION_EXPIRED when no active session exists", async () => {
      mockedAuthService.getSession.mockResolvedValue(null);

      await expect(profileModule.loadProfile({ locale: "en" })).rejects.toThrow(
        new AuthError("SESSION_EXPIRED", "No active session")
      );
    });

    it("loads and aggregates full live profile with experience sorted newest-first", async () => {
      mockedAuthService.getSession.mockResolvedValue({
        user: { name: "Jane Doe", image: "https://example.test/user.jpg" },
      });

      const mockStudentApi = {
        getProfile: jest.fn().mockResolvedValue(fakeProfile),
        getAcademicRegistrationStatus: jest.fn().mockResolvedValue(fakeStatus),
        getAcademicRegistrationOptions: jest
          .fn()
          .mockResolvedValue(fakeOptions),
        listCertificates: jest.fn().mockResolvedValue(fakeCertificates),
        listPortfolio: jest.fn().mockResolvedValue(fakePortfolio),
        listExperience: jest.fn().mockResolvedValue(fakeExperiences),
        getReputation: jest.fn().mockResolvedValue(fakeReputation),
        listReviews: jest.fn().mockResolvedValue(fakeReviews),
      };
      mockedAuthService.getStudentApi.mockResolvedValue(mockStudentApi);

      const result = await profileModule.loadProfile({ locale: "en" });

      expect(result.name).toBe("Jane Doe");
      expect(result.faculty).toBe("Engineering");
      expect(result.department).toBe("Computer Engineering");
      expect(result.occupation).toBe("Software Engineer");
      expect(result.tags).toHaveLength(3); // Tag limit enforced
      expect(result.tags.map((item) => item.name)).toEqual([
        "Design",
        "Web",
        "Tutor",
      ]);

      // Experiences sorted newest-started-first (exp-2: 2024 before exp-1: 2022)
      expect(result.experiences[0].id).toBe("exp-2");
      expect(result.experiences[1].id).toBe("exp-1");

      expect(result.certificates).toHaveLength(1);
      expect(result.certificates[0].issuedYear).toBe("2023");
      expect(result.works).toHaveLength(1);
      expect(result.reviews).toHaveLength(1);
      expect(result.stats.totalQuests).toBe(12);
      expect(result.sectionErrors).toEqual({});
    });

    it("tolerates partial section errors without crashing the profile load", async () => {
      mockedAuthService.getSession.mockResolvedValue({
        user: { name: "Jane Doe", image: null },
      });

      const mockStudentApi = {
        getProfile: jest.fn().mockResolvedValue(fakeProfile),
        getAcademicRegistrationStatus: jest.fn().mockResolvedValue(fakeStatus),
        getAcademicRegistrationOptions: jest
          .fn()
          .mockResolvedValue(fakeOptions),
        listCertificates: jest
          .fn()
          .mockRejectedValue(new Error("Network error on certs")),
        listPortfolio: jest
          .fn()
          .mockRejectedValue(new Error("Network error on portfolio")),
        listExperience: jest.fn().mockResolvedValue([]),
        getReputation: jest.fn().mockResolvedValue(null),
        listReviews: jest
          .fn()
          .mockRejectedValue(new Error("Network error on reviews")),
      };
      mockedAuthService.getStudentApi.mockResolvedValue(mockStudentApi);

      const result = await profileModule.loadProfile({ locale: "en" });

      expect(result.name).toBe("Jane Doe");
      expect(result.certificates).toEqual([]);
      expect(result.works).toEqual([]);
      expect(result.sectionErrors).toEqual({
        certificates: true,
        works: true,
        reviews: true,
      });
    });

    it("throws SESSION_EXPIRED if an endpoint responds with 401", async () => {
      mockedAuthService.getSession.mockResolvedValue({
        user: { name: "Jane Doe", image: null },
      });

      const mockStudentApi = {
        getProfile: jest
          .fn()
          .mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Unauthorized")),
      };
      mockedAuthService.getStudentApi.mockResolvedValue(mockStudentApi);

      await expect(profileModule.loadProfile({ locale: "en" })).rejects.toThrow(
        new AuthError("SESSION_EXPIRED")
      );
    });
  });

  describe("Academic Registration Draft Mapping", () => {
    it("correctly maps API records into a ProfileDraft", () => {
      const draft = profileModule.mapProfileRecordsToDraft({
        profile: fakeProfile,
        status: fakeStatus,
        options: fakeOptions,
        certificates: fakeCertificates,
        portfolio: fakePortfolio,
        experiences: fakeExperiences,
        fallbackName: "Fallback Name",
        fallbackImage: "https://example.test/fallback.jpg",
      });

      expect(draft.name).toBe("Jane Doe");
      expect(draft.telephone).toBe("0812345678");
      expect(draft.occupation).toBe("occ-1");
      expect(draft.studentId).toBe("6510000000");
      expect(draft.faculty).toBe("fac-1");
      expect(draft.department).toBe("dept-1");
      expect(draft.acceptedTerms).toBe(true);
      expect(draft.certificates).toHaveLength(1);
      expect(draft.certificates[0].name).toBe("React Expert");
      expect(draft.works).toHaveLength(1);
      expect(draft.works[0].title).toBe("KUQuest App");
      expect(draft.experiences).toHaveLength(2);
    });
  });
});
