import {
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { useEffect, type ReactNode } from "react";
import { AppState } from "react-native";

import { createQueryClient } from "./queryClient";

/** One client for the app lifetime; the app mounts a single QueryProvider. */
const queryClient = createQueryClient();

export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      onlineManager.setOnline(
        state.isInternetReachable ?? state.isConnected ?? false
      );
    });

    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
