import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react-native";
import React from "react";

import { AppThemeProvider } from "@/features/workspace/AppThemeProvider";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
}

/**
 * Renders a component tree inside the app theme provider and a fresh
 * QueryClient (shared reads such as avatars use queries); `rerender` keeps it.
 */
export function renderWithAppTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): Promise<RenderResult> {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AppThemeProvider>
  );
  return render(ui, { ...options, wrapper: Wrapper });
}

/**
 * Renders a component tree inside a fresh QueryClient with retries disabled,
 * so a query failure surfaces immediately instead of after backoff.
 */
export function renderWithQueryClient(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): Promise<RenderResult> {
  const queryClient = createTestQueryClient();

  return render(
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </AppThemeProvider>,
    options
  );
}
