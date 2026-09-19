import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/ApiClient";

const QUERY_STALE_TIME_MS = 30_000;
const QUERY_RETRY_LIMIT = 2;

export function shouldRetryRequest(
  failureCount: number,
  error: Error
): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }

  return failureCount < QUERY_RETRY_LIMIT;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS, // Preserves the 30-second freshness window screens relied on.
        refetchOnWindowFocus: true, // Refresh focused screens after that window expires.
        retry: shouldRetryRequest,
      },
    },
  });
}
