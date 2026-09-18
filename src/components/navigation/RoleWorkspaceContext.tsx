import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

export type RoleWorkspace = "hirer" | "worker";

export const ROLE_WORKSPACE_STORAGE_KEY = "kuquest_active_workspace";

export interface RoleWorkspaceContextValue {
  workspace: RoleWorkspace;
  isHirer: boolean;
  isWorker: boolean;
  switchWorkspace: (target?: RoleWorkspace) => Promise<void>;
  setWorkspace: (workspace: RoleWorkspace) => Promise<void>;
}

const defaultRoleWorkspaceContext: RoleWorkspaceContextValue = {
  workspace: "hirer",
  isHirer: true,
  isWorker: false,
  switchWorkspace: async () => undefined,
  setWorkspace: async () => undefined,
};

export const RoleWorkspaceContext = createContext<RoleWorkspaceContextValue>(
  defaultRoleWorkspaceContext
);

export function RoleWorkspaceProvider({
  children,
  initialWorkspace = "hirer",
}: {
  children?: React.ReactNode;
  initialWorkspace?: RoleWorkspace;
}) {
  const [workspace, setWorkspaceState] =
    useState<RoleWorkspace>(initialWorkspace);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(
          ROLE_WORKSPACE_STORAGE_KEY
        );
        if (mounted && (stored === "hirer" || stored === "worker")) {
          setWorkspaceState(stored);
        }
      } catch {
        // Fall back to initialWorkspace if SecureStore is unavailable
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setWorkspace = useCallback(async (nextWorkspace: RoleWorkspace) => {
    setWorkspaceState(nextWorkspace);
    try {
      await SecureStore.setItemAsync(ROLE_WORKSPACE_STORAGE_KEY, nextWorkspace);
    } catch {
      // SecureStore error fallback
    }
  }, []);

  const switchWorkspace = useCallback(
    async (target?: RoleWorkspace) => {
      const next = target ?? (workspace === "hirer" ? "worker" : "hirer");
      await setWorkspace(next);
      try {
        router.replace("/(tabs)");
      } catch {
        // Router might not be mounted in test environments
      }
    },
    [setWorkspace, workspace]
  );

  const value = useMemo<RoleWorkspaceContextValue>(
    () => ({
      workspace,
      isHirer: workspace === "hirer",
      isWorker: workspace === "worker",
      switchWorkspace,
      setWorkspace,
    }),
    [workspace, switchWorkspace, setWorkspace]
  );

  return (
    <RoleWorkspaceContext.Provider value={value}>
      {children}
    </RoleWorkspaceContext.Provider>
  );
}

export function useRoleWorkspace(): RoleWorkspaceContextValue {
  return useContext(RoleWorkspaceContext);
}
