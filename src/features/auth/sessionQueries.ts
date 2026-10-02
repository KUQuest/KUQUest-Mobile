import {
  useQuery,
  type QueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { authService } from "./AuthService";
import type { AuthSession, RoutingDestination } from "./types";

export const sessionKeys = {
  all: ["auth", "session"] as const,
  detail: () => [...sessionKeys.all, "detail"] as const,
};

export const registrationDestinationKeys = {
  all: ["auth", "registration-destination"] as const,
  detail: () => [...registrationDestinationKeys.all, "detail"] as const,
};

type RegistrationDestinationQueryOptions = Pick<
  UseQueryOptions<RoutingDestination>,
  "enabled"
>;

export function useRegistrationDestinationQuery(
  options: RegistrationDestinationQueryOptions = {}
) {
  return useQuery({
    ...options,
    queryKey: registrationDestinationKeys.detail(),
    queryFn: () => authService.getRoutingDestination(),
    retry: false,
  });
}

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
  queryClient.clear();
}
