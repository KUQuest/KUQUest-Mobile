import { fireEvent } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";
import React from "react";
import {
  BottomNav,
  hirerNavigationItems,
  navigationItems,
  workerNavigationItems,
} from "../BottomNav";
import * as SecureStore from "expo-secure-store";
import { useRoleWorkspaceStore } from "@/features/workspace/roleWorkspaceStore";
import styles from "../bottomNavStyles";
import { navigationMessages } from "../../../locales/navigationMessages";

const mockUseProfileQuery = jest.fn();

jest.mock("@/features/profile/api/profileQueries", () => ({
  useProfileQuery: (...args: unknown[]) => mockUseProfileQuery(...args),
}));

jest.mock("lucide-react-native", () => ({
  BriefcaseBusiness: () => null,
  CheckSquare: () => null,
  CircleUserRound: () => null,
  LayoutDashboard: () => null,
  MessageSquare: () => null,
  Plus: () => null,
  Wallet: () => null,
  WalletCards: () => null,
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en", setLocale: jest.fn() }),
}));

describe("authenticated primary navigation", () => {
  beforeEach(() => {
    useRoleWorkspaceStore.setState({ workspace: "hirer" });
    mockUseProfileQuery.mockReset();
    mockUseProfileQuery.mockReturnValue({ data: undefined });
  });

  it("keeps the approved five-destination order", () => {
    expect(hirerNavigationItems).toBe(navigationItems);
    expect(navigationItems.map((item) => item.routeName)).toEqual([
      "index",
      "money",
      "create",
      "chat",
      "profile",
    ]);
  });

  it("marks Create as the central action", () => {
    expect(
      navigationItems.find((item) => item.routeName === "create")
    ).toMatchObject({ isCreate: true });
  });

  it("keeps the approved five-destination order for Worker workspace", () => {
    expect(workerNavigationItems.map((item) => item.routeName)).toEqual([
      "index",
      "money",
      "my-quests",
      "chat",
      "profile",
    ]);
  });

  it("marks Work Management as the central action in Worker workspace", () => {
    expect(
      workerNavigationItems.find((item) => item.routeName === "my-quests")
    ).toMatchObject({ isCreate: true });
  });

  it("provides the approved English and Thai accessibility labels", () => {
    expect(navigationMessages.en).toMatchObject({
      board: "Home",
      boardTitle: "Quest Board",
      money: "Money",
      create: "Create Quest",
      chat: "Chat",
      profile: "Profile",
      workManagement: "Work Management",
    });
    expect(navigationMessages.th).toMatchObject({
      board: "หน้าหลัก",
      boardTitle: "กระดานเควสต์",
      money: "กระเป๋าเงิน",
      create: "สร้างเควสต์",
      chat: "แชต",
      profile: "โปรไฟล์นักศึกษา",
      workManagement: "จัดการงาน",
    });
  });

  it("floats above the screen with compact horizontal margins", () => {
    expect(styles.container).toEqual(expect.stringContaining("absolute"));
    expect(styles.container).toEqual(expect.stringContaining("bottom-0"));
    expect(styles.container).toEqual(expect.stringContaining("px-[32px]"));
    expect(styles.container).not.toEqual(expect.stringContaining("bg-"));
  });
  it("centers the tablet rail actions as one balanced vertical group", () => {
    expect(styles.tabletBar).toEqual(expect.stringContaining("justify-center"));
    expect(styles.tabletBar).toEqual(expect.stringContaining("gap-[4px]"));
  });

  it("exposes icon-only destinations as accessible tabs and actions", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const view = await renderWithQueryClient(
      React.createElement(BottomNav, {
        state: { index: 0, routes } as never,
        descriptors: Object.fromEntries(
          routes.map((route) => [route.key, { options: {} }])
        ) as never,
        navigation: {
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    expect(view.getByTestId("tab-index").props.accessibilityRole).toBe("tab");
    expect(view.getByTestId("tab-index").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(view.getByTestId("tab-profile").props.accessibilityState).toEqual({
      selected: false,
    });
    expect(view.getByTestId("tab-create").props.accessibilityRole).toBe(
      "button"
    );
    expect(
      view.getByTestId("tab-create").props.accessibilityState.selected
    ).toBeUndefined();
    expect(view.getByTestId("tab-create").props.accessibilityLabel).toBe(
      "Create Quest"
    );
    expect(view.getByLabelText("Hirer workspace")).toBeTruthy();
  });

  it("launches Create when it is already the current route", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const navigate = jest.fn();
    const view = await renderWithQueryClient(
      React.createElement(BottomNav, {
        state: { index: 2, routes } as never,
        descriptors: Object.fromEntries(
          routes.map((route) => [route.key, { options: {} }])
        ) as never,
        navigation: {
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate,
        } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    await fireEvent.press(view.getByTestId("tab-create"));

    expect(navigate).toHaveBeenCalledWith("create", undefined);
  });

  it("marks the profile tab selected when the profile route is focused", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const view = await renderWithQueryClient(
      React.createElement(BottomNav, {
        state: { index: 4, routes } as never,
        descriptors: Object.fromEntries(
          routes.map((route) => [route.key, { options: {} }])
        ) as never,
        navigation: {
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    expect(view.getByTestId("tab-profile").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(view.getByLabelText("Profile selected")).toBeTruthy();
    expect(view.getByTestId("tab-index").props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it("renders Worker navigation items when in Worker workspace", async () => {
    const routes = [
      { key: "index-key", name: "index" },
      { key: "money-key", name: "money" },
      { key: "create-key", name: "create" },
      { key: "my-quests-key", name: "my-quests" },
      { key: "chat-key", name: "chat" },
      { key: "profile-key", name: "profile" },
    ];

    useRoleWorkspaceStore.setState({ workspace: "worker" });
    const view = await renderWithQueryClient(
      React.createElement(BottomNav, {
        state: { index: 0, routes } as never,
        descriptors: Object.fromEntries(
          routes.map((route) => [route.key, { options: {} }])
        ) as never,
        navigation: {
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    expect(view.getByTestId("tab-my-quests")).toBeTruthy();
    expect(view.queryByTestId("tab-create")).toBeNull();
    expect(view.getByTestId("tab-index")).toBeTruthy();
    expect(view.getByTestId("tab-money")).toBeTruthy();
    expect(view.getByTestId("tab-chat")).toBeTruthy();
    expect(view.getByTestId("tab-profile")).toBeTruthy();
    expect(view.getByLabelText("Worker workspace")).toBeTruthy();
  });

  it("removes visible navigation text while preserving labels for assistive technology", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const view = await renderWithQueryClient(
      React.createElement(BottomNav, {
        state: { index: 0, routes } as never,
        descriptors: Object.fromEntries(
          routes.map((route) => [route.key, { options: {} }])
        ) as never,
        navigation: {
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    expect(view.queryByText("Create Quest")).toBeNull();
    expect(view.queryByText("Home")).toBeNull();
    expect(view.queryByText("Money")).toBeNull();
    expect(view.queryByText("Chat")).toBeNull();
    expect(view.queryByText("Profile")).toBeNull();
    expect(view.getByTestId("tab-index").props.accessibilityLabel).toBe("Home");
    expect(view.getByTestId("tab-money").props.accessibilityLabel).toBe(
      "Money"
    );
    expect(view.getByTestId("tab-chat").props.accessibilityLabel).toBe("Chat");
    expect(view.getByTestId("tab-profile").props.accessibilityLabel).toBe(
      "Profile"
    );
  });

  it("renders the app profile avatar instead of the Google session avatar", async () => {
    mockUseProfileQuery.mockReturnValue({
      data: {
        profileImage: {
          uri: "https://cdn.example.com/profile-avatar.png",
          cacheKey: "profile-avatar-1",
        },
      },
    });

    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const view = await renderWithQueryClient(
      React.createElement(BottomNav, {
        state: { index: 0, routes } as never,
        descriptors: Object.fromEntries(
          routes.map((route) => [route.key, { options: {} }])
        ) as never,
        navigation: {
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    const avatar = await view.findByTestId("tab-profile-avatar");
    expect(avatar.props.source).toEqual([
      { uri: "https://cdn.example.com/profile-avatar.png" },
    ]);
    expect(mockUseProfileQuery).toHaveBeenCalledWith("en");
  });

  it("renders no avatar when the profile has none, rather than the Google session image", async () => {
    mockUseProfileQuery.mockReturnValue({
      data: {
        profileImage: "https://accounts.google.com/google-avatar.png",
      },
    });

    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const view = await renderWithQueryClient(
      React.createElement(BottomNav, {
        state: { index: 0, routes } as never,
        descriptors: Object.fromEntries(
          routes.map((route) => [route.key, { options: {} }])
        ) as never,
        navigation: {
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    expect(view.queryByTestId("tab-profile-avatar")).toBeNull();
  });

  it("switches role workspace on double-tap of the profile tab", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const navigate = jest.fn();
    const setItemSpy = jest.spyOn(SecureStore, "setItemAsync");

    useRoleWorkspaceStore.setState({ workspace: "hirer" });
    const view = await renderWithQueryClient(
      React.createElement(BottomNav, {
        state: { index: 0, routes } as never,
        descriptors: Object.fromEntries(
          routes.map((route) => [route.key, { options: {} }])
        ) as never,
        navigation: {
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate,
        } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    const profileTab = view.getByTestId("tab-profile");

    // First tap -> navigates to profile
    await fireEvent.press(profileTab);
    expect(navigate).toHaveBeenCalledWith("profile", undefined);

    // Second tap immediately -> switches workspace
    await fireEvent.press(profileTab);
    expect(setItemSpy).toHaveBeenCalledWith(
      "kuquest_active_workspace",
      "worker"
    );
  });
});
