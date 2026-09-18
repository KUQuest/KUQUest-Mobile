import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import type { SupportedLocale } from "@/locales/locale";
import type {
  CertificateCreate,
  ExperienceCreate,
  PortfolioCreate,
  ProfileBasicsUpdate,
  UploadAsset,
} from "@/api/StudentApi";
import { authService } from "@/features/auth/AuthService";
import { profileModule } from "../profileModule";

export const profileKeys = {
  all: ["profile"] as const,
  detail: (locale?: SupportedLocale) =>
    locale
      ? ([...profileKeys.all, "detail", locale] as const)
      : ([...profileKeys.all, "detail"] as const),
  public: (userId: string) => [...profileKeys.all, "public", userId] as const,
  publicReviews: (userId: string) =>
    [...profileKeys.all, "public-reviews", userId] as const,
  editData: () => [...profileKeys.all, "edit-data"] as const,
};

export function useProfileQuery(locale: "en" | "th") {
  return useQuery({
    queryKey: profileKeys.detail(locale),
    queryFn: ({ signal }) => profileModule.loadProfile({ locale, signal }),
  });
}

export function usePublicProfileQuery(userId: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: profileKeys.public(userId),
    queryFn: async ({ signal }) => {
      const api = await authService.getStudentApi();
      return api.getPublicProfile(userId, { signal });
    },
  });
}

export function usePublicProfileReviewsQuery(userId: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: profileKeys.publicReviews(userId),
    queryFn: async ({ signal }) => {
      const api = await authService.getStudentApi();
      return api.listPublicReviews(userId, undefined, { signal });
    },
  });
}

export function useProfileEditDataQuery() {
  return useQuery({
    queryKey: profileKeys.editData(),
    queryFn: ({ signal }) => profileModule.getEditData({ signal }),
  });
}
function invalidateProfileReads(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
  void queryClient.invalidateQueries({ queryKey: profileKeys.editData() });
}

export function useUpdateBasicsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: ProfileBasicsUpdate) =>
      profileModule.updateBasics(update),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (asset: UploadAsset) => profileModule.uploadAvatar(asset),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useCreateExperienceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: ExperienceCreate) =>
      profileModule.createExperience(entry),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useUpdateExperienceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      update,
    }: {
      id: string;
      update: Partial<ExperienceCreate>;
    }) => profileModule.updateExperience(id, update),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useDeleteExperienceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileModule.deleteExperience(id),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useCreatePortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: PortfolioCreate) =>
      profileModule.createPortfolio(entry),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useUpdatePortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      update,
    }: {
      id: string;
      update: { title?: string; description?: string | null };
    }) => profileModule.updatePortfolio(id, update),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useUploadPortfolioImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, asset }: { id: string; asset: UploadAsset }) =>
      profileModule.uploadPortfolioImage(id, asset),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useDeletePortfolioImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileModule.deletePortfolioImage(id),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useDeletePortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileModule.deletePortfolio(id),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useCreateCertificateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: CertificateCreate) =>
      profileModule.createCertificate(entry),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useUpdateCertificateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: CertificateCreate }) =>
      profileModule.updateCertificate(id, update),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useUploadCertificateImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, asset }: { id: string; asset: UploadAsset }) =>
      profileModule.uploadCertificateImage(id, asset),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useDeleteCertificateImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileModule.deleteCertificateImage(id),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}

export function useDeleteCertificateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileModule.deleteCertificate(id),
    onSuccess: () => invalidateProfileReads(queryClient),
  });
}
