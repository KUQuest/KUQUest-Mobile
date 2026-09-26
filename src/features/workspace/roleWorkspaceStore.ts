import { create } from "zustand";

import { secureStorage } from "@/infrastructure/storage/keyValueStorage";

export const RoleWorkspace = {
  HIRER: "hirer",
  WORKER: "worker",
} as const;

export type RoleWorkspace = (typeof RoleWorkspace)[keyof typeof RoleWorkspace];

export function isRoleWorkspace(value: unknown): value is RoleWorkspace {
  return value === RoleWorkspace.HIRER || value === RoleWorkspace.WORKER;
}

export function resolveRoleWorkspace(
  raw: unknown,
  fallback: RoleWorkspace = RoleWorkspace.HIRER
): RoleWorkspace {
  return isRoleWorkspace(raw) ? raw : fallback;
}

export const ROLE_WORKSPACE_STORAGE_KEY = "kuquest_active_workspace";
interface RoleWorkspaceStoreState {
  workspace: RoleWorkspace;
  setWorkspace: (workspace: RoleWorkspace) => Promise<void>;
  switchWorkspace: (target?: RoleWorkspace) => Promise<void>;
  hydrateWorkspace: () => Promise<void>;
}

export const useRoleWorkspaceStore = create<RoleWorkspaceStoreState>(
  (set, get) => ({
    workspace: RoleWorkspace.HIRER,
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
        target ??
        (currentWorkspace === RoleWorkspace.HIRER
          ? RoleWorkspace.WORKER
          : RoleWorkspace.HIRER);
      await get().setWorkspace(nextWorkspace);
    },
    hydrateWorkspace: async () => {
      try {
        const storedWorkspace = await secureStorage.get(
          ROLE_WORKSPACE_STORAGE_KEY
        );
        if (isRoleWorkspace(storedWorkspace)) {
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
    isHirer: workspace === RoleWorkspace.HIRER,
    isWorker: workspace === RoleWorkspace.WORKER,
    switchWorkspace,
    setWorkspace,
    resolveWorkspace: (raw?: unknown) => resolveRoleWorkspace(raw, workspace),
  };
}
