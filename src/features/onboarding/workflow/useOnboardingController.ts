import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, BackHandler } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";

import { showConfirmModal } from "@/components/ui/SweetAlert";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useLocale } from "@/features/preferences/localeStore";
import {
  localizeOccupationName,
  onboardingMessages,
} from "@/locales/registrationOnboarding";
import {
  localizeDepartmentName,
  localizeFacultyName,
} from "@/locales/academicUnits";
import { authService } from "@/features/auth/AuthService";
import { clearSessionCache } from "@/features/auth/sessionQueries";
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

export function useOnboardingController() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const messages = onboardingMessages[locale];
  const { mode, step } = useLocalSearchParams<{
    mode?: string;
    step?: string | string[];
  }>();
  const isEditMode = mode === "edit";
  const routerRef = useRef(router);
  const { currentStep, advance, goBack } = useOnboardingWizard(
    parseOnboardingStep(step)
  );
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
    messages,
    onMarkCertificateDeleted: persistence.markCertificateDeleted,
    onMarkExperienceDeleted: persistence.markExperienceDeleted,
    onMarkPortfolioDeleted: persistence.markPortfolioDeleted,
  });
  const { form } = formState;
  const selectedOccupation = options?.occupations.find(
    (occupation) => occupation.id === form.occupation
  );
  const selectedFaculty = options?.faculties.find(
    (faculty) => faculty.id === form.faculty
  );
  const datePicker = useOnboardingDatePicker({
    onCertificateDate: (index, value) =>
      formState.updateCertificate(index, "issuedAt", value),
    onExperienceDate: (index, field, value) =>
      formState.updateExperience(index, field, value),
  });
  const imagePicker = useOnboardingImagePicker({
    onError: () => setSubmitError(messages.submitErrorMsg),
  });
  const reduceMotion = useReducedMotionPreference();
  const initialLoadPending =
    onboardingQuery.isPending && formState.hydrationState === "waiting";

  const leaveRegistration = useCallback(() => {
    if (isEditMode) {
      router.back();
      return;
    }
    showConfirmModal({
      title: messages.cancelRegistrationTitle,
      message: messages.cancelRegistrationMessage,
      cancelLabel: messages.cancel,
      confirmLabel: messages.cancelRegistration,
      onConfirm: () =>
        void authService.signOut().then(() => {
          clearSessionCache(queryClient);
          router.replace("/");
        }),
    });
  }, [
    isEditMode,
    messages.cancel,
    messages.cancelRegistration,
    messages.cancelRegistrationMessage,
    messages.cancelRegistrationTitle,
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
    label: localizeOccupationName(occupation.name, locale),
    value: occupation.id,
  }));
  const facultyOptions = (options?.faculties ?? []).map((faculty) => ({
    label: localizeFacultyName(faculty.name, locale),
    value: faculty.id,
  }));
  const departmentOptions = (selectedFaculty?.departments ?? []).map(
    (department) => ({
      label: localizeDepartmentName(department.name, locale),
      value: department.id,
    })
  );

  const handleOccupationChange = (occupation: string) => {
    const requiresStudentId =
      options?.occupations.find((item) => item.id === occupation)
        ?.requiresStudentId ?? false;
    formState.updateField("occupation", occupation);
    if (!requiresStudentId) formState.updateField("studentId", "");
  };

  const handleFacultyChange = (faculty: string) => {
    formState.updateField("faculty", faculty);
    formState.updateField("department", "");
  };

  const validate = () =>
    formState.validateBasics(Boolean(selectedOccupation?.requiresStudentId));

  const validateStepThree = () => {
    const valid = formState.validateDetails();
    if (!valid) {
      onboardingDebug("save validation failed", {
        fields: Object.keys(formState.errors),
      });
    }
    return valid;
  };

  const handleComplete = async () => {
    if (!validateStepThree()) return;
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
            ? `${messages.submitErrorMsg} ${messages.partialSaveMsg}`
            : messages.submitErrorMsg ||
              "Failed to save data. Please try again."
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
      formState.removeExperience(index);
      return;
    }
    showConfirmModal({
      title: messages.confirmDeleteTitle,
      message: messages.confirmDeleteMessage,
      cancelLabel: messages.cancel,
      confirmLabel: messages.confirm,
      onConfirm: () => formState.removeExperience(index),
    });
  };

  const onBackPress = () => {
    if (currentStep === 1 || !goBack()) leaveRegistration();
  };
  const onPrimaryPress = () => {
    if (currentStep === 1) {
      if (validate()) advance();
    } else if (currentStep === 2) {
      advance();
    } else {
      void handleComplete();
    }
  };

  return {
    frame: { messages, locale, isEditMode, currentStep, colors, reduceMotion },
    content: {
      initialLoadPending,
      loadError: onboardingQuery.isError && options === null,
      retryLoad: () => void onboardingQuery.refetch(),
      formProps: {
        messages,
        locale,
        isEditMode,
        currentStep,
        colors,
        reduceMotion,
        formState,
        requiresStudentId: Boolean(selectedOccupation?.requiresStudentId),
        occupationOptions,
        facultyOptions,
        departmentOptions,
        unavailableCollections,
        datePicker,
        imagePicker,
        submitError,
        onOccupationChange: handleOccupationChange,
        onFacultyChange: handleFacultyChange,
        onRemoveExperience: removeExperience,
        onReadPolicy: () => setPolicyVisible(true),
      },
      actionBarProps: {
        messages,
        isEditMode,
        currentStep,
        isSubmitting: persistence.isSubmitting,
        submitError,
        onBackPress,
        onPrimaryPress,
      },
      datePicker,
      imagePicker,
      isPolicyVisible,
      onClosePolicy: () => setPolicyVisible(false),
    },
  };
}
