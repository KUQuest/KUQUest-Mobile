import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/tw/cn";
import {
  AccessibilityInfo,
  Alert,
  BackHandler,
  Modal,
  Platform,
  useColorScheme,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "@/tw";
import Animated, * as Reanimated from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { Button } from "@/components/ui/Button";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import {
  CalendarDays,
  CircleAlert,
  Image as ImageIcon,
  Pencil,
  Trash2,
  UserRound,
  X,
} from "lucide-react-native";

import styles from "@/features/onboarding/styles/registrationStyles";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Checkbox } from "../components/Checkbox";
import { TextArea } from "../components/TextArea";
import { FileTooLargeModal } from "../components/FileTooLargeModal";
import { onboardingMessages } from "../../../locales/registrationOnboarding";
import { useLocale } from "../../../locales/LocaleProvider";
import { createEmptyProfile } from "../../profile/types";
import type {
  Certificate,
  Experience,
  ProfileDraft,
  Work,
} from "../../profile/types";
import { authService } from "../../auth/AuthService";
import { authEnvironment } from "../../auth/authEnvironment";
import { AuthError, type OnboardingStep } from "../../auth/types";
import { ApiError } from "../../../api/ApiClient";
import type { AcademicRegistrationOptions } from "../../../api/contracts";
import { profileModule } from "../../profile/profileModule";
import {
  ProfilePersistenceCoordinator,
  ProfilePersistenceError,
} from "../profilePersistenceCoordinator";
import { parseOnboardingStep } from "../steps";
import { validateProfileBasics, validateProfileDetails } from "../validation";

function createOnboardingForm(): ProfileDraft {
  return {
    ...createEmptyProfile(),
  };
}

function createEmptyCertificate(): Certificate {
  return { name: "", issuer: "", issuedAt: "", imageUri: "" };
}

function createEmptyWork(): Work {
  return { imageUri: "", title: "", detail: "" };
}

function createEmptyExperience(): Experience {
  return {
    title: "",
    employmentType: "",
    organization: "",
    description: "",
    startedAt: "",
    endedAt: "",
  };
}

function formatMonthYear(value: string, locale: "en" | "th"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "short",
      }).format(date);
}

function formatDate(value: string, locale: "en" | "th"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
}

function onboardingDebug(
  message: string,
  details: Record<string, unknown> = {}
): void {
  if (__DEV__) {
    console.log(`[onboarding] ${message}`, details);
  }
}
function getOnboardingTransition(kind: "in" | "out", reduceMotion: boolean) {
  if (reduceMotion) return undefined;
  const transition = kind === "in" ? Reanimated.FadeIn : Reanimated.FadeOut;
  if (!transition || typeof transition.duration !== "function")
    return undefined;
  return transition.duration(220);
}
const MotionView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(View)
  : Animated.View;

function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function OnboardingSkeleton({
  currentStep,
  loadingLabel,
}: {
  currentStep: OnboardingStep;
  loadingLabel: string;
}) {
  const field = (key: string, height = 52) => (
    <View key={key} style={{ gap: spacing.xs }}>
      <SkeletonBlock height={14} width="42%" borderRadius={4} />
      <SkeletonBlock height={height} borderRadius={10} />
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
      <LoadingSkeleton
        loadingLabel={loadingLabel}
        style={{ flex: 1 }}
        contentStyle={{ flex: 1 }}
        testID="onboarding-loading-skeleton"
      >
        <KeyboardAvoidingView className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerClassName={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View className={styles.headerSection} style={{ gap: spacing.xs }}>
              <SkeletonBlock height={34} width="48%" borderRadius={6} />
              <SkeletonBlock height={28} width="66%" borderRadius={6} />
              <SkeletonBlock height={20} width="34%" borderRadius={4} />
              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  marginTop: spacing.sm,
                  width: "100%",
                }}
              >
                {[1, 2, 3].map((item) => (
                  <SkeletonBlock
                    key={item}
                    height={6}
                    borderRadius={4}
                    style={{ flex: 1 }}
                    testID={`onboarding-skeleton-progress-${item}`}
                  />
                ))}
              </View>
              {currentStep === 1 ? (
                <SkeletonBlock
                  variant="image"
                  height={80}
                  width={80}
                  borderRadius={40}
                  style={{ marginTop: spacing.sm }}
                  testID="onboarding-skeleton-avatar"
                />
              ) : null}
            </View>
            <View className={styles.formSection} style={{ gap: spacing.md }}>
              {currentStep === 1 ? (
                <>
                  {[
                    "name",
                    "telephone",
                    "occupation",
                    "faculty",
                    "department",
                  ].map((key) => field(key))}
                  <View style={{ gap: spacing.xs }}>
                    <SkeletonBlock height={14} width="48%" borderRadius={4} />
                    <SkeletonBlock height={84} borderRadius={12} />
                  </View>
                  <SkeletonBlock height={48} borderRadius={10} />
                </>
              ) : currentStep === 2 ? (
                <>
                  <View style={{ gap: spacing.xs }}>
                    <SkeletonBlock height={24} width="54%" borderRadius={5} />
                    <SkeletonBlock height={18} width="82%" borderRadius={4} />
                  </View>
                  {field("description", 168)}
                </>
              ) : (
                <>
                  <SkeletonBlock height={20} width="76%" borderRadius={5} />
                  {[1, 2].map((item) => (
                    <View
                      key={item}
                      style={{
                        gap: spacing.md,
                        paddingBottom: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderSubtle,
                      }}
                    >
                      <SkeletonBlock height={16} width="38%" borderRadius={4} />
                      <SkeletonBlock
                        variant="image"
                        height={104}
                        borderRadius={12}
                      />
                      {["title", "issuer", "date"].map((key) =>
                        field(`${item}-${key}`, 48)
                      )}
                    </View>
                  ))}
                </>
              )}
            </View>
          </ScrollView>
          <View className={styles.actionBar}>
            <View className={styles.actionButtons}>
              <SkeletonBlock
                height={48}
                borderRadius={24}
                style={{ flex: 1 }}
                testID="onboarding-skeleton-back"
              />
              <SkeletonBlock
                height={48}
                borderRadius={24}
                style={{ flex: 1 }}
                testID="onboarding-skeleton-next"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </LoadingSkeleton>
    </SafeAreaView>
  );
}

function removeIndexedErrors(
  errors: Record<string, string>,
  prefix: string,
  removedIndex: number
): Record<string, string> {
  const prefixWithSeparator = `${prefix}_`;
  return Object.entries(errors).reduce<Record<string, string>>(
    (next, [key, value]) => {
      if (!key.startsWith(prefixWithSeparator)) {
        next[key] = value;
        return next;
      }

      const remainder = key.slice(prefixWithSeparator.length);
      const separatorIndex = remainder.indexOf("_");
      const itemIndex = Number.parseInt(remainder.slice(0, separatorIndex), 10);
      if (!Number.isInteger(itemIndex) || separatorIndex === -1) {
        next[key] = value;
        return next;
      }
      if (itemIndex < removedIndex) {
        next[key] = value;
      } else if (itemIndex > removedIndex) {
        next[
          `${prefix}_${itemIndex - 1}_${remainder.slice(separatorIndex + 1)}`
        ] = value;
      }
      return next;
    },
    {}
  );
}

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();

  const router = useRouter();
  const { locale } = useLocale();
  const msg = onboardingMessages[locale];
  const { mode, step } = useLocalSearchParams<{
    mode?: string;
    step?: string | string[];
  }>();
  const isEditMode = mode === "edit";
  const routerRef = useRef(router);
  const routeStep = parseOnboardingStep(step);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(routeStep);
  const [form, setForm] = useState<ProfileDraft>(createOnboardingForm);
  const [options, setOptions] = useState<AcademicRegistrationOptions | null>(
    null
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isPolicyVisible, setPolicyVisible] = useState(false);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<{
    index: number;
    value: string;
    kind: "certificate" | "experience";
    field?: "startedAt" | "endedAt";
  } | null>(null);
  const [today] = useState(() => new Date());
  const persistenceCoordinator = useRef(new ProfilePersistenceCoordinator());
  const demoBypassEnabled = authEnvironment.isDemoEnabled();
  const reduceMotion = useReducedMotionPreference();
  const initialLoadPending = isLoadingProfile && options === null;
  const leaveRegistration = useCallback(() => {
    if (isEditMode) {
      router.back();
      return;
    }
    Alert.alert(msg.cancelRegistrationTitle, msg.cancelRegistrationMessage, [
      { text: msg.cancel, style: "cancel" },
      {
        text: msg.cancelRegistration,
        style: "destructive",
        onPress: () =>
          void authService.signOut().then(() => router.replace("/")),
      },
    ]);
  }, [
    isEditMode,
    msg.cancel,
    msg.cancelRegistration,
    msg.cancelRegistrationMessage,
    msg.cancelRegistrationTitle,
    router,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (initialLoadPending || isSubmitting) return true;
        if (isEditMode) {
          router.back();
          return true;
        }
        if (currentStep > 1) {
          setCurrentStep((currentStep - 1) as OnboardingStep);
          return true;
        }
        leaveRegistration();
        return true;
      }
    );
    return () => subscription.remove();
  }, [
    currentStep,
    initialLoadPending,
    isEditMode,
    isSubmitting,
    leaveRegistration,
    router,
  ]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoadError(false);
      setIsLoadingProfile(true);
      try {
        if (demoBypassEnabled) {
          if (active) {
            setOptions({
              occupations: [
                {
                  id: "student",
                  name: locale === "th" ? "นิสิต" : "Student",
                  requiresStudentId: true,
                },
              ],
              faculties: [
                {
                  id: "engineering",
                  name: locale === "th" ? "วิศวกรรมศาสตร์" : "Engineering",
                  departments: [
                    {
                      id: "sake",
                      name:
                        locale === "th"
                          ? "วิศวกรรมซอฟต์แวร์และความรู้"
                          : "Software and Knowledge Engineering",
                    },
                  ],
                },
              ],
            });
            setForm(createOnboardingForm());
          }
          return;
        }

        const session = await authService.getSession();
        if (!session) throw new Error("No active session");
        const api = await authService.getStudentApi();
        const experiencesPromise =
          typeof api.listExperience === "function"
            ? api.listExperience().catch((error) => {
                if (error instanceof ApiError && error.status === 404)
                  return [];
                throw error;
              })
            : Promise.resolve([]);
        const [
          academicOptions,
          status,
          profile,
          certificates,
          portfolio,
          experiences,
        ] = await Promise.all([
          api.getAcademicRegistrationOptions(),
          api.getAcademicRegistrationStatus(),
          api.getProfile(),
          api.listCertificates(),
          api.listPortfolio(),
          experiencesPromise,
        ]);
        const mappedForm = profileModule.mapProfileRecordsToDraft({
          profile,
          status,
          options: academicOptions,
          certificates,
          portfolio,
          experiences,
          fallbackName: session.user.name,
          fallbackImage: session.user.image ?? "",
        });

        if (active) {
          setOptions(academicOptions);
          setForm(mappedForm);
        }
      } catch (error) {
        if (error instanceof AuthError && error.code === "SESSION_EXPIRED") {
          await authService.signOut().catch(() => undefined);
          if (active) routerRef.current.replace("/");
          return;
        }
        if (active) setLoadError(true);
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [
    demoBypassEnabled,
    loadAttempt,
    locale,
    msg.loadingProfile,
    msg.submitErrorMsg,
  ]);

  const occupationOptions = (options?.occupations ?? []).map((occupation) => ({
    label: occupation.name,
    value: occupation.id,
  }));
  const selectedOccupation = options?.occupations.find(
    (occupation) => occupation.id === form.occupation
  );
  const selectedFaculty = options?.faculties.find(
    (faculty) => faculty.id === form.faculty
  );
  const facultyOptions = (options?.faculties ?? []).map((faculty) => ({
    label: faculty.name,
    value: faculty.id,
  }));
  const departmentOptions = (selectedFaculty?.departments ?? []).map(
    (department) => ({
      label: department.name,
      value: department.id,
    })
  );
  const clearErrors = (...keys: string[]) => {
    setErrors((previous) => {
      let changed = false;
      const next = { ...previous };
      keys.forEach((key) => {
        if (key in next) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  };

  const clearRemovedItemErrors = (prefix: string, index: number) => {
    setErrors((previous) => removeIndexedErrors(previous, prefix, index));
  };

  const handleOccupationChange = (occupation: string) => {
    const requiresStudentId =
      options?.occupations.find((item) => item.id === occupation)
        ?.requiresStudentId ?? false;
    setForm((previous) => ({
      ...previous,
      occupation,
      ...(requiresStudentId ? {} : { studentId: "" }),
    }));
    clearErrors("occupation", "studentId");
  };

  const handleFacultyChange = (faculty: string) => {
    setForm((previous) => ({ ...previous, faculty, department: "" }));
    clearErrors("faculty", "department");
  };

  const handleDepartmentChange = (department: string) => {
    setForm((previous) => ({ ...previous, department }));
    clearErrors("department");
  };

  const validate = () => {
    const newErrors = validateProfileBasics(
      form,
      isEditMode,
      msg,
      selectedOccupation?.requiresStudentId ?? false
    );
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = validateProfileDetails(form, msg);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      onboardingDebug("save validation failed", {
        fields: Object.keys(newErrors),
      });
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (demoBypassEnabled) {
        router.replace(isEditMode ? "/(tabs)/profile" : "/(tabs)");
        return;
      }

      const session = await authService.getSession();
      if (!session) throw new Error("No active session");
      const api = await authService.getStudentApi();
      const result = await persistenceCoordinator.current.save(
        api,
        form,
        isEditMode,
        process.env.EXPO_PUBLIC_TERMS_VERSION
      );
      setForm(result.draft);
      if (isEditMode) router.replace("/(tabs)/profile");
      else router.replace("/");
    } catch (error) {
      if (error instanceof AuthError && error.code === "SESSION_EXPIRED") {
        await authService.signOut().catch(() => undefined);
        router.replace("/");
        return;
      }
      if (error instanceof ProfilePersistenceError) {
        setForm(error.draft);
        if (error.partial) {
          setSubmitError(`${msg.submitErrorMsg} ${msg.partialSaveMsg}`);
        } else {
          setSubmitError(
            msg.submitErrorMsg || "Failed to save data. Please try again."
          );
        }
      } else {
        setSubmitError(
          error instanceof Error &&
            error.message.includes("EXPO_PUBLIC_TERMS_VERSION")
            ? error.message
            : msg.submitErrorMsg || "Failed to save data. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async (
    onSelected: (uri: string) => void,
    aspect: [number, number]
  ) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect,
        quality: 0.5,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setRetryAction(() => () => void handlePickImage(onSelected, aspect));
        setModalVisible(true);
        return;
      }
      onSelected(asset.uri);
    } catch {
      setSubmitError(msg.submitErrorMsg);
    }
  };

  const handleDateChange = (
    event: DateTimePickerChangeEvent,
    selectedDate?: Date
  ) => {
    if (!selectedDate || !datePickerTarget) {
      setDatePickerTarget(null);
      return;
    }
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const date =
      datePickerTarget.kind === "experience"
        ? `${year}-${month}-01`
        : `${year}-${month}-${day}`;
    if (datePickerTarget.kind === "certificate")
      handleUpdateCertificate(datePickerTarget.index, "issuedAt", date);
    else if (datePickerTarget.field)
      handleUpdateExperience(
        datePickerTarget.index,
        datePickerTarget.field,
        date
      );
    setDatePickerTarget(null);
  };

  const openDatePicker = (index: number, value: string) => {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date();
    setDatePickerTarget({
      index,
      value: Number.isNaN(parsed.getTime())
        ? new Date().toISOString()
        : parsed.toISOString(),
      kind: "certificate",
    });
  };

  const openExperienceDatePicker = (
    index: number,
    field: "startedAt" | "endedAt",
    value: string
  ) => {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date();
    setDatePickerTarget({
      index,
      field,
      value: Number.isNaN(parsed.getTime())
        ? new Date().toISOString()
        : parsed.toISOString(),
      kind: "experience",
    });
  };

  const handleUpdateCertificate = (
    index: number,
    field: keyof Certificate,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      certificates: previous.certificates.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
    clearErrors(`cert_${index}_${String(field)}`);
  };
  const handleUpdateWork = (
    index: number,
    field: keyof Work,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      works: previous.works.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
    clearErrors(`work_${index}_${String(field)}`);
  };
  const handleUpdateExperience = (
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      experiences: previous.experiences.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
    clearErrors(`experience_${index}_${String(field)}`);
  };

  const removeExperienceNow = (index: number) => {
    const experience = form.experiences[index];
    if (experience?.id)
      persistenceCoordinator.current.markExperienceDeleted(experience.id);
    clearRemovedItemErrors("experience", index);
    setForm((previous) => ({
      ...previous,
      experiences: previous.experiences.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const removeExperience = (index: number) => {
    const experience = form.experiences[index];
    if (!experience?.id) {
      removeExperienceNow(index);
      return;
    }
    Alert.alert(msg.confirmDeleteTitle, msg.confirmDeleteMessage, [
      { text: msg.cancel, style: "cancel" },
      {
        text: msg.confirm,
        style: "destructive",
        onPress: () => removeExperienceNow(index),
      },
    ]);
  };

  const removeCertificate = (index: number) => {
    const certificate = form.certificates[index];
    try {
      if (certificate?.id) {
        persistenceCoordinator.current.markCertificateDeleted(certificate.id);
      }
      clearRemovedItemErrors("cert", index);
      setForm((previous) => ({
        ...previous,
        certificates: previous.certificates.filter(
          (_, itemIndex) => itemIndex !== index
        ),
      }));
    } catch {
      setSubmitError(msg.submitErrorMsg);
    }
  };

  const removeWork = (index: number) => {
    const work = form.works[index];
    try {
      if (work?.id) {
        persistenceCoordinator.current.markPortfolioDeleted(work.id);
      }
      clearRemovedItemErrors("work", index);
      setForm((previous) => ({
        ...previous,
        works: previous.works.filter((_, itemIndex) => itemIndex !== index),
      }));
    } catch {
      setSubmitError(msg.submitErrorMsg);
    }
  };

  if (initialLoadPending) {
    return (
      <OnboardingSkeleton
        currentStep={currentStep}
        loadingLabel={msg.loadingProfile}
      />
    );
  }

  if (loadError && options === null) {
    return (
      <SafeAreaView className={styles.safeArea}>
        <View className={styles.loadErrorCard} accessibilityRole="alert">
          <CircleAlert size={24} color={colors.danger} strokeWidth={2} />
          <Text className={styles.submitErrorText}>{msg.loadError}</Text>
          <Pressable
            accessibilityRole="button"
            className={styles.addMoreBtn}
            onPress={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            <Text className={styles.addMoreBtnText}>{msg.retrySubmitBtn}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 1 && <>
            <Input
              label={msg.nameSurname}
              placeholder={msg.nameSurnamePlaceholder}
              value={form.name}
              onChangeText={(name) => {
                setForm((previous) => ({ ...previous, name }));
                clearErrors('name');
              }}
              error={errors.name}
            />
            <Input
              label={msg.telephone}
              placeholder={msg.telephonePlaceholder}
              value={form.telephone}
              onChangeText={(telephone) => {
                setForm((previous) => ({ ...previous, telephone }));
                clearErrors('telephone');
              }}
              keyboardType="phone-pad"
              error={errors.telephone}
            />
            <Select
              label={msg.occupation}
              placeholder={msg.occupationPlaceholder}
              options={occupationOptions}
              searchable
              dropdown
              searchPlaceholder={msg.searchOccupation}
              noResultsMessage={msg.noSearchResults}
              emptyMessage={msg.noSelectOptions}
              loadingMessage={msg.loadingOptions}
              clearSearchLabel={msg.clearSearch}
              value={form.occupation}
              onValueChange={handleOccupationChange}
              error={errors.occupation}
              closeLabel={msg.closeSelect}
            />
            {selectedOccupation?.requiresStudentId && <Input
              label={msg.studentId}
              placeholder={msg.studentIdPlaceholder}
              value={form.studentId}
              onChangeText={(studentId) => {
                setForm((previous) => ({ ...previous, studentId }));
                clearErrors('studentId');
              }}
              error={errors.studentId}
            />}
            <Select
              label={msg.faculty}
              placeholder={msg.facultyPlaceholder}
              options={facultyOptions}
              value={form.faculty}
              onValueChange={handleFacultyChange}
              error={errors.faculty}
              searchable
              dropdown
              searchPlaceholder={msg.searchFaculty}
              noResultsMessage={msg.noSearchResults}
              emptyMessage={msg.noSelectOptions}
              loadingMessage={msg.loadingOptions}
              clearSearchLabel={msg.clearSearch}
              closeLabel={msg.closeSelect}
            />
            <Select
              label={msg.department}
              placeholder={form.faculty ? msg.departmentPlaceholder : msg.departmentSelectFacultyFirst}
              options={departmentOptions}
              value={form.department}
              onValueChange={handleDepartmentChange}
              error={errors.department}
              searchable
              dropdown
              disabled={!form.faculty}
              searchPlaceholder={msg.searchDepartment}
              noResultsMessage={msg.noSearchResults}
              emptyMessage={msg.noSelectOptions}
              loadingMessage={msg.loadingOptions}
              clearSearchLabel={msg.clearSearch}
              closeLabel={msg.closeSelect}
            />
            <Text className={styles.termsLabel}>{msg.termsAndConditions}</Text>
            <View className={styles.policySummary}>
              <Text className={styles.policySummaryTitle}>{msg.privacyPolicy}</Text>
              <Text className={styles.policySummaryText}>{msg.privacySummary}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={msg.addImage}
                className={styles.avatarPlaceholder}
                onPress={() =>
                  void handlePickImage(
                    (uri) =>
                      setForm((previous) => ({
                        ...previous,
                        profileImage: uri,
                      })),
                    [1, 1]
                  )
                }
              >
                {form.profileImage ? (
                  <Image
                    source={{ uri: form.profileImage }}
                    className={styles.avatarImage}
                  />
                ) : (
                  <UserRound
                    size={40}
                    color={colors.textMuted}
                    strokeWidth={2}
                  />
                )}
                <View className={styles.editBadge}>
                  <Pencil size={16} color={colors.white} strokeWidth={2} />
                </View>
              </Pressable>
            </View>
          </>}

          {submitError && currentStep !== 3 ? (
            <View className={styles.submitErrorCard} accessibilityRole="alert">
              <CircleAlert size={20} color={colors.danger} strokeWidth={2} />
              <Text className={styles.submitErrorText}>{submitError}</Text>
            </View>
          ) : null}

          <MotionView
            key={`step-content-${currentStep}`}
            entering={getOnboardingTransition("in", reduceMotion)}
            className={currentStep === 3 ? "w-full" : styles.formSection}
          >
            {currentStep === 1 && (
              <>
                <Input
                  label={msg.nameSurname}
                  placeholder={msg.nameSurnamePlaceholder}
                  value={form.name}
                  onChangeText={(name) => {
                    setForm((previous) => ({ ...previous, name }));
                    clearErrors("name");
                  }}
                  error={errors.name}
                />
                <Input
                  label={msg.telephone}
                  placeholder={msg.telephonePlaceholder}
                  value={form.telephone}
                  onChangeText={(telephone) => {
                    setForm((previous) => ({ ...previous, telephone }));
                    clearErrors("telephone");
                  }}
                  keyboardType="phone-pad"
                  error={errors.telephone}
                />
                <Select
                  label={msg.occupation}
                  placeholder={msg.occupationPlaceholder}
                  options={occupationOptions}
                  value={form.occupation}
                  onValueChange={handleOccupationChange}
                  error={errors.occupation}
                  closeLabel={msg.closeSelect}
                />
                {selectedOccupation?.requiresStudentId && (
                  <Input
                    label={msg.studentId}
                    placeholder={msg.studentIdPlaceholder}
                    value={form.studentId}
                    onChangeText={(studentId) => {
                      setForm((previous) => ({ ...previous, studentId }));
                      clearErrors("studentId");
                    }}
                    error={errors.studentId}
                  />
                )}
                <Select
                  label={msg.faculty}
                  placeholder={msg.facultyPlaceholder}
                  options={facultyOptions}
                  value={form.faculty}
                  onValueChange={handleFacultyChange}
                  error={errors.faculty}
                  searchable
                  searchPlaceholder={msg.searchFaculty}
                  noResultsMessage={msg.noSearchResults}
                  emptyMessage={msg.noSelectOptions}
                  loadingMessage={msg.loadingOptions}
                  clearSearchLabel={msg.clearSearch}
                  closeLabel={msg.closeSelect}
                />
                <Select
                  label={msg.department}
                  placeholder={
                    form.faculty
                      ? msg.departmentPlaceholder
                      : msg.departmentSelectFacultyFirst
                  }
                  options={departmentOptions}
                  value={form.department}
                  onValueChange={handleDepartmentChange}
                  error={errors.department}
                  searchable
                  disabled={!form.faculty}
                  searchPlaceholder={msg.searchDepartment}
                  noResultsMessage={msg.noSearchResults}
                  emptyMessage={msg.noSelectOptions}
                  loadingMessage={msg.loadingOptions}
                  clearSearchLabel={msg.clearSearch}
                  closeLabel={msg.closeSelect}
                />
                <Text className={styles.termsLabel}>
                  {msg.termsAndConditions}
                </Text>
                <View className={styles.policySummary}>
                  <Text className={styles.policySummaryTitle}>
                    {msg.privacyPolicy}
                  </Text>
                  <Text className={styles.policySummaryText}>
                    {msg.privacySummary}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={msg.readFullPolicy}
                    className={styles.policyReadAction}
                    onPress={() => setPolicyVisible(true)}
                  >
                    <Text className={styles.policyReadActionText}>
                      {msg.readFullPolicy}
                    </Text>
                  </Pressable>
                </View>
                <Checkbox
                  label={msg.acceptTerms}
                  checked={form.acceptedTerms}
                  onChange={(acceptedTerms) => {
                    setForm((previous) => ({ ...previous, acceptedTerms }));
                    clearErrors("acceptedTerms");
                  }}
                  error={errors.acceptedTerms}
                />
              </>
            )}

            {currentStep === 2 && (
              <>
                <View className={styles.step2Intro}>
                  <Text className={styles.step2CardTitle}>
                    {msg.aboutYourself}
                  </Text>
                  <Text className={styles.step2CardSubtitle}>
                    {msg.aboutYourselfSub}
                  </Text>
                </View>
                <TextArea
                  label={msg.descriptionLabel}
                  placeholder={msg.descriptionPlaceholder}
                  value={form.description}
                  onChangeText={(description) => {
                    setForm((previous) => ({ ...previous, description }));
                    clearErrors("description");
                  }}
                  maxLength={1000}
                />
              </>
            )}

            {currentStep === 3 && (
              <>
                <Text className={styles.sectionDesc}>{msg.step3Desc}</Text>
                <View className={styles.step3Section}>
                  <View className={styles.sectionHeader}>
                    <Text className={styles.sectionTitle}>
                      {msg.certification}
                    </Text>
                  </View>
                  <Text className={styles.sectionDesc}>{msg.certDesc}</Text>
                  {form.certificates.map((cert, index) => (
                    <MotionView
                      key={`cert-${cert.id ?? index}`}
                      entering={getOnboardingTransition("in", reduceMotion)}
                      exiting={getOnboardingTransition("out", reduceMotion)}
                      layout={
                        reduceMotion ? undefined : Reanimated.LinearTransition
                      }
                      className={styles.itemCard}
                    >
                      <View className={styles.itemCardHeader}>
                        <Text className={styles.itemLabel}>
                          {msg.certification}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={msg.removeCertificate(index + 1)}
                          onPress={() => removeCertificate(index)}
                          className={styles.removeButton}
                        >
                          <Trash2
                            size={18}
                            color={colors.danger}
                            strokeWidth={2}
                          />
                        </Pressable>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={msg.addImage}
                        className={cn(
                          styles.imageUploadBox,
                          styles.certificateImageBox
                        )}
                        onPress={() =>
                          void handlePickImage(
                            (uri) =>
                              handleUpdateCertificate(index, "imageUri", uri),
                            [4, 3]
                          )
                        }
                      >
                        {cert.imageUri ? (
                          <Image
                            source={{ uri: cert.imageUri }}
                            className={styles.uploadedImage}
                          />
                        ) : (
                          <View className={styles.imagePlaceholderContent}>
                            <ImageIcon
                              size={24}
                              color={colors.textMuted}
                              strokeWidth={2}
                            />
                            <Text className={styles.addImgText}>
                              {msg.addImage}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                      <Input
                        label={msg.certName}
                        placeholder={msg.certName}
                        value={cert.name}
                        onChangeText={(value) =>
                          handleUpdateCertificate(index, "name", value)
                        }
                        error={errors[`cert_${index}_name`]}
                      />
                      <Input
                        label={msg.certIssuer}
                        placeholder={msg.certIssuer}
                        value={cert.issuer}
                        onChangeText={(value) =>
                          handleUpdateCertificate(index, "issuer", value)
                        }
                        error={errors[`cert_${index}_issuer`]}
                      />
                      <View className={styles.dateInputWrapper}>
                        <Text className={styles.dateInputLabel}>
                          {msg.certIssuedAt}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${msg.certIssuedAt}: ${formatDate(cert.issuedAt, locale) || msg.selectDate}`}
                          accessibilityState={{
                            expanded: datePickerTarget?.index === index,
                          }}
                          className={cn(
                            styles.dateInputBox,
                            errors[`cert_${index}_issuedAt`]
                              ? styles.dateInputError
                              : null
                          )}
                          onPress={() => openDatePicker(index, cert.issuedAt)}
                        >
                          <Text
                            className={
                              cert.issuedAt
                                ? styles.dateInputTextActive
                                : styles.dateInputTextPlaceholder
                            }
                          >
                            {formatDate(cert.issuedAt, locale) ||
                              msg.selectDate}
                          </Text>
                          <CalendarDays
                            size={18}
                            color={colors.textMuted}
                            strokeWidth={2}
                          />
                        </Pressable>
                        {errors[`cert_${index}_issuedAt`] ? (
                          <Text className={styles.fieldErrorText}>
                            {errors[`cert_${index}_issuedAt`]}
                          </Text>
                        ) : null}
                      </View>
                    </MotionView>
                  ))}
                  {form.certificates.length === 0 ? (
                    <View className={styles.emptySection}>
                      <Text className={styles.emptySectionText}>
                        {msg.optionalEmpty}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={msg.addMoreCert}
                    className={styles.addMoreBtn}
                    onPress={() =>
                      setForm((previous) => ({
                        ...previous,
                        certificates: [
                          ...previous.certificates,
                          createEmptyCertificate(),
                        ],
                      }))
                    }
                  >
                    <Text className={styles.addMoreBtnText}>
                      {msg.addMoreCert}
                    </Text>
                  </Pressable>
                </View>
                <View className={styles.step3Section}>
                  <View className={styles.sectionHeader}>
                    <Text className={styles.sectionTitle}>
                      {msg.experience}
                    </Text>
                  </View>
                  <Text className={styles.sectionDesc}>{msg.expDesc}</Text>
                  {form.experiences.map((experience, index) => (
                    <MotionView
                      key={`experience-${experience.id ?? index}`}
                      entering={getOnboardingTransition("in", reduceMotion)}
                      exiting={getOnboardingTransition("out", reduceMotion)}
                      layout={
                        reduceMotion ? undefined : Reanimated.LinearTransition
                      }
                      className={styles.itemCard}
                    >
                      <View className={styles.itemCardHeader}>
                        <Text className={styles.itemLabel}>
                          {msg.experience}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={msg.removeExperience(index + 1)}
                          onPress={() => removeExperience(index)}
                          className={styles.removeButton}
                        >
                          <Trash2
                            size={18}
                            color={colors.danger}
                            strokeWidth={2}
                          />
                        </Pressable>
                      </View>
                      <Input
                        label={msg.jobTitle}
                        placeholder={msg.jobTitle}
                        value={experience.title}
                        onChangeText={(value) =>
                          handleUpdateExperience(index, "title", value)
                        }
                        error={errors[`experience_${index}_title`]}
                      />
                      <Select
                        label={msg.employmentType}
                        placeholder={msg.employmentTypePlaceholder}
                        options={msg.employmentTypes}
                        value={experience.employmentType}
                        onValueChange={(value) =>
                          handleUpdateExperience(index, "employmentType", value)
                        }
                        error={errors[`experience_${index}_employmentType`]}
                        closeLabel={msg.closeSelect}
                      />
                      <Input
                        label={msg.organization}
                        placeholder={msg.organization}
                        value={experience.organization}
                        onChangeText={(value) =>
                          handleUpdateExperience(index, "organization", value)
                        }
                      />
                      <TextArea
                        label={msg.experienceDescriptionLabel}
                        placeholder={msg.experienceDescriptionPlaceholder}
                        value={experience.description}
                        onChangeText={(value) =>
                          handleUpdateExperience(index, "description", value)
                        }
                        maxLength={1000}
                      />
                      <View className={styles.dateInputWrapper}>
                        <Text className={styles.dateInputLabel}>
                          {msg.startMonthYear}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            formatMonthYear(experience.startedAt, locale) ||
                            msg.startMonthYear
                          }
                          className={cn(
                            styles.dateInputBox,
                            errors[`experience_${index}_startedAt`]
                              ? styles.dateInputError
                              : null
                          )}
                          onPress={() =>
                            openExperienceDatePicker(
                              index,
                              "startedAt",
                              experience.startedAt
                            )
                          }
                        >
                          <Text
                            className={
                              experience.startedAt
                                ? styles.dateInputTextActive
                                : styles.dateInputTextPlaceholder
                            }
                          >
                            {formatMonthYear(experience.startedAt, locale) ||
                              msg.startMonthYear}
                          </Text>
                          <CalendarDays
                            size={18}
                            color={colors.textMuted}
                            strokeWidth={2}
                          />
                        </Pressable>
                        {errors[`experience_${index}_startedAt`] ? (
                          <Text className={styles.fieldErrorText}>
                            {errors[`experience_${index}_startedAt`]}
                          </Text>
                        ) : null}
                      </View>
                      <View className={styles.dateInputWrapper}>
                        <Text className={styles.dateInputLabel}>
                          {msg.endMonthYear}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            formatMonthYear(experience.endedAt, locale) ||
                            msg.present
                          }
                          className={cn(
                            styles.dateInputBox,
                            errors[`experience_${index}_endedAt`]
                              ? styles.dateInputError
                              : null
                          )}
                          onPress={() =>
                            openExperienceDatePicker(
                              index,
                              "endedAt",
                              experience.endedAt
                            )
                          }
                        >
                          <Text
                            className={
                              experience.endedAt
                                ? styles.dateInputTextActive
                                : styles.dateInputTextPlaceholder
                            }
                          >
                            {formatMonthYear(experience.endedAt, locale) ||
                              msg.present}
                          </Text>
                          <CalendarDays
                            size={18}
                            color={colors.textMuted}
                            strokeWidth={2}
                          />
                        </Pressable>
                        {experience.endedAt ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={msg.present}
                            onPress={() =>
                              handleUpdateExperience(index, "endedAt", "")
                            }
                          >
                            <Text className={styles.addImgText}>
                              {msg.present}
                            </Text>
                          </Pressable>
                        ) : null}
                        {errors[`experience_${index}_endedAt`] ? (
                          <Text className={styles.fieldErrorText}>
                            {errors[`experience_${index}_endedAt`]}
                          </Text>
                        ) : null}
                      </View>
                    </MotionView>
                  ))}
                  {form.experiences.length === 0 ? (
                    <View className={styles.emptySection}>
                      <Text className={styles.emptySectionText}>
                        {msg.optionalEmpty}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={msg.addMoreExp}
                    className={styles.addMoreBtn}
                    onPress={() =>
                      setForm((previous) => ({
                        ...previous,
                        experiences: [
                          ...previous.experiences,
                          createEmptyExperience(),
                        ],
                      }))
                    }
                  >
                    <Text className={styles.addMoreBtnText}>
                      {msg.addMoreExp}
                    </Text>
                  </Pressable>
                </View>
                <View className={styles.step3Section}>
                  <View className={styles.sectionHeader}>
                    <Text className={styles.sectionTitle}>{msg.myWorks}</Text>
                  </View>
                  <Text className={styles.sectionDesc}>{msg.workDesc}</Text>
                  {form.works.map((work, index) => (
                    <MotionView
                      key={`work-${work.id ?? index}`}
                      entering={getOnboardingTransition("in", reduceMotion)}
                      exiting={getOnboardingTransition("out", reduceMotion)}
                      layout={
                        reduceMotion ? undefined : Reanimated.LinearTransition
                      }
                      className={styles.itemCard}
                    >
                      <View className={styles.itemCardHeader}>
                        <Text className={styles.itemLabel}>{msg.myWorks}</Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={msg.removeWork(index + 1)}
                          onPress={() => removeWork(index)}
                          className={styles.removeButton}
                        >
                          <Trash2
                            size={18}
                            color={colors.danger}
                            strokeWidth={2}
                          />
                        </Pressable>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={msg.addImage}
                        className={styles.imageUploadBox}
                        onPress={() =>
                          void handlePickImage(
                            (uri) => handleUpdateWork(index, "imageUri", uri),
                            [4, 3]
                          )
                        }
                      >
                        {work.imageUri ? (
                          <Image
                            source={{ uri: work.imageUri }}
                            className={styles.uploadedImage}
                          />
                        ) : (
                          <View className={styles.imagePlaceholderContent}>
                            <ImageIcon
                              size={24}
                              color={colors.textMuted}
                              strokeWidth={2}
                            />
                            <Text className={styles.addImgText}>
                              {msg.addImage}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                      <Input
                        label={msg.workTitle}
                        placeholder={msg.workTitle}
                        value={work.title}
                        onChangeText={(title) =>
                          handleUpdateWork(index, "title", title)
                        }
                        error={errors[`work_${index}_title`]}
                      />
                      <TextArea
                        label={msg.workDetailLabel}
                        accessibilityLabel={msg.workDetailLabel}
                        placeholder={msg.detailProject}
                        value={work.detail}
                        onChangeText={(detail) =>
                          handleUpdateWork(index, "detail", detail)
                        }
                        maxLength={1000}
                      />
                    </MotionView>
                  ))}
                  {form.works.length === 0 ? (
                    <View className={styles.emptySection}>
                      <Text className={styles.emptySectionText}>
                        {msg.optionalEmpty}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={msg.addMoreWorks}
                    className={styles.addMoreBtn}
                    onPress={() =>
                      setForm((previous) => ({
                        ...previous,
                        works: [...previous.works, createEmptyWork()],
                      }))
                    }
                  >
                    <Text className={styles.addMoreBtnText}>
                      {msg.addMoreWorks}
                    </Text>
                  </Pressable>
                </View>
                {submitError && (
                  <View
                    className={styles.submitErrorCard}
                    accessibilityRole="alert"
                  >
                    <CircleAlert
                      size={20}
                      color={colors.danger}
                      strokeWidth={2}
                    />
                    <Text className={styles.submitErrorText}>
                      {submitError}
                    </Text>
                  </View>
                )}
              </>
            )}
          </MotionView>
        </ScrollView>
        <View className={styles.actionBar}>
          {isSubmitting ? (
            <Text
              accessibilityLiveRegion="polite"
              className={styles.savingStatus}
            >
              {msg.savingStatus}
            </Text>
          ) : null}
          <View className={styles.actionButtons}>
            <View className={styles.actionButton}>
              <Button
                variant="secondary"
                accessibilityLabel={
                  currentStep === 1 && !isEditMode
                    ? msg.cancelRegistration
                    : msg.back
                }
                onPress={() => {
                  if (currentStep === 1) {
                    leaveRegistration();
                  } else {
                    setCurrentStep(
                      (stepValue) => (stepValue - 1) as OnboardingStep
                    );
                  }
                }}
                disabled={isSubmitting}
              >
                {currentStep === 1 && !isEditMode
                  ? msg.cancelRegistration
                  : msg.back}
              </Button>
            </View>
            <View className={styles.actionButton}>
              <Button
                accessibilityLabel={
                  currentStep === 1 || currentStep === 2
                    ? msg.next
                    : isSubmitting
                      ? msg.submitting
                      : submitError
                        ? msg.retrySubmitBtn
                        : isEditMode
                          ? msg.saveChanges
                          : msg.completeBtn
                }
                onPress={() => {
                  if (currentStep === 1) {
                    if (validate()) setCurrentStep(2);
                  } else if (currentStep === 2) {
                    setCurrentStep(3);
                  } else {
                    void handleComplete();
                  }
                }}
                disabled={isSubmitting}
              >
                {currentStep === 1 || currentStep === 2
                  ? msg.next
                  : isSubmitting
                    ? msg.submitting
                    : submitError
                      ? msg.retrySubmitBtn
                      : isEditMode
                        ? msg.saveChanges
                        : msg.completeBtn}
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      {datePickerTarget ? (
        <DateTimePicker
          value={new Date(datePickerTarget.value)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={handleDateChange}
          onDismiss={() => setDatePickerTarget(null)}
          maximumDate={today}
        />
      ) : null}
      <FileTooLargeModal
        visible={isModalVisible}
        onBack={() => setModalVisible(false)}
        onTryAgain={() => {
          setModalVisible(false);
          retryAction?.();
        }}
      />
      <Modal
        visible={isPolicyVisible}
        transparent
        animationType={reduceMotion ? "none" : "slide"}
        onRequestClose={() => setPolicyVisible(false)}
      >
        <View className={styles.policyModalOverlay}>
          <View accessibilityViewIsModal className={styles.policyModalContent}>
            <View className={styles.policyModalHeader}>
              <Text
                accessibilityRole="header"
                className={styles.policyModalTitle}
              >
                {msg.privacyPolicy}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={msg.closePolicy}
                className={styles.policyModalClose}
                onPress={() => setPolicyVisible(false)}
              >
                <X color={colors.textSecondary} size={22} strokeWidth={2} />
              </Pressable>
            </View>
            <ScrollView
              className={styles.policyModalScroll}
              contentContainerClassName={styles.policyModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text className={styles.policyModalText}>
                {msg.privacyPolicyText}
              </Text>
            </ScrollView>
            <View className={styles.policyModalFooter}>
              <Button
                onPress={() => setPolicyVisible(false)}
                accessibilityLabel={msg.closePolicy}
              >
                {msg.closePolicy}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
