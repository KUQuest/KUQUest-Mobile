import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { authService } from "../auth/AuthService";
import { clearSessionCache } from "../auth/sessionQueries";
import { AuthError } from "../auth/types";
import type { ProfileDraft } from "../profile/types";
import { invalidateOnboardingQueries } from "./api/onboardingQueries";
import {
  ProfilePersistenceCoordinator,
  ProfilePersistenceError,
  type UnavailableProfileCollections,
} from "./profilePersistenceCoordinator";

export type OnboardingPersistenceFailure = {
  error: unknown;
  draft?: ProfileDraft;
  partial: boolean;
};

export type OnboardingSaveResult =
  | {
      kind: "saved";
      draft: ProfileDraft;
    }
  | { kind: "session-expired" }
  | { kind: "failed"; failure: OnboardingPersistenceFailure };

export function useOnboardingPersistence({
  isEditMode,
  termsVersion,
}: {
  isEditMode: boolean;
  termsVersion?: string;
}) {
  const queryClient = useQueryClient();
  const coordinatorRef = useRef(new ProfilePersistenceCoordinator());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSessionExpired = useCallback(async () => {
    await authService.signOut().catch(() => undefined);
    clearSessionCache(queryClient);
  }, [queryClient]);

  const save = useCallback(
    async (
      form: ProfileDraft,
      unavailableCollections?: UnavailableProfileCollections
    ): Promise<OnboardingSaveResult> => {
      setIsSubmitting(true);
      try {
        const session = await authService.getSession();
        if (!session) throw new Error("No active session");
        const api = await authService.getStudentApi();
        const result = await coordinatorRef.current.save(
          api,
          form,
          isEditMode,
          termsVersion,
          { unavailableCollections }
        );
        invalidateOnboardingQueries(queryClient);
        return {
          kind: "saved",
          draft: result.draft,
        };
      } catch (error) {
        if (error instanceof AuthError && error.code === "SESSION_EXPIRED") {
          await handleSessionExpired();
          return { kind: "session-expired" };
        }
        const nextFailure: OnboardingPersistenceFailure =
          error instanceof ProfilePersistenceError
            ? {
                error,
                draft: error.draft,
                partial: error.partial,
              }
            : { error, partial: false };
        return { kind: "failed", failure: nextFailure };
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleSessionExpired, isEditMode, queryClient, termsVersion]
  );

  const markCertificateDeleted = useCallback((id: string) => {
    coordinatorRef.current.markCertificateDeleted(id);
  }, []);
  const markExperienceDeleted = useCallback((id: string) => {
    coordinatorRef.current.markExperienceDeleted(id);
  }, []);
  const markPortfolioDeleted = useCallback((id: string) => {
    coordinatorRef.current.markPortfolioDeleted(id);
  }, []);

  return {
    isSubmitting,
    save,
    markCertificateDeleted,
    markExperienceDeleted,
    markPortfolioDeleted,
  };
}
