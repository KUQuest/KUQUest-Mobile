import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import {
  BottomNav,
  hirerNavigationItems,
  navigationItems,
  workerNavigationItems,
} from "../BottomNav";
import { authService } from "@/features/auth/AuthService";
import * as SecureStore from "expo-secure-store";
import { useRoleWorkspaceStore } from "@/features/workspace/roleWorkspaceStore";
import styles from "../bottomNavStyles";
import { navigationMessages } from "../../../locales/navigationMessages";

jest.mock("../../../features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en", setLocale: jest.fn() }),
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

describe("authenticated primary navigation", () => {
  beforeEach(() => {
    useRoleWorkspaceStore.setState({ workspace: "hirer" });
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

  it("provides the approved English and Thai labels", () => {
    expect(navigationMessages.en).toMatchObject({
      board: "Home",
      boardShort: "Home",
      boardTitle: "Quest Board",
      money: "Money",
      moneyShort: "Money",
      create: "Create Quest",
      createShort: "Create Quest",
      chat: "Chat",
      profile: "Profile",
      workManagement: "Work Management",
      workManagementShort: "Work",
    });
    expect(navigationMessages.th).toMatchObject({
      board: "หน้าหลัก",
      boardShort: "หน้าหลัก",
      boardTitle: "กระดานเควสต์",
      money: "กระเป๋าเงิน",
      moneyShort: "กระเป๋าเงิน",
      create: "สร้างเควสต์",
      createShort: "สร้างเควสต์",
      chat: "แชต",
      profile: "โปรไฟล์นักศึกษา",
      workManagement: "จัดการงาน",
      workManagementShort: "จัดการงาน",
    });
  });

  it("floats above the screen instead of occupying a visible host strip", () => {
    expect(styles.container).toEqual(expect.stringContaining("absolute"));
    expect(styles.container).toEqual(expect.stringContaining("bottom-0"));
    expect(styles.container).not.toEqual(expect.stringContaining("bg-"));
  });

  it("centers the tablet rail actions as one balanced vertical group", () => {
    expect(styles.tabletBar).toEqual(expect.stringContaining("justify-center"));
    expect(styles.tabletBar).toEqual(expect.stringContaining("gap-[8px]"));
  });

  it("exposes destinations as tabs and Create as an action", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const view = await render(
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
    expect(view.getByText(navigationMessages.en.createShort)).toBeTruthy();
  });

  it("launches Create when it is already the current route", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const navigate = jest.fn();
    const view = await render(
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
    const view = await render(
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
    const view = await render(
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
  });

  it("renders text only for primary action (Create / Work Management) and omits text for all other tabs", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const view = await render(
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

    // Primary button has text
    expect(view.getByText("Create Quest")).toBeTruthy();
    // Other tabs do NOT have visible text
    expect(view.queryByText("Home")).toBeNull();
    expect(view.queryByText("Money")).toBeNull();
    expect(view.queryByText("Chat")).toBeNull();
    expect(view.queryByText("Profile")).toBeNull();
    // But all tabs maintain accessibility labels
    expect(view.getByLabelText("Home")).toBeTruthy();
    expect(view.getByLabelText("Money")).toBeTruthy();
    expect(view.getByLabelText("Chat")).toBeTruthy();
    expect(view.getByLabelText("Profile")).toBeTruthy();
  });

  it("renders the app profile avatar instead of the Google session avatar", async () => {
    jest.spyOn(authService, "getSession").mockResolvedValueOnce({
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@ku.th",
        emailVerified: true,
        firstName: "Test",
        lastName: "User",
        image: "https://accounts.google.com/google-avatar.png",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    });
    const getProfile = jest.fn().mockResolvedValue({
      avatar: {
        fileId: "profile-avatar-1",
        url: "https://cdn.example.com/profile-avatar.png",
      },
    });
    jest
      .spyOn(authService, "getStudentApi")
      .mockResolvedValueOnce({ getProfile } as never);

    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const view = await render(
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
    expect(getProfile).toHaveBeenCalledTimes(1);
  });

  it("switches role workspace on double-tap of the profile tab", async () => {
    const routes = navigationItems.map((item) => ({
      key: `${item.routeName}-key`,
      name: item.routeName,
    }));
    const navigate = jest.fn();
    const setItemSpy = jest.spyOn(SecureStore, "setItemAsync");

    useRoleWorkspaceStore.setState({ workspace: "hirer" });
    const view = await render(
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
