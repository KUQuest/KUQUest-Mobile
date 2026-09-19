import React, { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { ChevronRight, Pencil, Plus } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/ApiClient";
import { authService } from "../auth/AuthService";
import { clearSessionCache } from "../auth/sessionQueries";
import type { ProfileEditData } from "../../api/StudentApi";
import {
  useCreateCertificateMutation,
  useCreateExperienceMutation,
  useCreatePortfolioMutation,
  useDeleteCertificateImageMutation,
  useDeleteCertificateMutation,
  useDeleteExperienceMutation,
  useDeletePortfolioImageMutation,
  useDeletePortfolioMutation,
  useProfileEditDataQuery,
  useUpdateBasicsMutation,
  useUpdateCertificateMutation,
  useUpdateExperienceMutation,
  useUpdatePortfolioMutation,
  useUploadAvatarMutation,
  useUploadCertificateImageMutation,
  useUploadPortfolioImageMutation,
} from "../profile/api/profileQueries";
import { AuthError } from "../auth/types";
import { isPrototypeDemoEnabled } from "../auth/authEnvironment";
import { onboardingMessages } from "../../locales/registrationOnboarding";
import {
  profileEditMessages,
  type ProfileEditMessages,
} from "../../locales/profileEditMessages";
import { useLocale } from "@/features/preferences/localeStore";
import { Button } from "../../components/ui/Button";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "../../components/ui/LoadingSkeleton";
import { Image, Pressable, ScrollView, Text, View } from "../../tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { ScreenLayout } from "../../components/layout/ScreenLayout";
import styles from "./profileEditStyles";
import {
  validateBasics,
  validateCertificate,
  validateExperience,
  validatePortfolio,
} from "./validation";
import {
  splitDisplayName,
  toBasicsForm,
  toCertificateForm,
  toExperienceForm,
  toPortfolioForm,
  type BasicsForm,
  type CertificateForm,
  type ExperienceForm,
  type PortfolioForm,
} from "./types";
import type {
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
} from "../../api/contracts";
import { BasicsEditor } from "./components/BasicsEditor";
import { CertificateEditor } from "./components/CertificateEditor";
import { ExperienceEditor } from "./components/ExperienceEditor";
import { PortfolioEditor } from "./components/PortfolioEditor";
import { ScreenHeader } from "./components/ProfileEditFormParts";
type EditSection = "basics" | "experience" | "portfolio" | "certificates";
type HubSectionKey = EditSection | "academic-registration";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isLocalAsset(uri: string): boolean {
  return Boolean(uri) && !/^https?:\/\//i.test(uri);
}

function getErrorText(error: unknown, messages: ProfileEditMessages): string {
  if (
    error instanceof AuthError ||
    (error instanceof ApiError && error.status === 401)
  )
    return messages.sessionExpired;
  if (error instanceof ApiError && error.status === 409)
    return messages.conflict;
  return messages.saveError;
}

function isSessionExpired(error: unknown): boolean {
  return (
    error instanceof AuthError ||
    (error instanceof ApiError && error.status === 401)
  );
}

function useSessionExpiryRedirect(): (error: unknown) => Promise<boolean> {
  const router = useRouter();
  const queryClient = useQueryClient();
  return React.useCallback(
    async (error: unknown) => {
      if (!isSessionExpired(error)) return false;
      await authService.signOut().catch(() => undefined);
      clearSessionCache(queryClient);
      router.replace("/");
      return true;
    },
    [queryClient, router]
  );
}

function UnavailableState({ message }: { message: string }) {
  return (
    <View className={styles.statusCard} accessibilityRole="alert">
      <Text className={styles.statusText}>{message}</Text>
    </View>
  );
}

function ErrorState({
  message,
  retry,
  retryLabel,
}: {
  message: string;
  retry: () => void;
  retryLabel: string;
}) {
  return (
    <View className={styles.statusCard} accessibilityRole="alert">
      <Text className={styles.statusText}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        className={styles.retryButton}
        onPress={retry}
      >
        <Text className={styles.retryButtonText}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

type ProfileEditLoadingVariant =
  | "hub"
  | "basics-editor"
  | "experience-list"
  | "experience-editor"
  | "portfolio-list"
  | "portfolio-editor"
  | "certificates-list"
  | "certificates-editor";

function SkeletonFormField({
  width = "46%",
  height = 48,
  testID,
}: {
  width?: `${number}%`;
  height?: number;
  testID?: string;
}) {
  return (
    <View style={{ gap: 4 }} testID={testID}>
      <SkeletonBlock height={14} width={width} borderRadius={4} />
      <SkeletonBlock height={height} borderRadius={10} />
    </View>
  );
}

function ProfileEditLoadingState({
  variant,
  messages,
  onBack,
}: {
  variant: ProfileEditLoadingVariant;
  messages: ProfileEditMessages;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isEditor = variant.endsWith("-editor");
  const title =
    variant === "hub"
      ? messages.title
      : variant === "basics-editor"
        ? messages.basicsSection
        : variant.startsWith("experience")
          ? messages.experienceSection
          : variant.startsWith("portfolio")
            ? messages.portfolioSection
            : messages.certificatesSection;
  const listSection = variant !== "hub" && !isEditor;

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <ScreenHeader title={title} backLabel={messages.back} onBack={onBack} />
      </View>
      <LoadingSkeleton
        loadingLabel={messages.loading}
        style={{ flex: 1 }}
        contentStyle={{ flex: 1 }}
        testID={`profile-edit-loading-skeleton-${variant}`}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerClassName={
              listSection || variant === "hub"
                ? styles.scrollContent
                : styles.formContent
            }
            contentContainerStyle={{ paddingTop: 0 }}
            showsVerticalScrollIndicator={false}
          >
            {variant === "hub" ? (
              <>
                <SkeletonBlock height={18} width="88%" borderRadius={4} />
                <View style={{ gap: 8, marginTop: 8 }}>
                  {[1, 2, 3, 4].map((item) => (
                    <View
                      key={item}
                      className={styles.sectionRow}
                      style={{ gap: 12 }}
                    >
                      <View style={{ flex: 1, gap: 6 }}>
                        <SkeletonBlock
                          height={20}
                          width="48%"
                          borderRadius={4}
                        />
                        <SkeletonBlock
                          height={14}
                          width={item === 1 ? "84%" : "42%"}
                          borderRadius={4}
                        />
                      </View>
                      <SkeletonBlock height={22} width={22} borderRadius={11} />
                    </View>
                  ))}
                </View>
              </>
            ) : listSection ? (
              <View style={{ gap: 8 }}>
                {[1, 2, 3].map((item) => (
                  <View
                    key={item}
                    className={styles.itemRow}
                    style={{ gap: 12 }}
                  >
                    {variant === "portfolio-list" ||
                    variant === "certificates-list" ? (
                      <SkeletonBlock
                        variant="image"
                        height={64}
                        width={64}
                        borderRadius={10}
                      />
                    ) : null}
                    <View style={{ flex: 1, gap: 6 }}>
                      <SkeletonBlock height={20} width="64%" borderRadius={4} />
                      <SkeletonBlock height={15} width="48%" borderRadius={4} />
                      <SkeletonBlock height={14} width="78%" borderRadius={4} />
                    </View>
                    <SkeletonBlock height={18} width={18} borderRadius={9} />
                  </View>
                ))}
              </View>
            ) : (
              <View className={styles.formGroup} style={{ gap: 12 }}>
                <SkeletonBlock height={22} width="46%" borderRadius={5} />
                {variant === "basics-editor" ? (
                  <>
                    <SkeletonBlock
                      variant="image"
                      height={96}
                      width={96}
                      borderRadius={48}
                      testID="profile-edit-skeleton-avatar"
                    />
                    <SkeletonBlock height={48} width={132} borderRadius={24} />
                    <SkeletonFormField width="38%" />
                    <SkeletonFormField width="44%" height={132} />
                  </>
                ) : variant === "experience-editor" ? (
                  <>
                    <SkeletonBlock height={18} width="82%" borderRadius={4} />
                    <SkeletonFormField width="58%" />
                    <SkeletonFormField width="54%" />
                    <SkeletonFormField width="44%" height={120} />
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <SkeletonFormField width="64%" />
                      <SkeletonFormField width="64%" />
                    </View>
                  </>
                ) : variant === "certificates-editor" ? (
                  <>
                    <SkeletonBlock
                      variant="image"
                      height={128}
                      borderRadius={12}
                      testID="profile-edit-skeleton-certificate-image"
                    />
                    <View
                      style={{ gap: 12 }}
                      testID="profile-edit-skeleton-certificate-fields"
                    >
                      <SkeletonFormField
                        width="72%"
                        testID="profile-edit-skeleton-certificate-name"
                      />
                      <SkeletonFormField
                        width="58%"
                        testID="profile-edit-skeleton-certificate-issuer"
                      />
                      <SkeletonFormField
                        width="42%"
                        testID="profile-edit-skeleton-certificate-issued-at"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <SkeletonFormField width="32%" height={120} />
                    <SkeletonFormField width="52%" />
                    <SkeletonFormField width="44%" height={132} />
                  </>
                )}
              </View>
            )}
          </ScrollView>
          {isEditor ? (
            <View
              className={styles.saveBar}
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <View className={styles.saveBarInner}>
                <SkeletonBlock
                  height={48}
                  borderRadius={24}
                  testID="profile-edit-loading-save"
                />
              </View>
            </View>
          ) : null}
        </View>
      </LoadingSkeleton>
    </ScreenLayout>
  );
}

function useLeaveConfirmation(
  messages: ProfileEditMessages,
  dirty: boolean,
  onLeave: () => void
) {
  return () => {
    if (!dirty) {
      onLeave();
      return;
    }
    Alert.alert(messages.unsavedTitle, messages.unsavedMessage, [
      { text: messages.stay, style: "cancel" },
      { text: messages.leave, style: "destructive", onPress: onLeave },
    ]);
  };
}

function useUnsavedNavigationGuard(
  messages: ProfileEditMessages,
  dirty: boolean
): () => void {
  const navigation = useNavigation();
  const dirtyRef = React.useRef(dirty);
  const allowNavigationRef = React.useRef(false);

  React.useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  React.useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (!dirtyRef.current || allowNavigationRef.current) {
          allowNavigationRef.current = false;
          return;
        }
        event.preventDefault();
        Alert.alert(messages.unsavedTitle, messages.unsavedMessage, [
          { text: messages.stay, style: "cancel" },
          {
            text: messages.leave,
            style: "destructive",
            onPress: () => {
              allowNavigationRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ]);
      }),
    [messages, navigation]
  );

  return () => {
    allowNavigationRef.current = true;
    dirtyRef.current = false;
  };
}

function BasicsEditorScreen({
  data,
  onBack,
}: {
  data: ProfileEditData;
  onBack: () => void;
}) {
  const router = useRouter();
  const redirectIfSessionExpired = useSessionExpiryRedirect();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [form, setForm] = useState<BasicsForm>(() =>
    toBasicsForm(data.profile)
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const updateBasicsMutation = useUpdateBasicsMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const saving =
    updateBasicsMutation.isPending || uploadAvatarMutation.isPending;
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const leave = useLeaveConfirmation(messages, dirty, onBack);
  const allowNavigation = useUnsavedNavigationGuard(messages, dirty);
  const setField = <K extends keyof BasicsForm>(
    field: K,
    value: BasicsForm[K]
  ) => {
    setDirty(true);
    setForm((current) => ({ ...current, [field]: value }));
  };
  const save = async () => {
    const nextErrors = validateBasics(
      form.name,
      messages.required,
      messages.invalidName
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaveError(null);
    try {
      const { firstName, lastName } = splitDisplayName(form.name);
      await updateBasicsMutation.mutateAsync({
        firstName,
        lastName,
        bio: form.bio.trim() || undefined,
      });
      if (isLocalAsset(form.profileImage)) {
        try {
          await uploadAvatarMutation.mutateAsync({
            uri: form.profileImage,
            name: form.profileImageFileName ?? undefined,
            type: form.profileImageMimeType ?? undefined,
          });
        } catch (error) {
          if (await redirectIfSessionExpired(error)) return;
          setSaveError(messages.avatarUploadError);
          return;
        }
      }
      allowNavigation();
      router.back();
    } catch (error) {
      if (await redirectIfSessionExpired(error)) return;
      setSaveError(getErrorText(error, messages));
    }
  };
  const profileName = form.name || data.profile.firstName;
  const profileImageSource = form.profileImage
    ? form.profileImageCacheKey
      ? { uri: form.profileImage, cacheKey: form.profileImageCacheKey }
      : { uri: form.profileImage }
    : undefined;
  return (
    <BasicsEditor
      form={form}
      messages={messages}
      errors={errors}
      saveError={saveError}
      saving={saving}
      profileName={profileName}
      profileImageSource={profileImageSource}
      avatarImageFailed={avatarImageFailed}
      onBack={leave}
      onFieldChange={setField}
      onAvatarImageError={() => setAvatarImageFailed(true)}
      onAvatarChange={(asset) => {
        setAvatarImageFailed(false);
        setDirty(true);
        setForm((current) => ({
          ...current,
          profileImage: asset.uri,
          profileImageCacheKey: undefined,
          profileImageMimeType: asset.mimeType,
          profileImageFileName: asset.fileName,
        }));
      }}
      onAvatarError={setSaveError}
      onSave={() => void save()}
    />
  );
}

function ExperienceEditorScreen({
  entry,
  onBack,
}: {
  entry?: ExperienceEntry;
  onBack: () => void;
}) {
  const router = useRouter();
  const redirectIfSessionExpired = useSessionExpiryRedirect();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const employmentTypes = onboardingMessages[locale].employmentTypes;
  const [form, setForm] = useState<ExperienceForm>(() =>
    toExperienceForm(entry)
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const createExperienceMutation = useCreateExperienceMutation();
  const updateExperienceMutation = useUpdateExperienceMutation();
  const deleteExperienceMutation = useDeleteExperienceMutation();
  const saving =
    createExperienceMutation.isPending || updateExperienceMutation.isPending;
  const deleting = deleteExperienceMutation.isPending;
  const leave = useLeaveConfirmation(messages, dirty, onBack);
  const allowNavigation = useUnsavedNavigationGuard(messages, dirty);
  const setField = <K extends keyof ExperienceForm>(
    field: K,
    value: ExperienceForm[K]
  ) => {
    setDirty(true);
    setForm((current) => ({ ...current, [field]: value }));
  };
  const save = async () => {
    const nextErrors = validateExperience(form, messages);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaveError(null);
    try {
      const payload = {
        title: form.title.trim(),
        employmentType: form.employmentType,
        organization: form.organization.trim() || null,
        description: form.description.trim() || null,
        startedAt: form.startedAt,
        endedAt: form.endedAt || null,
      };
      if (entry?.id)
        await updateExperienceMutation.mutateAsync({
          id: entry.id,
          update: payload,
        });
      else await createExperienceMutation.mutateAsync(payload);
      allowNavigation();
      router.back();
    } catch (error) {
      if (await redirectIfSessionExpired(error)) return;
      setSaveError(getErrorText(error, messages));
    }
  };
  const remove = () => {
    if (!entry?.id || saving || deleting) return;
    Alert.alert(messages.deleteTitle, messages.deleteMessage(entry.title), [
      { text: messages.cancel, style: "cancel" },
      {
        text: messages.confirmDelete,
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteExperienceMutation.mutateAsync(entry.id as string);
              allowNavigation();
              router.back();
            } catch (error) {
              if (!(await redirectIfSessionExpired(error)))
                setSaveError(getErrorText(error, messages));
            }
          })();
        },
      },
    ]);
  };
  return (
    <ExperienceEditor
      isExisting={Boolean(entry)}
      form={form}
      messages={messages}
      employmentTypes={employmentTypes}
      errors={errors}
      saveError={saveError}
      saving={saving}
      deleting={deleting}
      onBack={leave}
      onRemove={remove}
      onFieldChange={setField}
      onSave={() => void save()}
    />
  );
}

function PortfolioEditorScreen({
  entry,
  onBack,
}: {
  entry?: PortfolioEntry;
  onBack: () => void;
}) {
  const router = useRouter();
  const redirectIfSessionExpired = useSessionExpiryRedirect();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [form, setForm] = useState<PortfolioForm>(() => toPortfolioForm(entry));
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const createPortfolioMutation = useCreatePortfolioMutation();
  const updatePortfolioMutation = useUpdatePortfolioMutation();
  const uploadPortfolioImageMutation = useUploadPortfolioImageMutation();
  const deletePortfolioImageMutation = useDeletePortfolioImageMutation();
  const deletePortfolioMutation = useDeletePortfolioMutation();
  const saving =
    createPortfolioMutation.isPending ||
    updatePortfolioMutation.isPending ||
    uploadPortfolioImageMutation.isPending ||
    deletePortfolioImageMutation.isPending;
  const deleting = deletePortfolioMutation.isPending;
  const leave = useLeaveConfirmation(messages, dirty, onBack);
  const allowNavigation = useUnsavedNavigationGuard(messages, dirty);
  const setField = <K extends keyof PortfolioForm>(
    field: K,
    value: PortfolioForm[K]
  ) => {
    setDirty(true);
    setForm((current) => ({ ...current, [field]: value }));
  };
  const save = async () => {
    const nextErrors = validatePortfolio(form, messages);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaveError(null);
    try {
      if (entry?.id) {
        await updatePortfolioMutation.mutateAsync({
          id: entry.id,
          update: {
            title: form.title.trim(),
            description: form.description.trim() || null,
          },
        });
        if (isLocalAsset(form.imageUri))
          await uploadPortfolioImageMutation.mutateAsync({
            id: entry.id,
            asset: { uri: form.imageUri },
          });
        else if (!form.imageUri && entry.images[0]?.url)
          await deletePortfolioImageMutation.mutateAsync(entry.id);
      } else {
        await createPortfolioMutation.mutateAsync({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          imageUris: isLocalAsset(form.imageUri) ? [form.imageUri] : [],
        });
      }
      allowNavigation();
      router.back();
    } catch (error) {
      if (await redirectIfSessionExpired(error)) return;
      setSaveError(getErrorText(error, messages));
    }
  };
  const remove = () => {
    if (!entry?.id || saving || deleting) return;
    Alert.alert(messages.deleteTitle, messages.deleteMessage(entry.title), [
      { text: messages.cancel, style: "cancel" },
      {
        text: messages.confirmDelete,
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deletePortfolioMutation.mutateAsync(entry.id as string);
              allowNavigation();
              router.back();
            } catch (error) {
              if (!(await redirectIfSessionExpired(error)))
                setSaveError(getErrorText(error, messages));
            }
          })();
        },
      },
    ]);
  };
  return (
    <PortfolioEditor
      isExisting={Boolean(entry)}
      form={form}
      messages={messages}
      errors={errors}
      saveError={saveError}
      saving={saving}
      deleting={deleting}
      onBack={leave}
      onRemove={remove}
      onFieldChange={setField}
      onImageChange={(uri) => {
        setDirty(true);
        setForm((current) => ({ ...current, imageUri: uri }));
      }}
      onImageError={setSaveError}
      onSave={() => void save()}
    />
  );
}

function CertificateEditorScreen({
  entry,
  onBack,
}: {
  entry?: CertificateEntry;
  onBack: () => void;
}) {
  const router = useRouter();
  const redirectIfSessionExpired = useSessionExpiryRedirect();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [form, setForm] = useState<CertificateForm>(() =>
    toCertificateForm(entry)
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const updateCertificateMutation = useUpdateCertificateMutation();
  const createCertificateMutation = useCreateCertificateMutation();
  const uploadCertificateImageMutation = useUploadCertificateImageMutation();
  const deleteCertificateImageMutation = useDeleteCertificateImageMutation();
  const deleteCertificateMutation = useDeleteCertificateMutation();
  const saving =
    createCertificateMutation.isPending ||
    updateCertificateMutation.isPending ||
    uploadCertificateImageMutation.isPending ||
    deleteCertificateImageMutation.isPending;
  const deleting = deleteCertificateMutation.isPending;
  const [createdId, setCreatedId] = useState<string | undefined>(entry?.id);
  const leave = useLeaveConfirmation(messages, dirty, onBack);
  const allowNavigation = useUnsavedNavigationGuard(messages, dirty);
  const setField = <K extends keyof CertificateForm>(
    field: K,
    value: CertificateForm[K]
  ) => {
    setDirty(true);
    setForm((current) => ({ ...current, [field]: value }));
  };
  const save = async () => {
    const nextErrors = validateCertificate(form, messages);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaveError(null);
    try {
      const payload = {
        name: form.name.trim(),
        issuer: form.issuer.trim(),
        issuedAt: form.issuedAt,
      };
      let certificateId = createdId;
      if (certificateId) {
        await updateCertificateMutation.mutateAsync({
          id: certificateId,
          update: payload,
        });
        if (isLocalAsset(form.imageUri))
          await uploadCertificateImageMutation.mutateAsync({
            id: certificateId,
            asset: { uri: form.imageUri },
          });
        else if (!form.imageUri && entry?.image)
          await deleteCertificateImageMutation.mutateAsync(certificateId);
      } else {
        certificateId = await createCertificateMutation.mutateAsync(payload);
        setCreatedId(certificateId);
        if (isLocalAsset(form.imageUri))
          await uploadCertificateImageMutation.mutateAsync({
            id: certificateId,
            asset: { uri: form.imageUri },
          });
      }
      allowNavigation();
      router.back();
    } catch (error) {
      if (await redirectIfSessionExpired(error)) return;
      setSaveError(getErrorText(error, messages));
    }
  };
  const remove = () => {
    if (!entry?.id || saving || deleting) return;
    Alert.alert(messages.deleteTitle, messages.deleteMessage(entry.name), [
      { text: messages.cancel, style: "cancel" },
      {
        text: messages.confirmDelete,
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteCertificateMutation.mutateAsync(entry.id as string);
              allowNavigation();
              router.back();
            } catch (error) {
              if (!(await redirectIfSessionExpired(error)))
                setSaveError(getErrorText(error, messages));
            }
          })();
        },
      },
    ]);
  };
  return (
    <CertificateEditor
      isExisting={Boolean(entry)}
      form={form}
      messages={messages}
      errors={errors}
      saveError={saveError}
      saving={saving}
      deleting={deleting}
      onBack={leave}
      onRemove={remove}
      onFieldChange={setField}
      onImageChange={(uri) => {
        setDirty(true);
        setForm((current) => ({ ...current, imageUri: uri }));
      }}
      onImageError={setSaveError}
      onSave={() => void save()}
    />
  );
}

function HubContent({ data }: { data: ProfileEditData }) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [academicUnavailable, setAcademicUnavailable] = useState(
    () =>
      isPrototypeDemoEnabled() ||
      process.env.EXPO_PUBLIC_PROFILE_DEMO === "true"
  );
  const openAcademicRegistration = () => {
    if (
      isPrototypeDemoEnabled() ||
      process.env.EXPO_PUBLIC_PROFILE_DEMO === "true"
    ) {
      setAcademicUnavailable(true);
      return;
    }
    router.push("/onboarding?mode=edit");
  };
  const sections: Array<{
    key: HubSectionKey;
    title: string;
    summary: string;
    onPress: () => void;
  }> = [
    {
      key: "basics",
      title: messages.basics,
      summary: messages.basicsSummary,
      onPress: () => router.push("/profile/edit/basics"),
    },
    {
      key: "academic-registration",
      title: messages.academicRegistration,
      summary: academicUnavailable
        ? messages.unavailable
        : messages.academicRegistrationSummary,
      onPress: openAcademicRegistration,
    },
    {
      key: "experience",
      title: messages.experience,
      summary:
        data.sectionUnavailable.experience || data.sectionErrors.experience
          ? messages.unavailable
          : messages.experienceSummary(data.experiences.length),
      onPress: () => router.push("/profile/edit/experience"),
    },
    {
      key: "portfolio",
      title: messages.portfolio,
      summary:
        data.sectionUnavailable.portfolio || data.sectionErrors.portfolio
          ? messages.unavailable
          : messages.portfolioSummary(data.portfolio.length),
      onPress: () => router.push("/profile/edit/portfolio"),
    },
    {
      key: "certificates",
      title: messages.certificates,
      summary:
        data.sectionUnavailable.certificates || data.sectionErrors.certificates
          ? messages.unavailable
          : messages.certificatesSummary(data.certificates.length),
      onPress: () => router.push("/profile/edit/certificates"),
    },
  ];

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <ScrollView
        contentContainerClassName={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={messages.title}
          backLabel={messages.back}
          onBack={() => router.back()}
        />
        <Text className={styles.intro}>{messages.basicsSummary}</Text>
        <View className={styles.sectionList}>
          {sections.map((section) => (
            <Pressable
              key={section.key}
              testID={`profile-edit-section-${section.key}`}
              accessibilityRole="button"
              className={styles.sectionRow}
              onPress={section.onPress}
            >
              <View className={styles.sectionRowContent}>
                <Text className={styles.sectionRowTitle}>{section.title}</Text>
                <Text className={styles.sectionRowSummary}>
                  {section.summary}
                </Text>
              </View>
              <ChevronRight
                color={colors.textMuted}
                size={22}
                strokeWidth={2}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

export function EditProfileHubScreen() {
  const router = useRouter();
  return (
    <ProfileEditDataLoader loadingVariant="hub" onBack={() => router.back()}>
      {(data) => <HubContent data={data} />}
    </ProfileEditDataLoader>
  );
}

function SectionListScreen({
  section,
  data,
  onBack,
}: {
  section: Exclude<EditSection, "basics">;
  data: ProfileEditData;
  onBack: () => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const title =
    section === "experience"
      ? messages.experienceSection
      : section === "portfolio"
        ? messages.portfolioSection
        : messages.certificatesSection;
  const items =
    section === "experience"
      ? data.experiences
      : section === "portfolio"
        ? data.portfolio
        : data.certificates;
  const openItem = (id?: string) =>
    router.push(
      `/profile/edit/${section}?itemId=${encodeURIComponent(id ?? "new")}`
    );

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <ScrollView
        contentContainerClassName={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={title} backLabel={messages.back} onBack={onBack} />
        {data.sectionUnavailable[section] ? (
          <UnavailableState message={messages.unavailable} />
        ) : data.sectionErrors[section] ? (
          <ErrorState
            message={messages.sectionLoadError}
            retry={() => router.replace(`/profile/edit/${section}`)}
            retryLabel={messages.retry}
          />
        ) : items.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>{messages.noItems}</Text>
          </View>
        ) : (
          <View className={styles.sectionList}>
            {items.map((item) =>
              section === "experience" ? (
                <ExperienceRow
                  key={(item as ExperienceEntry).id}
                  entry={item as ExperienceEntry}
                  presentLabel={messages.present}
                  onPress={() => openItem((item as ExperienceEntry).id)}
                />
              ) : section === "portfolio" ? (
                <PortfolioRow
                  key={(item as PortfolioEntry).id}
                  entry={item as PortfolioEntry}
                  noImageLabel={messages.noImage}
                  onPress={() => openItem((item as PortfolioEntry).id)}
                />
              ) : (
                <CertificateRow
                  key={(item as CertificateEntry).id}
                  entry={item as CertificateEntry}
                  noImageLabel={messages.noImage}
                  onPress={() => openItem((item as CertificateEntry).id)}
                />
              )
            )}
          </View>
        )}
        {data.sectionUnavailable[section] ||
        data.sectionErrors[section] ? null : (
          <Button
            variant="secondary"
            className={styles.addButton}
            onPress={() => openItem()}
            accessibilityLabel={messages.add}
          >
            <Plus color={colors.primary} size={18} />
            <Text className={styles.addButtonText}>{messages.add}</Text>
          </Button>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

function ExperienceRow({
  entry,
  presentLabel,
  onPress,
}: {
  entry: ExperienceEntry;
  presentLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={styles.itemRow}
      onPress={onPress}
    >
      <View className={styles.itemRowContent}>
        <Text className={styles.itemTitle}>{entry.title}</Text>
        <Text className={styles.itemMeta}>
          {entry.organization || entry.employmentType}
        </Text>
        <Text className={styles.itemDescription}>
          {entry.endedAt
            ? `${entry.startedAt} – ${entry.endedAt}`
            : `${entry.startedAt} – ${presentLabel}`}
        </Text>
      </View>
      <Pencil color={colors.primary} size={18} />
    </Pressable>
  );
}

function PortfolioRow({
  entry,
  noImageLabel,
  onPress,
}: {
  entry: PortfolioEntry;
  noImageLabel: string;
  onPress: () => void;
}) {
  const image = entry.images[0]?.url;
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      className={styles.itemRow}
      onPress={onPress}
    >
      {image && !imageFailed ? (
        <Image
          source={{ uri: image }}
          onError={() => setImageFailed(true)}
          className={styles.itemImage}
          contentFit="cover"
        />
      ) : (
        <View className={styles.itemImageFallback}>
          <Text className={styles.itemImageFallbackText}>{noImageLabel}</Text>
        </View>
      )}
      <View className={styles.itemRowContent}>
        <Text className={styles.itemTitle}>{entry.title}</Text>
        {entry.description ? (
          <Text className={styles.itemDescription} numberOfLines={2}>
            {entry.description}
          </Text>
        ) : null}
      </View>
      <Pencil color={colors.primary} size={18} />
    </Pressable>
  );
}

function CertificateRow({
  entry,
  noImageLabel,
  onPress,
}: {
  entry: CertificateEntry;
  noImageLabel: string;
  onPress: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      className={styles.itemRow}
      onPress={onPress}
    >
      {entry.image && !imageFailed ? (
        <Image
          source={{ uri: entry.image.url }}
          onError={() => setImageFailed(true)}
          className={styles.itemImage}
          contentFit="cover"
        />
      ) : (
        <View className={styles.itemImageFallback}>
          <Text className={styles.itemImageFallbackText}>{noImageLabel}</Text>
        </View>
      )}
      <View className={styles.itemRowContent}>
        <Text className={styles.itemTitle}>{entry.name}</Text>
        <Text className={styles.itemMeta}>{entry.issuer}</Text>
        <Text className={styles.itemDescription}>{entry.issuedAt}</Text>
      </View>
      <Pencil color={colors.primary} size={18} />
    </Pressable>
  );
}

function ProfileEditDataLoader({
  children,
  loadingVariant,
  onBack,
}: {
  children: (data: ProfileEditData) => React.ReactNode;
  loadingVariant: ProfileEditLoadingVariant;
  onBack: () => void;
}) {
  const redirectIfSessionExpired = useSessionExpiryRedirect();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const {
    data,
    error: queryError,
    isPending,
    refetch,
  } = useProfileEditDataQuery();
  const redirectedToRoot = useRef(false);
  useEffect(() => {
    if (
      !queryError ||
      redirectedToRoot.current ||
      !isSessionExpired(queryError)
    )
      return;
    redirectedToRoot.current = true;
    void redirectIfSessionExpired(queryError);
  }, [queryError, redirectIfSessionExpired]);
  if (queryError && !data && !isSessionExpired(queryError))
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <ScrollView contentContainerClassName={styles.scrollContent}>
          <ScreenHeader
            title={messages.title}
            backLabel={messages.back}
            onBack={onBack}
          />
          <ErrorState
            message={messages.loadError}
            retry={() => void refetch()}
            retryLabel={messages.retry}
          />
        </ScrollView>
      </ScreenLayout>
    );
  if (isPending || !data)
    return (
      <ProfileEditLoadingState
        messages={messages}
        onBack={onBack}
        variant={loadingVariant}
      />
    );
  return <>{children(data)}</>;
}

export default function ProfileEditSectionScreen() {
  const router = useRouter();
  const { section: rawSection, itemId: rawItemId } = useLocalSearchParams<{
    section?: string | string[];
    itemId?: string | string[];
  }>();
  const section = getParam(rawSection) as EditSection | undefined;
  const itemId = getParam(rawItemId);
  const onBack = () => router.back();

  const loadingVariant: ProfileEditLoadingVariant =
    section === "basics"
      ? "basics-editor"
      : section === "experience"
        ? itemId
          ? "experience-editor"
          : "experience-list"
        : section === "portfolio"
          ? itemId
            ? "portfolio-editor"
            : "portfolio-list"
          : section === "certificates" && itemId
            ? "certificates-editor"
            : "certificates-list";

  return (
    <ProfileEditDataLoader loadingVariant={loadingVariant} onBack={onBack}>
      {(data) => {
        if (section === "basics")
          return <BasicsEditorScreen data={data} onBack={onBack} />;
        if (section === "experience") {
          if (data.sectionUnavailable.experience) {
            return (
              <SectionListScreen
                section="experience"
                data={data}
                onBack={onBack}
              />
            );
          }
          const entry = data.experiences.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <ExperienceEditorScreen onBack={onBack} />
          ) : itemId && entry ? (
            <ExperienceEditorScreen entry={entry} onBack={onBack} />
          ) : (
            <SectionListScreen
              section="experience"
              data={data}
              onBack={onBack}
            />
          );
        }
        if (section === "portfolio") {
          if (data.sectionUnavailable.portfolio) {
            return (
              <SectionListScreen
                section="portfolio"
                data={data}
                onBack={onBack}
              />
            );
          }
          const entry = data.portfolio.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <PortfolioEditorScreen onBack={onBack} />
          ) : itemId && entry ? (
            <PortfolioEditorScreen entry={entry} onBack={onBack} />
          ) : (
            <SectionListScreen
              section="portfolio"
              data={data}
              onBack={onBack}
            />
          );
        }
        if (section === "certificates") {
          if (data.sectionUnavailable.certificates) {
            return (
              <SectionListScreen
                section="certificates"
                data={data}
                onBack={onBack}
              />
            );
          }
          const entry = data.certificates.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <CertificateEditorScreen onBack={onBack} />
          ) : itemId && entry ? (
            <CertificateEditorScreen entry={entry} onBack={onBack} />
          ) : (
            <SectionListScreen
              section="certificates"
              data={data}
              onBack={onBack}
            />
          );
        }
        return (
          <SectionListScreen section="experience" data={data} onBack={onBack} />
        );
      }}
    </ProfileEditDataLoader>
  );
}
