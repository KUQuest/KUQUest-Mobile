import React, { useCallback, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
  useNavigation,
} from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react-native";

import { ApiError } from "../../api/ApiClient";
import type { ProfileEditData } from "../../api/ProfileApi";
import { profileModule } from "../profile/profileModule";
import { useAuthEnvironment } from "../auth/authEnvironment";
import { authService } from "../auth/AuthService";
import { AuthError } from "../auth/types";
import { onboardingMessages } from "../../locales/registrationOnboarding";
import {
  profileEditMessages,
  type ProfileEditMessages,
} from "../../locales/profileEditMessages";
import { useLocale } from "../../locales/LocaleProvider";
import { Button } from "../../components/ui/Button";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "../../components/ui/LoadingSkeleton";
import { Input } from "../onboarding/components/Input";
import { Select } from "../onboarding/components/Select";
import { TextArea } from "../onboarding/components/TextArea";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "../../tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import styles from "./profileEditStyles";
import {
  formatDateForApi,
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

type EditSection = "basics" | "experience" | "portfolio" | "certificates";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isLocalAsset(uri: string): boolean {
  return Boolean(uri) && !/^https?:\/\//i.test(uri);
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
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

async function redirectIfSessionExpired(
  error: unknown,
  router: ReturnType<typeof useRouter>
): Promise<boolean> {
  if (!isSessionExpired(error)) return false;
  await authService.signOut().catch(() => undefined);
  router.replace("/");
  return true;
}

function ScreenHeader({
  title,
  backLabel,
  onBack,
  action,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View className={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        className={styles.backButton}
        onPress={onBack}
      >
        <ArrowLeft color={colors.primaryDeep} size={24} strokeWidth={2.2} />
      </Pressable>
      <Text accessibilityRole="header" className={styles.headerTitle}>
        {title}
      </Text>
      {action ?? <View className={styles.headerAction} />}
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
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
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
    </SafeAreaView>
  );
}

function SaveBar({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={styles.saveBar}
      style={{ paddingBottom: Math.max(insets.bottom, 24) }}
    >
      <View className={styles.saveBarInner}>
        <Button disabled={disabled} onPress={onPress}>
          {label}
        </Button>
      </View>
    </View>
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

function ImagePickerField({
  label,
  uri,
  placeholder,
  removeLabel,
  onChange,
  onError,
}: {
  label: string;
  uri: string;
  placeholder: string;
  removeLabel: string;
  onChange: (uri: string) => void;
  onError: (message: string) => void;
}) {
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const chooseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        onError(messages.fileTooLarge);
        return;
      }
      onChange(asset.uri);
    } catch {
      onError(messages.filePickerError);
    }
  };

  return (
    <View className="gap-ku-sm">
      <Text className="font-ku-semibold text-ku-text-secondary text-ku-label">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uri ? label : placeholder}
        className={styles.imagePicker}
        style={{ aspectRatio: 4 / 3 }}
        onPress={() => void chooseImage()}
      >
        {uri && failedUri !== uri ? (
          <Image
            source={{ uri }}
            onError={() => setFailedUri(uri)}
            className={styles.imagePreview}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center gap-[4px]">
            <ImageIcon color={colors.textMuted} size={24} />
            <Text className={styles.imagePickerText}>{placeholder}</Text>
          </View>
        )}
      </Pressable>
      {uri ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={removeLabel}
          className="min-h-[48px] self-start justify-center"
          onPress={() => onChange("")}
        >
          <Text className="font-ku-semibold text-ku-primary text-ku-meta">
            {removeLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DateField({
  label,
  value,
  placeholder,
  onChange,
  error,
  clearLabel,
  onClear,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  clearLabel?: string;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed" || !selectedDate) {
      setOpen(false);
      return;
    }
    onChange(formatDateForApi(selectedDate));
    setOpen(false);
  };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date();
  return (
    <View className={styles.dateField}>
      <Text className="font-ku-semibold text-ku-text-secondary text-ku-label mb-[6px]">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityState={{ expanded: open }}
        className={styles.dateButton}
        onPress={() => setOpen(true)}
      >
        <Text className={value ? styles.dateText : styles.datePlaceholder}>
          {value || placeholder}
        </Text>
        <CalendarDays color={colors.textMuted} size={18} />
      </Pressable>
      {error ? (
        <Text
          accessibilityRole="alert"
          className="font-ku-regular text-ku-danger text-ku-label mt-[4px]"
        >
          {error}
        </Text>
      ) : null}
      {value && onClear && clearLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          className={styles.clearDate}
          onPress={onClear}
        >
          <Text className={styles.clearDateText}>{clearLabel}</Text>
        </Pressable>
      ) : null}
      {open ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

function HubContent({ data }: { data: ProfileEditData }) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const sections = [
    {
      key: "basics" as const,
      title: messages.basics,
      summary: messages.basicsSummary,
    },
    {
      key: "experience" as const,
      title: messages.experience,
      summary: data.sectionErrors.experience
        ? messages.unavailable
        : messages.experienceSummary(data.experiences.length),
    },
    {
      key: "portfolio" as const,
      title: messages.portfolio,
      summary: data.sectionErrors.portfolio
        ? messages.unavailable
        : messages.portfolioSummary(data.portfolio.length),
    },
    {
      key: "certificates" as const,
      title: messages.certificates,
      summary: data.sectionErrors.certificates
        ? messages.unavailable
        : messages.certificatesSummary(data.certificates.length),
    },
  ];

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
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
              onPress={() => router.push(`/profile/edit/${section.key}`)}
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
    </SafeAreaView>
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

function BasicsEditor({
  data,
  onBack,
}: {
  data: ProfileEditData;
  onBack: () => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [form, setForm] = useState<BasicsForm>(() =>
    toBasicsForm(data.profile)
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    setSaveError(null);
    try {
      const { firstName, lastName } = splitDisplayName(form.name);
      await profileModule.updateBasics({
        firstName,
        lastName,
        bio: form.bio.trim() || null,
        occupationId:
          data.occupations.length > 0
            ? form.occupationId || undefined
            : undefined,
      });
      if (isLocalAsset(form.profileImage)) {
        try {
          await profileModule.uploadAvatar({ uri: form.profileImage });
        } catch (error) {
          if (await redirectIfSessionExpired(error, router)) return;
          setSaveError(messages.avatarUploadError);
          return;
        }
      }
      allowNavigation();
      router.back();
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setSaveError(getErrorText(error, messages));
    } finally {
      setSaving(false);
    }
  };
  const profileName = form.name || data.profile.firstName;
  const profileImageSource = form.profileImage
    ? form.profileImageCacheKey
      ? { uri: form.profileImage, cacheKey: form.profileImageCacheKey }
      : { uri: form.profileImage }
    : undefined;

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <KeyboardAvoidingView
        className={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerClassName={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title={messages.basicsSection}
            backLabel={messages.back}
            onBack={leave}
          />
          <View className={styles.formGroup}>
            <Text className={styles.formGroupTitle}>{messages.basics}</Text>
            <View className={styles.avatarPicker}>
              {profileImageSource && !avatarImageFailed ? (
                <Image
                  source={profileImageSource}
                  onError={() => setAvatarImageFailed(true)}
                  className={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View className={styles.avatarFallback}>
                  <Text className={styles.avatarInitials}>
                    {getInitials(profileName)}
                  </Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={messages.changeAvatar}
                className={styles.avatarButton}
                onPress={() => {
                  void ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                  })
                    .then((result) => {
                      const asset = result.assets?.[0];
                      if (result.canceled || !asset) return;
                      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
                        setSaveError(messages.fileTooLarge);
                        return;
                      }
                      setAvatarImageFailed(false);
                      setDirty(true);
                      setForm((current) => ({
                        ...current,
                        profileImage: asset.uri,
                        profileImageCacheKey: undefined,
                      }));
                    })
                    .catch(() => setSaveError(messages.filePickerError));
                }}
              >
                <Pencil color={colors.primary} size={15} />
                <Text className={styles.avatarButtonText}>
                  {messages.changeAvatar}
                </Text>
              </Pressable>
              <Text
                accessibilityRole={avatarImageFailed ? "alert" : undefined}
                className={
                  avatarImageFailed ? styles.avatarError : styles.avatarHelp
                }
              >
                {avatarImageFailed
                  ? messages.avatarPreviewError
                  : messages.avatarHelp}
              </Text>
            </View>
            <Input
              label={messages.name}
              placeholder={messages.namePlaceholder}
              value={form.name}
              onChangeText={(value) => setField("name", value)}
              error={errors.name}
              maxLength={201}
              autoCapitalize="words"
            />
            {data.occupations.length > 0 ? (
              <Select
                label={messages.occupation}
                placeholder={messages.occupationPlaceholder}
                options={data.occupations.map((occupation) => ({
                  label: occupation.name,
                  value: occupation.id,
                }))}
                value={form.occupationId}
                onValueChange={(value) => setField("occupationId", value)}
              />
            ) : null}
            <TextArea
              label={messages.bio}
              placeholder={messages.bioPlaceholder}
              value={form.bio}
              onChangeText={(value) => setField("bio", value)}
              maxLength={1000}
            />
          </View>
          {saveError ? (
            <View className={styles.errorCard} accessibilityRole="alert">
              <Text className={styles.errorText}>{saveError}</Text>
            </View>
          ) : null}
        </ScrollView>
        <SaveBar
          label={saving ? messages.saving : messages.save}
          disabled={saving}
          onPress={() => void save()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <ScrollView
        contentContainerClassName={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={title} backLabel={messages.back} onBack={onBack} />
        {data.sectionErrors[section] ? (
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
        {data.sectionErrors[section] ? null : (
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
    </SafeAreaView>
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
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const { activePersonaId } = useAuthEnvironment();
  const [data, setData] = useState<ProfileEditData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The focus effect re-runs whenever the navigator hands focus back, so an
  // unguarded redirect here would loop: redirect -> refocus -> redirect.
  const redirectedToRoot = useRef(false);
  useFocusEffect(
    useCallback(() => {
      void attempt;
      if (redirectedToRoot.current) return;
      let active = true;
      setError(false);
      setData(null);
      void profileModule
        .getEditData(activePersonaId)
        .then((nextData) => {
          if (active) setData(nextData);
        })
        .catch(async (loadError) => {
          if (isSessionExpired(loadError)) {
            if (active && !redirectedToRoot.current) {
              redirectedToRoot.current = true;
              await redirectIfSessionExpired(loadError, router);
            }
            return;
          }
          if (active) setError(true);
        });
      return () => {
        active = false;
      };
    }, [activePersonaId, attempt, router])
  );
  if (error && !data)
    return (
      <SafeAreaView
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
            retry={() => setAttempt((value) => value + 1)}
            retryLabel={messages.retry}
          />
        </ScrollView>
      </SafeAreaView>
    );
  if (!data)
    return (
      <ProfileEditLoadingState
        messages={messages}
        onBack={onBack}
        variant={loadingVariant}
      />
    );
  return <>{children(data)}</>;
}

function ExperienceEditor({
  entry,
  onBack,
}: {
  entry?: ExperienceEntry;
  onBack: () => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const employmentTypes = onboardingMessages[locale].employmentTypes;
  const [form, setForm] = useState<ExperienceForm>(() =>
    toExperienceForm(entry)
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    setSaving(true);
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
      if (entry?.id) await profileModule.updateExperience(entry.id, payload);
      else await profileModule.createExperience(payload);
      allowNavigation();
      router.back();
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setSaveError(getErrorText(error, messages));
    } finally {
      setSaving(false);
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
          setDeleting(true);
          void (async () => {
            try {
              await profileModule.deleteExperience(entry.id as string);
              allowNavigation();
              router.back();
            } catch (error) {
              if (!(await redirectIfSessionExpired(error, router)))
                setSaveError(getErrorText(error, messages));
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <KeyboardAvoidingView
        className={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerClassName={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title={
              entry ? messages.experienceEditTitle : messages.experienceAddTitle
            }
            backLabel={messages.back}
            onBack={leave}
            action={
              entry ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.remove}
                  accessibilityState={{ disabled: saving || deleting }}
                  disabled={saving || deleting}
                  className={styles.headerAction}
                  onPress={remove}
                >
                  <Trash2 color={colors.danger} size={20} />
                </Pressable>
              ) : undefined
            }
          />
          <View className={styles.formGroup}>
            <Text className={styles.formGroupTitle}>
              {messages.experienceSection}
            </Text>
            <Text className={styles.formGroupHint}>
              {messages.experienceFormHint}
            </Text>
            <Input
              label={messages.experienceTitleLabel}
              placeholder={messages.experienceTitlePlaceholder}
              value={form.title}
              onChangeText={(value) => setField("title", value)}
              error={errors.title}
              maxLength={120}
            />
            <Select
              label={messages.employmentType}
              placeholder={messages.employmentTypePlaceholder}
              options={employmentTypes}
              value={form.employmentType}
              onValueChange={(value) => setField("employmentType", value)}
              error={errors.employmentType}
              closeLabel={messages.closeEmploymentType}
            />
            <Input
              label={messages.organizationOptional}
              placeholder={messages.organizationPlaceholder}
              value={form.organization}
              onChangeText={(value) => setField("organization", value)}
              maxLength={120}
            />
            <TextArea
              label={messages.detailOptional}
              placeholder={messages.detailPlaceholder}
              value={form.description}
              onChangeText={(value) => setField("description", value)}
              maxLength={1000}
            />
            <View className={styles.dateRow}>
              <DateField
                label={messages.startDate}
                placeholder={messages.startDatePlaceholder}
                value={form.startedAt}
                onChange={(value) => setField("startedAt", value)}
                error={errors.startedAt}
              />
              <DateField
                label={messages.endDateOptional}
                placeholder={messages.ongoingDatePlaceholder}
                value={form.endedAt}
                onChange={(value) => setField("endedAt", value)}
                onClear={() => setField("endedAt", "")}
                clearLabel={messages.markOngoing}
                error={errors.endedAt}
              />
            </View>
          </View>
          {saveError ? (
            <View className={styles.errorCard} accessibilityRole="alert">
              <Text className={styles.errorText}>{saveError}</Text>
            </View>
          ) : null}
        </ScrollView>
        <SaveBar
          label={saving ? messages.saving : messages.save}
          disabled={saving || deleting}
          onPress={() => void save()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PortfolioEditor({
  entry,
  onBack,
}: {
  entry?: PortfolioEntry;
  onBack: () => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [form, setForm] = useState<PortfolioForm>(() => toPortfolioForm(entry));
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    setSaving(true);
    setSaveError(null);
    try {
      if (entry?.id) {
        await profileModule.updatePortfolio(entry.id, {
          title: form.title.trim(),
          description: form.description.trim() || null,
        });
        if (isLocalAsset(form.imageUri))
          await profileModule.uploadPortfolioImage(entry.id, {
            uri: form.imageUri,
          });
        else if (!form.imageUri && entry.images[0]?.url)
          await profileModule.deletePortfolioImage(entry.id);
      } else {
        await profileModule.createPortfolio({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          imageUris: isLocalAsset(form.imageUri) ? [form.imageUri] : [],
        });
      }
      allowNavigation();
      router.back();
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setSaveError(getErrorText(error, messages));
    } finally {
      setSaving(false);
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
          setDeleting(true);
          void (async () => {
            try {
              await profileModule.deletePortfolio(entry.id as string);
              allowNavigation();
              router.back();
            } catch (error) {
              if (!(await redirectIfSessionExpired(error, router)))
                setSaveError(getErrorText(error, messages));
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };
  const setImage = (uri: string) => {
    setDirty(true);
    setForm((current) => ({ ...current, imageUri: uri }));
  };
  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <KeyboardAvoidingView
        className={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerClassName={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title={entry ? messages.edit : messages.add}
            backLabel={messages.back}
            onBack={leave}
            action={
              entry ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.remove}
                  accessibilityState={{ disabled: saving || deleting }}
                  disabled={saving || deleting}
                  className={styles.headerAction}
                  onPress={remove}
                >
                  <Trash2 color={colors.danger} size={20} />
                </Pressable>
              ) : undefined
            }
          />
          <View className={styles.formGroup}>
            <Text className={styles.formGroupTitle}>
              {messages.portfolioSection}
            </Text>
            <ImagePickerField
              label={messages.image}
              uri={form.imageUri}
              placeholder={messages.addImage}
              removeLabel={messages.removeImage}
              onChange={setImage}
              onError={setSaveErrorMessage(setSaveError)}
            />
            <Input
              label={messages.titleLabel}
              placeholder={messages.titlePlaceholder}
              value={form.title}
              onChangeText={(value) => setField("title", value)}
              error={errors.title}
              maxLength={120}
            />
            <TextArea
              label={messages.detail}
              placeholder={messages.detailPlaceholder}
              value={form.description}
              onChangeText={(value) => setField("description", value)}
              maxLength={1000}
            />
          </View>
          {saveError ? (
            <View className={styles.errorCard} accessibilityRole="alert">
              <Text className={styles.errorText}>{saveError}</Text>
            </View>
          ) : null}
        </ScrollView>
        <SaveBar
          label={saving ? messages.saving : messages.save}
          disabled={saving || deleting}
          onPress={() => void save()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function setSaveErrorMessage(setter: (value: string | null) => void) {
  return (message: string) => setter(message);
}

function CertificateEditor({
  entry,
  onBack,
}: {
  entry?: CertificateEntry;
  onBack: () => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [form, setForm] = useState<CertificateForm>(() =>
    toCertificateForm(entry)
  );
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        name: form.name.trim(),
        issuer: form.issuer.trim(),
        issuedAt: form.issuedAt,
      };
      let certificateId = createdId;
      if (certificateId) {
        await profileModule.updateCertificate(certificateId, payload);
        if (isLocalAsset(form.imageUri))
          await profileModule.uploadCertificateImage(certificateId, {
            uri: form.imageUri,
          });
        else if (!form.imageUri && entry?.image)
          await profileModule.deleteCertificateImage(certificateId);
      } else {
        certificateId = await profileModule.createCertificate(payload);
        setCreatedId(certificateId);
        if (isLocalAsset(form.imageUri))
          await profileModule.uploadCertificateImage(certificateId, {
            uri: form.imageUri,
          });
      }
      allowNavigation();
      router.back();
    } catch (error) {
      if (await redirectIfSessionExpired(error, router)) return;
      setSaveError(getErrorText(error, messages));
    } finally {
      setSaving(false);
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
          setDeleting(true);
          void (async () => {
            try {
              await profileModule.deleteCertificate(entry.id as string);
              allowNavigation();
              router.back();
            } catch (error) {
              if (!(await redirectIfSessionExpired(error, router)))
                setSaveError(getErrorText(error, messages));
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };
  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <KeyboardAvoidingView
        className={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerClassName={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title={entry ? messages.edit : messages.add}
            backLabel={messages.back}
            onBack={leave}
            action={
              entry ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.remove}
                  accessibilityState={{ disabled: saving || deleting }}
                  disabled={saving || deleting}
                  className={styles.headerAction}
                  onPress={remove}
                >
                  <Trash2 color={colors.danger} size={20} />
                </Pressable>
              ) : undefined
            }
          />
          <View className={styles.formGroup}>
            <Text className={styles.formGroupTitle}>
              {messages.certificatesSection}
            </Text>
            <ImagePickerField
              label={messages.image}
              uri={form.imageUri}
              placeholder={messages.addImage}
              removeLabel={messages.removeImage}
              onChange={(uri) => {
                setDirty(true);
                setForm((current) => ({ ...current, imageUri: uri }));
              }}
              onError={setSaveErrorMessage(setSaveError)}
            />
            <Input
              label={messages.titleLabel}
              placeholder={messages.titlePlaceholder}
              value={form.name}
              onChangeText={(value) => setField("name", value)}
              error={errors.name}
            />
            <Input
              label={messages.issuer}
              placeholder={messages.issuerPlaceholder}
              value={form.issuer}
              onChangeText={(value) => setField("issuer", value)}
              error={errors.issuer}
            />
            <DateField
              label={messages.issuedAt}
              placeholder="YYYY-MM-DD"
              value={form.issuedAt}
              onChange={(value) => setField("issuedAt", value)}
              error={errors.issuedAt}
            />
          </View>
          {saveError ? (
            <View className={styles.errorCard} accessibilityRole="alert">
              <Text className={styles.errorText}>{saveError}</Text>
            </View>
          ) : null}
        </ScrollView>
        <SaveBar
          label={saving ? messages.saving : messages.save}
          disabled={saving || deleting}
          onPress={() => void save()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
          return <BasicsEditor data={data} onBack={onBack} />;
        if (section === "experience") {
          const entry = data.experiences.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <ExperienceEditor onBack={onBack} />
          ) : itemId && entry ? (
            <ExperienceEditor entry={entry} onBack={onBack} />
          ) : (
            <SectionListScreen
              section="experience"
              data={data}
              onBack={onBack}
            />
          );
        }
        if (section === "portfolio") {
          const entry = data.portfolio.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <PortfolioEditor onBack={onBack} />
          ) : itemId && entry ? (
            <PortfolioEditor entry={entry} onBack={onBack} />
          ) : (
            <SectionListScreen
              section="portfolio"
              data={data}
              onBack={onBack}
            />
          );
        }
        if (section === "certificates") {
          const entry = data.certificates.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <CertificateEditor onBack={onBack} />
          ) : itemId && entry ? (
            <CertificateEditor entry={entry} onBack={onBack} />
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
