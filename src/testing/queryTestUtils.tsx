import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react-native";
import React from "react";

import { AppThemeProvider } from "@/features/workspace/AppThemeProvider";

/**
 * Renders a component tree inside the app theme provider; `rerender` keeps it.
 */
export function renderWithAppTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): Promise<RenderResult> {
  return render(ui, { ...options, wrapper: AppThemeProvider });
}

/**
 * Renders a component tree inside a fresh QueryClient with retries disabled,
 * so a query failure surfaces immediately instead of after backoff.
 */
export function renderWithQueryClient(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): Promise<RenderResult> {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return render(
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </AppThemeProvider>,
    options
  );
}
