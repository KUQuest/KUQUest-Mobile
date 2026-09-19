import {
  useQuery,
  type QueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { authService } from "./AuthService";
import type { AuthSession } from "./types";

export const sessionKeys = {
  all: ["auth", "session"] as const,
  detail: () => [...sessionKeys.all, "detail"] as const,
};

type SessionQueryOptions = Pick<UseQueryOptions<AuthSession | null>, "enabled">;

export function useSessionQuery(options: SessionQueryOptions = {}) {
  return useQuery({
    ...options,
    queryKey: sessionKeys.detail(),
    queryFn: () => authService.getSession(),
    retry: false,
  });
}

export function clearSessionCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: sessionKeys.all });
}
