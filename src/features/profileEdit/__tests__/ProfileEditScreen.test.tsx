import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import ProfileEditSectionScreen, {
  EditProfileHubScreen,
} from "../ProfileEditScreen";
import { authService } from "../../auth/AuthService";

const mockRouteParams: Record<string, string> = {};
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockRouteParams,
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
    dispatch: jest.fn(),
  }),
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
  }),
  useFocusEffect: (effect: () => (() => void) | void) =>
    jest.requireActual("react").useEffect(effect, []),
}));

jest.mock("../../auth/AuthService", () => ({
  authService: {
    getStudentApi: jest.fn(),
    signOut: jest.fn(),
  },
}));

jest.mock("../../../features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

const mockedGetStudentApi = authService.getStudentApi as jest.MockedFunction<
  typeof authService.getStudentApi
>;

const editData = {
  profile: {
    email: "student@ku.th",
    firstName: "Ada",
    lastName: "Student",
    bio: "A bio",
    telephone: null,
    studentId: null,
    academicYear: null,
    university: "Kasetsart University",
    occupation: { id: "occupation-id", name: "Student" },
    tags: [{ id: "design", name: "Design" }],
    department: null,
    avatar: null,
  },
  experiences: [],
  portfolio: [],
  certificates: [],
  sectionErrors: {},
  sectionUnavailable: {},
};

describe("Edit Profile hub", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete mockRouteParams.section;
    delete mockRouteParams.itemId;
    mockedGetStudentApi.mockResolvedValue({
      getEditData: jest.fn().mockResolvedValue(editData),
    } as never);
  });

  it("shows the hub skeleton until edit data settles", async () => {
    let resolveData!: (value: typeof editData) => void;
    const getEditData = jest.fn().mockReturnValue(
      new Promise<typeof editData>((resolve) => {
        resolveData = resolve;
      })
    );
    mockedGetStudentApi.mockResolvedValue({ getEditData } as never);

    const view = await renderWithQueryClient(<EditProfileHubScreen />);

    expect(view.getByLabelText("Loading profile editor...")).toBeTruthy();
    expect(view.queryByTestId("profile-edit-section-basics")).toBeNull();

    resolveData(editData);
    await waitFor(() =>
      expect(view.getByTestId("profile-edit-section-basics")).toBeTruthy()
    );
  });

  it("shows focused public profile editing sections and their empty summaries", async () => {
    const view = await renderWithQueryClient(<EditProfileHubScreen />);

    await waitFor(() =>
      expect(view.getByTestId("profile-edit-section-basics")).toBeTruthy()
    );
    expect(view.getByTestId("profile-edit-section-basics")).toBeTruthy();
    expect(view.getAllByText("Name, avatar, and bio")).toHaveLength(2);
    expect(view.getByText("0 entries")).toBeTruthy();
    expect(view.getByText("0 projects")).toBeTruthy();
    expect(view.getByText("0 certificates")).toBeTruthy();
  });

  it("routes academic identity edits through Academic Registration", async () => {
    const view = await renderWithQueryClient(<EditProfileHubScreen />);

    await waitFor(() =>
      expect(
        view.getByTestId("profile-edit-section-academic-registration")
      ).toBeTruthy()
    );
    fireEvent.press(
      view.getByTestId("profile-edit-section-academic-registration")
    );

    expect(mockPush).toHaveBeenCalledWith("/onboarding?mode=edit");
  });
  it("does not route academic identity edits through the demo flow", async () => {
    const previousDemoValue = process.env.EXPO_PUBLIC_PROFILE_DEMO;
    process.env.EXPO_PUBLIC_PROFILE_DEMO = "true";
    try {
      const view = await renderWithQueryClient(<EditProfileHubScreen />);
      await waitFor(() =>
        expect(
          view.getByTestId("profile-edit-section-academic-registration")
        ).toBeTruthy()
      );

      fireEvent.press(
        view.getByTestId("profile-edit-section-academic-registration")
      );

      expect(mockPush).not.toHaveBeenCalled();
      expect(view.getByText("Unavailable")).toBeTruthy();
    } finally {
      if (previousDemoValue === undefined)
        delete process.env.EXPO_PUBLIC_PROFILE_DEMO;
      else process.env.EXPO_PUBLIC_PROFILE_DEMO = previousDemoValue;
    }
  });

  it("offers a native Back action from the hub", async () => {
    const view = await renderWithQueryClient(<EditProfileHubScreen />);
    await waitFor(() => expect(view.getByText("Edit Profile")).toBeTruthy());
    fireEvent.press(view.getByRole("button", { name: "Go back" }));
  });

  it("shows a recoverable section error without offering Add", async () => {
    mockRouteParams.section = "portfolio";
    mockedGetStudentApi.mockResolvedValue({
      getEditData: jest
        .fn()
        .mockResolvedValue({ ...editData, sectionErrors: { portfolio: true } }),
    } as never);
    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    await waitFor(() =>
      expect(
        view.getByText("This section is temporarily unavailable.")
      ).toBeTruthy()
    );
    expect(view.queryByText("Add")).toBeNull();
    expect(view.getByText("Try again")).toBeTruthy();
  });

  it("shows an explicit unsupported section without offering mutations", async () => {
    mockRouteParams.section = "portfolio";
    mockedGetStudentApi.mockResolvedValue({
      getEditData: jest.fn().mockResolvedValue({
        ...editData,
        sectionUnavailable: { portfolio: true },
      }),
    } as never);
    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    await waitFor(() => expect(view.getByText("Unavailable")).toBeTruthy());
    expect(view.queryByText("Add")).toBeNull();
    expect(view.queryByText("Try again")).toBeNull();
  });

  it("does not open an editor for an unavailable direct item route", async () => {
    mockRouteParams.section = "portfolio";
    mockRouteParams.itemId = "new";
    mockedGetStudentApi.mockResolvedValue({
      getEditData: jest.fn().mockResolvedValue({
        ...editData,
        sectionUnavailable: { portfolio: true },
      }),
    } as never);
    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    await waitFor(() => expect(view.getByText("Unavailable")).toBeTruthy());
    expect(view.queryByText("Save changes")).toBeNull();
    expect(view.queryByLabelText("Title")).toBeNull();
  });
  it("opens a focused new Experience editor from Add", async () => {
    mockRouteParams.section = "experience";
    mockRouteParams.itemId = "new";
    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    await waitFor(() =>
      expect(view.getByLabelText("Role or experience title")).toBeTruthy()
    );
    expect(
      view.getByText(
        "Add a role, project, or activity to show your background on your public profile."
      )
    ).toBeTruthy();
    expect(view.getByText("Organization (optional)")).toBeTruthy();
    expect(view.getByText("Description (optional)")).toBeTruthy();
    expect(view.getByText("Save changes")).toBeTruthy();
  });

  it("uses an editor-shaped skeleton for a new certificate route", async () => {
    mockRouteParams.section = "certificates";
    mockRouteParams.itemId = "new";
    let resolveData!: (value: typeof editData) => void;
    mockedGetStudentApi.mockResolvedValue({
      getEditData: jest.fn().mockReturnValue(
        new Promise<typeof editData>((resolve) => {
          resolveData = resolve;
        })
      ),
    } as never);

    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    expect(
      view.getByTestId("profile-edit-loading-skeleton-certificates-editor")
    ).toBeTruthy();
    expect(
      view.getByTestId("profile-edit-skeleton-certificate-image")
    ).toBeTruthy();
    expect(
      view.getByTestId("profile-edit-skeleton-certificate-fields")
    ).toBeTruthy();
    expect(
      view.getByTestId("profile-edit-skeleton-certificate-name")
    ).toBeTruthy();
    expect(
      view.getByTestId("profile-edit-skeleton-certificate-issuer")
    ).toBeTruthy();
    expect(
      view.getByTestId("profile-edit-skeleton-certificate-issued-at")
    ).toBeTruthy();
    expect(view.getByTestId("profile-edit-loading-save")).toBeTruthy();
    expect(
      view.queryByTestId("profile-edit-loading-skeleton-certificates-list")
    ).toBeNull();

    resolveData(editData);
    await waitFor(() => expect(view.getByLabelText("Title")).toBeTruthy());
  });

  it("uses the same editor skeleton while an existing certificate loads", async () => {
    mockRouteParams.section = "certificates";
    mockRouteParams.itemId = "certificate-1";
    let resolveData!: (value: typeof editData) => void;
    mockedGetStudentApi.mockResolvedValue({
      getEditData: jest.fn().mockReturnValue(
        new Promise<typeof editData>((resolve) => {
          resolveData = resolve;
        })
      ),
    } as never);

    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    expect(
      view.getByTestId("profile-edit-loading-skeleton-certificates-editor")
    ).toBeTruthy();
    expect(
      view.getByTestId("profile-edit-skeleton-certificate-fields")
    ).toBeTruthy();
    expect(view.getByTestId("profile-edit-loading-save")).toBeTruthy();

    resolveData(editData);
    await waitFor(() => expect(view.getByText("Certificates")).toBeTruthy());
  });

  it("does not create a new item when an existing route id is stale", async () => {
    mockRouteParams.section = "experience";
    mockRouteParams.itemId = "missing-experience";
    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    await waitFor(() => expect(view.getByText("Add")).toBeTruthy());
    expect(view.queryByLabelText("Title")).toBeNull();
    expect(view.getByText("Add")).toBeTruthy();
  });

  it("saves a focused basics edit without exposing protected fields", async () => {
    mockRouteParams.section = "basics";
    const updateBasics = jest.fn().mockResolvedValue(editData.profile);
    mockedGetStudentApi.mockResolvedValue({
      getEditData: jest.fn().mockResolvedValue(editData),
      updateBasics,
      uploadAvatar: jest.fn(),
    } as never);
    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    await waitFor(() =>
      expect(view.getByLabelText("Display name")).toBeTruthy()
    );
    expect(view.getByText("JPG, PNG, or WebP · max 5 MB")).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText("Display name"),
      "Ada Lovelace"
    );
    await waitFor(() =>
      expect(view.getByLabelText("Display name").props.value).toBe(
        "Ada Lovelace"
      )
    );
    await fireEvent.press(view.getByText("Save changes"));

    await waitFor(() =>
      expect(updateBasics).toHaveBeenCalledWith({
        firstName: "Ada",
        lastName: "Lovelace",
        bio: "A bio",
      })
    );
    expect(view.queryByLabelText("Telephone")).toBeNull();
    expect(view.queryByLabelText("Student ID")).toBeNull();
  });

  it("preserves the existing bio when a Student leaves it blank", async () => {
    mockRouteParams.section = "basics";
    const updateBasics = jest.fn().mockResolvedValue(editData.profile);
    mockedGetStudentApi.mockResolvedValue({
      getEditData: jest.fn().mockResolvedValue(editData),
      updateBasics,
      uploadAvatar: jest.fn(),
    } as never);
    const view = await renderWithQueryClient(<ProfileEditSectionScreen />);

    await waitFor(() => expect(view.getByLabelText("About you")).toBeTruthy());
    await fireEvent.changeText(view.getByLabelText("About you"), "");
    await fireEvent.press(view.getByText("Save changes"));

    await waitFor(() =>
      expect(updateBasics).toHaveBeenCalledWith({
        firstName: "Ada",
        lastName: "Student",
      })
    );
    expect(view.queryByLabelText("Telephone")).toBeNull();
    expect(view.queryByLabelText("Student ID")).toBeNull();
  });
});
