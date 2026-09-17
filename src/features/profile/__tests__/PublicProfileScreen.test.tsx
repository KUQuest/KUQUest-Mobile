import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import PublicProfileScreen from "../PublicProfileScreen";
import { authService } from "../../auth/AuthService";

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: "public-student-1" }),
}));

jest.mock("../../auth/AuthService", () => ({
  authService: {
    getStudentApi: jest.fn(),
  },
}));

jest.mock("../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

const mockPublicProfile = {
  version: 1,
  firstName: "Jane",
  lastName: "Doe",
  bio: "Software Engineering student building mobile apps",
  academicYear: 3,
  department: {
    id: "dept-1",
    name: "Software Engineering",
    faculty: { name: "Engineering" },
  },
  avatar: {
    fileId: "avatar-1",
    url: "https://example.test/avatar.png",
  },
  occupation: {
    id: "occ-1",
    name: "Student",
  },
  experience: [
    {
      id: "exp-1",
      title: "Mobile Developer Intern",
      employmentType: "Internship",
      organization: "Tech Corp",
      description: "Built React Native apps",
      startedAt: "2025-06-01",
      endedAt: null,
      createdAt: "2025-06-01T00:00:00.000Z",
      updatedAt: "2025-06-01T00:00:00.000Z",
    },
  ],
  portfolio: [
    {
      id: "work-1",
      title: "KUQuest App",
      description: "Student quest marketplace",
      images: [
        { fileId: "img-1", position: 0, url: "https://example.test/work.png" },
      ],
      createdAt: "2025-01-01T00:00:00.000Z",
    },
  ],
  certificates: [
    {
      id: "cert-1",
      name: "React Native Masterclass",
      issuer: "Expo",
      issuedAt: "2025-01-15",
      image: { fileId: "cert-img-1", url: "https://example.test/cert.png" },
      createdAt: "2025-01-15T00:00:00.000Z",
      updatedAt: "2025-01-15T00:00:00.000Z",
    },
  ],
};

const mockReviews = {
  items: [
    {
      id: "rev-1",
      reviewer: { displayName: "Hirer Bob", avatar: null },
      rating: 5,
      comment: "Super reliable worker!",
      createdAt: "2025-08-01T00:00:00.000Z",
      quest: { id: "q-1", title: "Build Mobile UI" },
    },
  ],
  total: 1,
  nextCursor: null,
};

describe("PublicProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getStudentApi as jest.Mock).mockResolvedValue({
      getPublicProfile: jest.fn().mockResolvedValue(mockPublicProfile),
      listPublicReviews: jest.fn().mockResolvedValue(mockReviews),
    });
  });

  it("renders the public profile data and does not render an edit profile button", async () => {
    const view = await render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(view.getAllByText("Jane Doe").length).toBeGreaterThan(0);
    });

    expect(view.getByText("Engineering")).toBeTruthy();
    expect(view.getByText("Software Engineering")).toBeTruthy();
    expect(view.getByText("Student")).toBeTruthy();
    expect(
      view.getAllByText("Software Engineering student building mobile apps")
        .length
    ).toBeGreaterThan(0);
    expect(view.getByTestId("profile-tags-unavailable")).toBeTruthy();
    expect(
      view.getByText(/Profile Rating is temporarily unavailable/)
    ).toBeTruthy();

    // Public profiles remain read-only.
    expect(view.queryByText("Edit Profile")).toBeNull();

    // Verify Back button works
    const backButton = view.getByTestId("public-profile-back-button");
    fireEvent.press(backButton);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("switches tabs and displays experience, works, certificates, and reviews", async () => {
    const view = await render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(view.getAllByText("Jane Doe").length).toBeGreaterThan(0);
    });

    // Switch to Experience tab
    const experienceTab = view.getByTestId("public-profile-tab-experience");
    fireEvent.press(experienceTab);
    await waitFor(() => {
      expect(view.getByText("Mobile Developer Intern")).toBeTruthy();
    });

    // Switch to Works tab
    const worksTab = view.getByTestId("public-profile-tab-works");
    fireEvent.press(worksTab);
    await waitFor(() => {
      expect(view.getByText("KUQuest App")).toBeTruthy();
    });

    // Switch to Certificates tab
    const certsTab = view.getByTestId("public-profile-tab-certificates");
    fireEvent.press(certsTab);
    await waitFor(() => {
      expect(view.getByText("React Native Masterclass")).toBeTruthy();
    });

    // Switch to Reviews tab
    const reviewsTab = view.getByTestId("public-profile-tab-reviews");
    fireEvent.press(reviewsTab);
    await waitFor(() => {
      expect(view.getByText("Super reliable worker!")).toBeTruthy();
    });
  });
});
