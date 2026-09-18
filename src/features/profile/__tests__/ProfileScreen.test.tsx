import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ProfileScreen from "../ProfileScreen";
import { profileModule } from "../profileModule";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, []),
}));

jest.mock("../../auth/AuthService", () => ({
  authService: { signOut: jest.fn() },
}));

jest.mock("../../../features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("../profileModule", () => ({
  profileModule: {
    loadProfile: jest.fn(),
  },
}));

const mockedLoadProfile = profileModule.loadProfile as jest.MockedFunction<
  typeof profileModule.loadProfile
>;

const profileData = {
  name: "Siraphat THAPPHA",
  faculty: "Engineering",
  university: "",
  occupation: "Student",
  academicYear: "",
  department: "Software and Knowledge Engineering",
  tags: [{ id: "web", name: "Web Dev" }],
  profileImage: "",
  about: "A profile description",
  stats: {
    totalQuests: 42,
    ratingAverage: 4.9,
    ratingCount: 15,
    distribution: { 5: 12, 4: 2, 3: 1, 2: 0, 1: 0 },
  },
  experiences: [
    {
      id: "experience",
      title: "Frontend Developer",
      employmentType: "Internship",
      organization: "Tech Startup",
      description: "Built mobile interfaces",
      startedAt: "2024-01-01",
      endedAt: null,
    },
  ],
  certificates: [
    {
      id: "certificate",
      title: "Advanced React Patterns",
      issuer: "Frontend Masters",
      issuedYear: "2023",
      link: "https://example.test/certificate.png",
    },
  ],
  works: [
    {
      id: "work",
      title: "KUQuest App",
      detail: "Student quest marketplace",
      imageUri: "",
    },
  ],
  reviews: [],
  sectionErrors: {},
  sectionUnavailable: {},
};

describe("Student Profile screen", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockedLoadProfile.mockReset();
    mockedLoadProfile.mockResolvedValue(profileData);
  });
  const renderLoadedProfile = async () => {
    const view = await render(<ProfileScreen />);
    await waitFor(() =>
      expect(view.getByTestId("profile-tab-about")).toBeTruthy()
    );
    return view;
  };

  it("shows the page skeleton until profile data settles", async () => {
    let resolveProfile!: (value: typeof profileData) => void;
    mockedLoadProfile.mockReturnValueOnce(
      new Promise<typeof profileData>((resolve) => {
        resolveProfile = resolve;
      })
    );

    const view = await render(<ProfileScreen />);

    expect(view.getByLabelText("Loading profile...")).toBeTruthy();
    expect(view.queryByTestId("profile-header")).toBeNull();

    resolveProfile(profileData);
    await waitFor(() =>
      expect(view.getByTestId("profile-header")).toBeTruthy()
    );
  });

  it("opens About by default, supports edit navigation, and exposes section tabs", async () => {
    const view = await renderLoadedProfile();

    expect(view.getByText("Profile")).toBeTruthy();
    expect(view.getByTestId("open-settings")).toBeTruthy();
    expect(view.getByText("Edit Profile")).toBeTruthy();
    fireEvent.press(view.getByRole("button", { name: "Edit Profile" }));
    expect(mockPush).toHaveBeenCalledWith("/profile/edit");
    expect(view.getByText("Profile Rating")).toBeTruthy();
    expect(view.getByTestId("profile-stats")).toBeTruthy();
    expect(view.getByText("Most frequent Quest categories")).toBeTruthy();
    expect(
      view.getByTestId("profile-content-scroll").props.stickyHeaderIndices
    ).toBeUndefined();
    expect(view.getByText("A profile description")).toBeTruthy();
    expect(view.getByTestId("profile-tab-experience")).toBeTruthy();
    expect(view.getByTestId("profile-tab-works")).toBeTruthy();
    expect(view.getByTestId("profile-tab-certificates")).toBeTruthy();
    expect(view.getByTestId("profile-tab-reviews")).toBeTruthy();
  });

  it("opens Experience when its tab is pressed", async () => {
    const view = await renderLoadedProfile();

    await fireEvent.press(view.getByTestId("profile-tab-experience"));
    await waitFor(() =>
      expect(view.getByText("Frontend Developer")).toBeTruthy()
    );
    expect(view.getByTestId("profile-section-Experience")).toBeTruthy();
    expect(view.queryByText("A profile description")).toBeNull();
  });

  it("opens Works when its tab is pressed", async () => {
    const view = await renderLoadedProfile();

    await fireEvent.press(view.getByTestId("profile-tab-works"));
    await waitFor(() =>
      expect(view.getByTestId("profile-section-Works")).toBeTruthy()
    );
    expect(view.queryByText("Frontend Developer")).toBeNull();
  });

  it("opens Certificates when its tab is pressed", async () => {
    const view = await renderLoadedProfile();

    await fireEvent.press(view.getByTestId("profile-tab-certificates"));
    await waitFor(() =>
      expect(view.getByText("Advanced React Patterns")).toBeTruthy()
    );
    expect(view.getByTestId("profile-section-Certificates")).toBeTruthy();
    expect(view.getByText("View certificate preview")).toBeTruthy();
    expect(view.getByText("Frontend Masters")).toBeTruthy();
  });

  it("opens Reviews when its tab is pressed", async () => {
    const view = await renderLoadedProfile();

    await fireEvent.press(view.getByTestId("profile-tab-reviews"));
    await waitFor(() =>
      expect(view.getByTestId("profile-reviews-list")).toBeTruthy()
    );
    expect(view.getByTestId("profile-review-summary")).toBeTruthy();
    expect(
      view.getByTestId("profile-reviews-list").props.stickyHeaderIndices
    ).toEqual([]);
  });

  it("preserves the profile scroll position when opening Reviews", async () => {
    const view = await render(<ProfileScreen />);

    await waitFor(() =>
      expect(view.getByTestId("profile-tab-about")).toBeTruthy()
    );
    await fireEvent.scroll(view.getByTestId("profile-content-scroll"), {
      nativeEvent: { contentOffset: { x: 0, y: 180 } },
    });
    await fireEvent.press(view.getByTestId("profile-tab-reviews"));

    await waitFor(() =>
      expect(view.getByTestId("profile-reviews-list")).toBeTruthy()
    );
    expect(
      view.getByTestId("profile-reviews-list").props.contentOffset
    ).toEqual({ x: 0, y: 180 });
    expect(
      view.getByTestId("profile-reviews-list").props.contentContainerStyle
    ).toEqual(expect.objectContaining({ paddingTop: 16 }));
    expect(view.getByTestId("profile-section-Reviews").props.style).toEqual(
      expect.objectContaining({ marginTop: 16 })
    );
  });

  it("offers an Edit Profile recovery action when About is empty", async () => {
    mockedLoadProfile.mockResolvedValue({ ...profileData, about: "" });

    const view = await render(<ProfileScreen />);

    await waitFor(() =>
      expect(view.getByTestId("profile-tab-about")).toBeTruthy()
    );
    const editButtons = view.getAllByRole("button", { name: "Edit Profile" });
    expect(editButtons.length).toBeGreaterThan(1);
    fireEvent.press(editButtons[editButtons.length - 1]);
    expect(mockPush).toHaveBeenCalledWith("/profile/edit");
  });

  it("shows unavailable rating state without a retry action", async () => {
    mockedLoadProfile.mockResolvedValue({
      ...profileData,
      sectionUnavailable: { reputation: true },
    });

    const view = await render(<ProfileScreen />);

    await waitFor(() =>
      expect(
        view.getByText("Profile Rating is temporarily unavailable.")
      ).toBeTruthy()
    );
    expect(view.queryByLabelText("Try again")).toBeNull();
  });

  it("hides the transparent profile top bar with navigation while scrolling down", async () => {
    const view = await render(<ProfileScreen />);

    await waitFor(() =>
      expect(view.getByTestId("profile-content-scroll")).toBeTruthy()
    );
    const scrollView = view.getByTestId("profile-content-scroll");
    const getTopBar = () =>
      view.getByTestId("profile-top-bar", { includeHiddenElements: true });

    await fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    await fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { x: 0, y: 12 } },
    });

    await waitFor(() => expect(getTopBar().props.pointerEvents).toBe("none"));
    expect(getTopBar().props.accessibilityElementsHidden).toBe(true);

    await fireEvent.scroll(scrollView, {
      nativeEvent: { contentOffset: { x: 0, y: 0 } },
    });
    await waitFor(() =>
      expect(getTopBar().props.pointerEvents).toBe("box-none")
    );
  });
});
