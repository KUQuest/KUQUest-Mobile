import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

import {
  RoleWorkspaceProvider,
  useRoleWorkspace,
  ROLE_WORKSPACE_STORAGE_KEY,
} from "../RoleWorkspaceContext";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

describe("RoleWorkspaceContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it("defaults to hirer workspace initially", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RoleWorkspaceProvider>{children}</RoleWorkspaceProvider>
    );

    const { result } = await renderHook(() => useRoleWorkspace(), { wrapper });

    expect(result.current.workspace).toBe("hirer");
    expect(result.current.isHirer).toBe(true);
    expect(result.current.isWorker).toBe(false);
  });

  it("loads stored workspace from SecureStore", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("worker");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RoleWorkspaceProvider>{children}</RoleWorkspaceProvider>
    );

    const { result } = await renderHook(() => useRoleWorkspace(), { wrapper });

    await act(async () => {
      // allow effect to settle
    });

    expect(result.current.workspace).toBe("worker");
    expect(result.current.isWorker).toBe(true);
    expect(result.current.isHirer).toBe(false);
  });

  it("switches workspace and saves to SecureStore", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RoleWorkspaceProvider>{children}</RoleWorkspaceProvider>
    );

    const { result } = await renderHook(() => useRoleWorkspace(), { wrapper });

    await act(async () => {
      await result.current.switchWorkspace("worker");
    });

    expect(result.current.workspace).toBe("worker");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      ROLE_WORKSPACE_STORAGE_KEY,
      "worker"
    );
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("toggles between hirer and worker when called without arguments", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RoleWorkspaceProvider>{children}</RoleWorkspaceProvider>
    );

    const { result } = await renderHook(() => useRoleWorkspace(), { wrapper });

    await act(async () => {
      await result.current.switchWorkspace();
    });

    expect(result.current.workspace).toBe("worker");

    await act(async () => {
      await result.current.switchWorkspace();
    });

    expect(result.current.workspace).toBe("hirer");
  });
});
