import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/api/ApiClient";
import type { AcademicRegistrationOptions } from "@/api/contracts";
import { authService } from "@/features/auth/AuthService";
import { AuthError } from "@/features/auth/types";
import { profileModule } from "@/features/profile/profileModule";
import type { ProfileDraft } from "@/features/profile/types";
import type { SupportedLocale } from "@/locales/locale";
import type { UnavailableProfileCollections } from "../profilePersistenceCoordinator";

export const onboardingKeys = {
  all: ["onboarding"] as const,
  profile: (locale: SupportedLocale) =>
    [...onboardingKeys.all, "profile", locale] as const,
};

type OptionalCollectionResult<T> = {
  data: T[];
  unavailable: boolean;
};

export interface OnboardingQueryData {
  form: ProfileDraft;
  options: AcademicRegistrationOptions;
  unavailableCollections: UnavailableProfileCollections;
}

async function readOptionalCollection<T>(
  request: () => Promise<T[]>
): Promise<OptionalCollectionResult<T>> {
  try {
    return { data: await request(), unavailable: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { data: [], unavailable: true };
    }
    throw error;
  }
}

export function useOnboardingQuery(locale: SupportedLocale) {
  return useQuery({
    queryKey: onboardingKeys.profile(locale),
    queryFn: ({ signal }) => loadOnboardingData(signal),
  });
}

async function loadOnboardingData(
  signal: AbortSignal
): Promise<OnboardingQueryData> {
  const session = await authService.getSession();
  if (!session) throw new Error("No active session");
  const api = await authService.getStudentApi();
  const certificatesPromise = readOptionalCollection(() =>
    api.listCertificates({ signal })
  );
  const portfolioPromise = readOptionalCollection(() =>
    api.listPortfolio({ signal })
  );
  const experiencesPromise =
    typeof api.listExperience === "function"
      ? readOptionalCollection(() => api.listExperience({ signal }))
      : Promise.resolve({ data: [], unavailable: true });
  const [
    academicOptions,
    status,
    profile,
    certificatesResult,
    portfolioResult,
    experiencesResult,
  ] = await Promise.all([
    api.getAcademicRegistrationOptions({ signal }),
    api.getAcademicRegistrationStatus({ signal }),
    api.getProfile({ signal }),
    certificatesPromise,
    portfolioPromise,
    experiencesPromise,
  ]);

  return {
    form: profileModule.mapProfileRecordsToDraft({
      profile,
      status,
      options: academicOptions,
      certificates: certificatesResult.data,
      portfolio: portfolioResult.data,
      experiences: experiencesResult.data,
      fallbackName: session.user.name,
      fallbackImage: session.user.image ?? "",
    }),
    options: academicOptions,
    unavailableCollections: {
      ...(certificatesResult.unavailable ? { certificates: true } : {}),
      ...(portfolioResult.unavailable ? { portfolio: true } : {}),
      ...(experiencesResult.unavailable ? { experience: true } : {}),
    },
  };
}

export function isOnboardingSessionExpired(error: unknown): error is AuthError {
  return error instanceof AuthError && error.code === "SESSION_EXPIRED";
}
