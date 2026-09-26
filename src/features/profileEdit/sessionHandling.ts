import React from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/ApiClient";
import { authService } from "@/features/auth/AuthService";
import { clearSessionCache } from "@/features/auth/sessionQueries";
import { AuthError } from "@/features/auth/types";

export function isProfileEditSessionExpired(error: unknown): boolean {
  return (
    error instanceof AuthError ||
    (error instanceof ApiError && error.status === 401)
  );
}

export function useProfileEditSessionExpiryRedirect(): (
  error: unknown
) => Promise<boolean> {
  const router = useRouter();
  const queryClient = useQueryClient();
  return React.useCallback(
    async (error: unknown) => {
      if (!isProfileEditSessionExpired(error)) return false;
      await authService.signOut().catch(() => undefined);
      clearSessionCache(queryClient);
      router.replace("/");
      return true;
    },
    [queryClient, router]
  );
}
