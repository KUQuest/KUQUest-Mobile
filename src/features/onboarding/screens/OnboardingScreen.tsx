import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  BackHandler,
  Modal,
  Platform,
} from "react-native";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from "@/tw";
import {
  MotionView,
  getOnboardingTransition,
} from "../components/OnboardingMotion";
import { RegistrationStepOne } from "../components/RegistrationStepOne";
import { RegistrationStepTwo } from "../components/RegistrationStepTwo";
import { RegistrationStepThree } from "../components/RegistrationStepThree";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button } from "@/components/ui/Button";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { CircleAlert, Pencil, UserRound, X } from "lucide-react-native";

import styles from "@/features/onboarding/styles/registrationStyles";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { spacing } from "@/theme/spacing";
import { FileTooLargeModal } from "../components/FileTooLargeModal";
import { onboardingMessages } from "../../../locales/registrationOnboarding";
import { useLocale } from "@/features/preferences/localeStore";
import { authService } from "../../auth/AuthService";
import { clearSessionCache } from "../../auth/sessionQueries";
import { type OnboardingStep } from "../../auth/types";
import {
  isOnboardingSessionExpired,
  useOnboardingQuery,
} from "../api/onboardingQueries";
import { parseOnboardingStep } from "../steps";
import { useOnboardingDatePicker } from "../useOnboardingDatePicker";
import { useOnboardingForm } from "../useOnboardingForm";
import { useOnboardingImagePicker } from "../useOnboardingImagePicker";
import { useOnboardingPersistence } from "../useOnboardingPersistence";
import { useOnboardingWizard } from "../useOnboardingWizard";

function onboardingDebug(
  message: string,
  details: Record<string, unknown> = {}
): void {
  if (__DEV__) {
    console.log(`[onboarding] ${message}`, details);
  }
}

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
  const { colors } = useAppTheme();
  const field = (key: string, height = 52) => (
    <View key={key} style={{ gap: spacing.xs }}>
      <SkeletonBlock height={14} width="42%" borderRadius={4} />
      <SkeletonBlock height={height} borderRadius={10} />
    </View>
  );

  return (
    <ScreenLayout
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
    </ScreenLayout>
  );
}

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const msg = onboardingMessages[locale];
  const { mode, step } = useLocalSearchParams<{
    mode?: string;
    step?: string | string[];
  }>();
  const isEditMode = mode === "edit";
  const routerRef = useRef(router);
  const routeStep = parseOnboardingStep(step);
  const { currentStep, advance, goBack } = useOnboardingWizard(routeStep);
  const onboardingQuery = useOnboardingQuery();
  const options = onboardingQuery.data?.options ?? null;
  const unavailableCollections =
    onboardingQuery.data?.unavailableCollections ?? {};
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPolicyVisible, setPolicyVisible] = useState(false);
  const persistence = useOnboardingPersistence({
    isEditMode,
    termsVersion: process.env.EXPO_PUBLIC_TERMS_VERSION,
  });
  const formState = useOnboardingForm({
    serverForm: onboardingQuery.data?.form,
    isEditMode,
    messages: msg,
    onMarkCertificateDeleted: persistence.markCertificateDeleted,
    onMarkExperienceDeleted: persistence.markExperienceDeleted,
    onMarkPortfolioDeleted: persistence.markPortfolioDeleted,
  });
  const {
    form,
    errors,
    updateField,
    updateCertificate,
    updateExperience,
    updateWork,
    removeCertificate,
    removeExperience: removeExperienceNow,
    removeWork,
  } = formState;
  const selectedOccupation = options?.occupations.find(
    (occupation) => occupation.id === form.occupation
  );
  const selectedFaculty = options?.faculties.find(
    (faculty) => faculty.id === form.faculty
  );
  const datePicker = useOnboardingDatePicker({
    onCertificateDate: (index, value) =>
      updateCertificate(index, "issuedAt", value),
    onExperienceDate: (index, field, value) =>
      updateExperience(index, field, value),
  });
  const imagePicker = useOnboardingImagePicker({
    onError: () => setSubmitError(msg.submitErrorMsg),
  });
  const reduceMotion = useReducedMotionPreference();
  const initialLoadPending =
    onboardingQuery.isPending && formState.hydrationState === "waiting";

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
          void authService.signOut().then(() => {
            clearSessionCache(queryClient);
            router.replace("/");
          }),
      },
    ]);
  }, [
    isEditMode,
    msg.cancel,
    msg.cancelRegistration,
    msg.cancelRegistrationMessage,
    msg.cancelRegistrationTitle,
    queryClient,
    router,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (initialLoadPending || persistence.isSubmitting) return true;
        if (isEditMode) {
          router.back();
          return true;
        }
        if (goBack()) return true;
        leaveRegistration();
        return true;
      }
    );
    return () => subscription.remove();
  }, [
    initialLoadPending,
    isEditMode,
    leaveRegistration,
    persistence.isSubmitting,
    router,
    goBack,
  ]);

  useEffect(() => {
    if (!isOnboardingSessionExpired(onboardingQuery.error)) return;
    void authService
      .signOut()
      .catch(() => undefined)
      .then(() => {
        clearSessionCache(queryClient);
        routerRef.current.replace("/");
      });
  }, [onboardingQuery.error, queryClient]);

  const occupationOptions = (options?.occupations ?? []).map((occupation) => ({
    label: occupation.name,
    value: occupation.id,
  }));
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

  const handleOccupationChange = (occupation: string) => {
    const requiresStudentId =
      options?.occupations.find((item) => item.id === occupation)
        ?.requiresStudentId ?? false;
    updateField("occupation", occupation);
    if (!requiresStudentId) updateField("studentId", "");
  };

  const handleFacultyChange = (faculty: string) => {
    updateField("faculty", faculty);
    updateField("department", "");
  };

  const handleDepartmentChange = (department: string) => {
    updateField("department", department);
  };

  const validate = () =>
    formState.validateBasics(Boolean(selectedOccupation?.requiresStudentId));

  const validateStep3 = () => {
    const valid = formState.validateDetails();
    if (!valid) {
      onboardingDebug("save validation failed", {
        fields: Object.keys(formState.errors),
      });
    }
    return valid;
  };
  const isSubmitting = persistence.isSubmitting;

  const handleComplete = async () => {
    if (!validateStep3()) return;
    setSubmitError(null);
    const result = await persistence.save(form, unavailableCollections);
    if (result.kind === "session-expired") {
      router.replace("/");
      return;
    }
    if (result.kind === "failed") {
      if (result.failure.draft) {
        formState.replaceForm(result.failure.draft, true);
      }
      setSubmitError(
        result.failure.error instanceof Error &&
          result.failure.error.message.includes("EXPO_PUBLIC_TERMS_VERSION")
          ? result.failure.error.message
          : result.failure.partial
            ? `${msg.submitErrorMsg} ${msg.partialSaveMsg}`
            : msg.submitErrorMsg || "Failed to save data. Please try again."
      );
      return;
    }
    formState.replaceForm(result.draft, false);
    if (isEditMode) router.replace("/(tabs)/profile");
    else router.replace("/");
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
  if (initialLoadPending) {
    return (
      <OnboardingSkeleton
        currentStep={currentStep}
        loadingLabel={msg.loadingProfile}
      />
    );
  }

  if (onboardingQuery.isError && options === null) {
    return (
      <ScreenLayout className={styles.safeArea}>
        <View className={styles.loadErrorCard} accessibilityRole="alert">
          <CircleAlert size={24} color={colors.danger} strokeWidth={2} />
          <Text className={styles.submitErrorText}>{msg.loadError}</Text>
          <Pressable
            accessibilityRole="button"
            className={styles.addMoreBtn}
            onPress={() => void onboardingQuery.refetch()}
          >
            <Text className={styles.addMoreBtnText}>{msg.retrySubmitBtn}</Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className={styles.safeArea}
    >
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
          <View className={styles.headerSection}>
            <Text className={styles.title}>{msg.title}</Text>
            <Text className={styles.stepTitle}>
              {isEditMode
                ? msg.editProfile
                : currentStep === 1
                  ? msg.stepTitle
                  : currentStep === 2
                    ? msg.step2Title
                    : msg.step3Title}
            </Text>
            <Text className={styles.stepIndicator}>
              {currentStep === 1
                ? msg.stepIndicator
                : currentStep === 2
                  ? msg.step2Indicator
                  : msg.step3Indicator}
            </Text>
            <View
              className={styles.progressContainer}
              accessibilityLabel={msg.progressLabel(currentStep)}
            >
              {[1, 2, 3].map((progressStep) => (
                <View
                  key={progressStep}
                  className={
                    currentStep >= progressStep
                      ? styles.progressBarActive
                      : styles.progressBarInactive
                  }
                />
              ))}
            </View>
            {currentStep === 1 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={msg.addImage}
                className={styles.avatarPlaceholder}
                onPress={() =>
                  void imagePicker.pickImage(
                    (uri) => updateField("profileImage", uri),
                    [1, 1]
                  )
                }
              >
                {form.profileImage ? (
                  <Image
                    source={{ uri: form.profileImage }}
                    className={styles.avatarImage}
                    accessibilityRole="image"
                    accessibilityLabel={msg.profileImageLabel}
                  />
                ) : (
                  <UserRound
                    size={40}
                    color={colors.textMuted}
                    strokeWidth={2}
                  />
                )}
                <View className={styles.editBadge}>
                  <Pencil size={16} color={colors.onPrimary} strokeWidth={2} />
                </View>
              </Pressable>
            )}
          </View>

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
              <RegistrationStepOne
                messages={msg}
                name={form.name}
                telephone={form.telephone}
                occupation={form.occupation}
                studentId={form.studentId}
                faculty={form.faculty}
                department={form.department}
                acceptedTerms={form.acceptedTerms}
                occupationOptions={occupationOptions}
                facultyOptions={facultyOptions}
                departmentOptions={departmentOptions}
                requiresStudentId={Boolean(
                  selectedOccupation?.requiresStudentId
                )}
                errors={errors}
                onNameChange={(name) => updateField("name", name)}
                onTelephoneChange={(telephone) =>
                  updateField("telephone", telephone)
                }
                onOccupationChange={handleOccupationChange}
                onStudentIdChange={(studentId) =>
                  updateField("studentId", studentId)
                }
                onFacultyChange={handleFacultyChange}
                onDepartmentChange={handleDepartmentChange}
                onAcceptedTermsChange={(acceptedTerms) =>
                  updateField("acceptedTerms", acceptedTerms)
                }
                onReadPolicy={() => setPolicyVisible(true)}
              />
            )}
            {currentStep === 2 && (
              <RegistrationStepTwo
                messages={msg}
                description={form.description}
                errors={errors}
                onDescriptionChange={(description) =>
                  updateField("description", description)
                }
              />
            )}

            {currentStep === 3 && (
              <RegistrationStepThree
                messages={msg}
                locale={locale}
                certificates={form.certificates}
                experiences={form.experiences}
                works={form.works}
                errors={errors}
                unavailableCollections={unavailableCollections}
                reduceMotion={reduceMotion}
                datePickerIndex={datePicker.datePickerIndex}
                submitError={submitError}
                onUpdateCertificate={updateCertificate}
                onUpdateExperience={updateExperience}
                onUpdateWork={updateWork}
                onPickCertificateImage={(index) =>
                  void imagePicker.pickImage(
                    (uri) => updateCertificate(index, "imageUri", uri),
                    [4, 3]
                  )
                }
                onPickWorkImage={(index) =>
                  void imagePicker.pickImage(
                    (uri) => updateWork(index, "imageUri", uri),
                    [4, 3]
                  )
                }
                onOpenCertificateDatePicker={datePicker.openCertificate}
                onOpenExperienceDatePicker={datePicker.openExperience}
                onRemoveCertificate={removeCertificate}
                onRemoveExperience={removeExperience}
                onRemoveWork={removeWork}
                onAddCertificate={formState.addCertificate}
                onAddExperience={formState.addExperience}
                onAddWork={formState.addWork}
              />
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
                  if (currentStep === 1 || !goBack()) {
                    leaveRegistration();
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
                    if (validate()) advance();
                  } else if (currentStep === 2) {
                    advance();
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
      {datePicker.target ? (
        <DateTimePicker
          value={new Date(datePicker.target.value)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={datePicker.handleChange}
          onDismiss={datePicker.close}
          maximumDate={datePicker.today}
        />
      ) : null}
      <FileTooLargeModal
        visible={imagePicker.isTooLargeVisible}
        onBack={imagePicker.dismissTooLarge}
        onTryAgain={imagePicker.retry}
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
    </ScreenLayout>
  );
}
