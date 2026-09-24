import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { CircleAlert, Pencil, UserRound } from "lucide-react-native";
import { Image, Pressable, ScrollView, Text, View } from "@/tw";

import type { OnboardingStep } from "@/features/auth/types";
import type { SupportedLocale } from "@/locales/locale";
import { onboardingMessages } from "@/locales/registrationOnboarding";
import type { UnavailableProfileCollections } from "../profilePersistenceCoordinator";
import type { OnboardingDatePickerState } from "../useOnboardingDatePicker";
import type { OnboardingFormState } from "../useOnboardingForm";
import type { OnboardingImagePickerState } from "../useOnboardingImagePicker";
import { MotionView, getOnboardingTransition } from "./OnboardingMotion";
import { RegistrationStepOne } from "./RegistrationStepOne";
import { RegistrationStepTwo } from "./RegistrationStepTwo";
import { RegistrationStepThree } from "./RegistrationStepThree";
import styles from "../styles/registrationStyles";

type Messages = (typeof onboardingMessages)["en"];
type SelectOption = { label: string; value: string };

export function OnboardingForm({
  messages,
  locale,
  isEditMode,
  currentStep,
  reduceMotion,
  formState,
  requiresStudentId,
  occupationOptions,
  facultyOptions,
  departmentOptions,
  unavailableCollections,
  datePicker,
  imagePicker,
  submitError,
  onOccupationChange,
  onFacultyChange,
  onRemoveExperience,
  onReadPolicy,
}: {
  messages: Messages;
  locale: SupportedLocale;
  currentStep: OnboardingStep;
  isEditMode: boolean;
  reduceMotion: boolean;
  formState: OnboardingFormState;
  requiresStudentId: boolean;
  occupationOptions: SelectOption[];
  facultyOptions: SelectOption[];
  departmentOptions: SelectOption[];
  unavailableCollections: UnavailableProfileCollections;
  datePicker: OnboardingDatePickerState;
  imagePicker: OnboardingImagePickerState;
  submitError: string | null;
  onOccupationChange: (occupation: string) => void;
  onFacultyChange: (faculty: string) => void;
  onRemoveExperience: (index: number) => void;
  onReadPolicy: () => void;
}) {
  const { colors } = useAppTheme();
  const { form, errors } = formState;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName={styles.scrollContent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className={styles.headerSection}>
        <Text className={styles.title}>{messages.title}</Text>
        <Text className={styles.stepTitle}>
          {isEditMode
            ? messages.editProfile
            : currentStep === 1
              ? messages.stepTitle
              : currentStep === 2
                ? messages.step2Title
                : messages.step3Title}
        </Text>
        <Text className={styles.stepIndicator}>
          {currentStep === 1
            ? messages.stepIndicator
            : currentStep === 2
              ? messages.step2Indicator
              : messages.step3Indicator}
        </Text>
        <View
          className={styles.progressContainer}
          accessibilityLabel={messages.progressLabel(currentStep)}
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
        {currentStep === 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.addImage}
            className={styles.avatarPlaceholder}
            onPress={() =>
              void imagePicker.pickImage(
                (uri) => formState.updateField("profileImage", uri),
                [1, 1]
              )
            }
          >
            {form.profileImage ? (
              <Image
                source={{ uri: form.profileImage }}
                className={styles.avatarImage}
                accessibilityRole="image"
                accessibilityLabel={messages.profileImageLabel}
              />
            ) : (
              <UserRound size={40} color={colors.textMuted} strokeWidth={2} />
            )}
            <View className={styles.editBadge}>
              <Pencil size={16} color={colors.onPrimary} strokeWidth={2} />
            </View>
          </Pressable>
        ) : null}
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
        {currentStep === 1 ? (
          <RegistrationStepOne
            messages={messages}
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
            requiresStudentId={requiresStudentId}
            errors={errors}
            onNameChange={(name) => formState.updateField("name", name)}
            onTelephoneChange={(telephone) =>
              formState.updateField("telephone", telephone)
            }
            onOccupationChange={onOccupationChange}
            onStudentIdChange={(studentId) =>
              formState.updateField("studentId", studentId)
            }
            onFacultyChange={onFacultyChange}
            onDepartmentChange={(department) =>
              formState.updateField("department", department)
            }
            onAcceptedTermsChange={(acceptedTerms) =>
              formState.updateField("acceptedTerms", acceptedTerms)
            }
            onReadPolicy={onReadPolicy}
          />
        ) : null}
        {currentStep === 2 ? (
          <RegistrationStepTwo
            messages={messages}
            description={form.description}
            errors={errors}
            onDescriptionChange={(description) =>
              formState.updateField("description", description)
            }
          />
        ) : null}
        {currentStep === 3 ? (
          <RegistrationStepThree
            messages={messages}
            locale={locale}
            certificates={form.certificates}
            experiences={form.experiences}
            works={form.works}
            errors={errors}
            unavailableCollections={unavailableCollections}
            reduceMotion={reduceMotion}
            datePickerIndex={datePicker.datePickerIndex}
            submitError={submitError}
            onUpdateCertificate={formState.updateCertificate}
            onUpdateExperience={formState.updateExperience}
            onUpdateWork={formState.updateWork}
            onPickCertificateImage={(index) =>
              void imagePicker.pickImage(
                (uri) => formState.updateCertificate(index, "imageUri", uri),
                [4, 3]
              )
            }
            onPickWorkImage={(index) =>
              void imagePicker.pickImage(
                (uri) => formState.updateWork(index, "imageUri", uri),
                [4, 3]
              )
            }
            onOpenCertificateDatePicker={datePicker.openCertificate}
            onOpenExperienceDatePicker={datePicker.openExperience}
            onRemoveCertificate={formState.removeCertificate}
            onRemoveExperience={onRemoveExperience}
            onRemoveWork={formState.removeWork}
            onAddCertificate={formState.addCertificate}
            onAddExperience={formState.addExperience}
            onAddWork={formState.addWork}
          />
        ) : null}
      </MotionView>
    </ScrollView>
  );
}
