import { act, renderHook } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

import {
  ROLE_WORKSPACE_STORAGE_KEY,
  useRoleWorkspace,
  useRoleWorkspaceStore,
} from "@/features/workspace/roleWorkspaceStore";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe("roleWorkspaceStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRoleWorkspaceStore.setState({ workspace: "hirer" });
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it("defaults to hirer workspace initially", async () => {
    const { result } = await renderHook(() => useRoleWorkspace());
    expect(result.current.workspace).toBe("hirer");
    expect(result.current.isHirer).toBe(true);
    expect(result.current.isWorker).toBe(false);
  });

  it("loads stored workspace from SecureStore", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("worker");
    const { result } = await renderHook(() => useRoleWorkspace());
    await act(async () => {
      await useRoleWorkspaceStore.getState().hydrateWorkspace();
    });
    expect(result.current.workspace).toBe("worker");
    expect(result.current.isWorker).toBe(true);
    expect(result.current.isHirer).toBe(false);
  });

  it("switches workspace and saves to SecureStore", async () => {
    const { result } = await renderHook(() => useRoleWorkspace());
    await act(async () => {
      await result.current.switchWorkspace("worker");
    });
    expect(result.current.workspace).toBe("worker");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      ROLE_WORKSPACE_STORAGE_KEY,
      "worker"
    );
  });

  it("toggles between hirer and worker when called without arguments", async () => {
    const { result } = await renderHook(() => useRoleWorkspace());
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
