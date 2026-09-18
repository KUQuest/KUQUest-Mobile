import { router } from "expo-router";
import { create } from "zustand";

import { secureStorage } from "@/infrastructure/storage/keyValueStorage";

export type RoleWorkspace = "hirer" | "worker";
export const ROLE_WORKSPACE_STORAGE_KEY = "kuquest_active_workspace";

interface RoleWorkspaceStoreState {
  workspace: RoleWorkspace;
  setWorkspace: (workspace: RoleWorkspace) => Promise<void>;
  switchWorkspace: (target?: RoleWorkspace) => Promise<void>;
  hydrateWorkspace: () => Promise<void>;
}

export const useRoleWorkspaceStore = create<RoleWorkspaceStoreState>(
  (set, get) => ({
    workspace: "hirer",
    setWorkspace: async (workspace) => {
      set({ workspace });
      try {
        await secureStorage.set(ROLE_WORKSPACE_STORAGE_KEY, workspace);
      } catch {
        // Workspace state is already updated when persistence fails.
      }
    },
    switchWorkspace: async (target) => {
      const currentWorkspace = get().workspace;
      const nextWorkspace =
        target ?? (currentWorkspace === "hirer" ? "worker" : "hirer");
      await get().setWorkspace(nextWorkspace);
      try {
        router.replace("/(tabs)");
      } catch {
        // Router might not be mounted in test environments.
      }
    },
    hydrateWorkspace: async () => {
      try {
        const storedWorkspace = await secureStorage.get(
          ROLE_WORKSPACE_STORAGE_KEY
        );
        if (storedWorkspace === "hirer" || storedWorkspace === "worker") {
          set({ workspace: storedWorkspace });
        }
      } catch {
        // Keep the default workspace when persistence is unavailable.
      }
    },
  })
);

export function useRoleWorkspace() {
  const workspace = useRoleWorkspaceStore((state) => state.workspace);
  const setWorkspace = useRoleWorkspaceStore((state) => state.setWorkspace);
  const switchWorkspace = useRoleWorkspaceStore(
    (state) => state.switchWorkspace
  );
  return {
    workspace,
    isHirer: workspace === "hirer",
    isWorker: workspace === "worker",
    switchWorkspace,
    setWorkspace,
  };
}
