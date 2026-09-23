import React, { useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { ApiError } from "@/api/ApiClient";
import type { ProfileEditData } from "@/api/StudentApi";
import type {
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
} from "@/api/contracts";
import { AuthError } from "@/features/auth/types";
import { useProfileEditSessionExpiryRedirect as useSessionExpiryRedirect } from "../sessionHandling";
import { useLocale } from "@/features/preferences/localeStore";
import { onboardingMessages } from "@/locales/registrationOnboarding";
import {
  profileEditMessages,
  type ProfileEditMessages,
} from "@/locales/profileEditMessages";
import {
  useCreateCertificateMutation,
  useCreateExperienceMutation,
  useCreatePortfolioMutation,
  useDeleteCertificateImageMutation,
  useDeleteCertificateMutation,
  useDeleteExperienceMutation,
  useDeletePortfolioImageMutation,
  useDeletePortfolioMutation,
  useUpdateBasicsMutation,
  useUpdateCertificateMutation,
  useUpdateExperienceMutation,
  useUpdatePortfolioMutation,
  useUploadAvatarMutation,
  useUploadCertificateImageMutation,
  useUploadPortfolioImageMutation,
} from "@/features/profile/api/profileQueries";
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
} from "../types";
import {
  validateBasics,
  validateCertificate,
  validateExperience,
  validatePortfolio,
} from "../validation";
import { BasicsEditor } from "../components/BasicsEditor";
import { CertificateEditor } from "../components/CertificateEditor";
import { ExperienceEditor } from "../components/ExperienceEditor";
import { PortfolioEditor } from "../components/PortfolioEditor";

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

export function BasicsEditorScreen({
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

export function ExperienceEditorScreen({
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

export function PortfolioEditorScreen({
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

export function CertificateEditorScreen({
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
