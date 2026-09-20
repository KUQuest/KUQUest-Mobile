import React from "react";
import { CircleAlert } from "lucide-react-native";
import { Text, View } from "@/tw";
import { colors } from "@/theme/colors";

import styles from "@/features/onboarding/styles/registrationStyles";
import type { Certificate, Experience, Work } from "../../profile/types";
import { onboardingMessages } from "../../../locales/registrationOnboarding";
import { CertificatesSection } from "./CertificatesSection";
import { ExperienceSection } from "./ExperienceSection";
import { WorksSection } from "./WorksSection";

type Messages = (typeof onboardingMessages)["en"];
type ExperienceDateField = "startedAt" | "endedAt";

export interface RegistrationStepThreeProps {
  messages: Messages;
  locale: "en" | "th";
  certificates: Certificate[];
  experiences: Experience[];
  works: Work[];
  errors: Record<string, string>;
  unavailableCollections: {
    certificates?: boolean;
    experience?: boolean;
    portfolio?: boolean;
  };
  reduceMotion: boolean;
  datePickerIndex: number | null;
  submitError: string | null;
  onUpdateCertificate: (
    index: number,
    field: keyof Certificate,
    value: string
  ) => void;
  onUpdateExperience: (
    index: number,
    field: keyof Experience,
    value: string
  ) => void;
  onUpdateWork: (index: number, field: keyof Work, value: string) => void;
  onPickCertificateImage: (index: number) => void;
  onPickWorkImage: (index: number) => void;
  onOpenCertificateDatePicker: (index: number, value: string) => void;
  onOpenExperienceDatePicker: (
    index: number,
    field: ExperienceDateField,
    value: string
  ) => void;
  onRemoveCertificate: (index: number) => void;
  onRemoveExperience: (index: number) => void;
  onRemoveWork: (index: number) => void;
  onAddCertificate: () => void;
  onAddExperience: () => void;
  onAddWork: () => void;
}

export function RegistrationStepThree({
  messages: msg,
  locale,
  certificates,
  experiences,
  works,
  errors,
  unavailableCollections,
  reduceMotion,
  datePickerIndex,
  submitError,
  onUpdateCertificate,
  onUpdateExperience,
  onUpdateWork,
  onPickCertificateImage,
  onPickWorkImage,
  onOpenCertificateDatePicker,
  onOpenExperienceDatePicker,
  onRemoveCertificate,
  onRemoveExperience,
  onRemoveWork,
  onAddCertificate,
  onAddExperience,
  onAddWork,
}: RegistrationStepThreeProps) {
  return (
    <>
      <Text className={styles.sectionDesc}>{msg.step3Desc}</Text>
      <CertificatesSection
        messages={msg}
        locale={locale}
        certificates={certificates}
        errors={errors}
        unavailable={Boolean(unavailableCollections.certificates)}
        reduceMotion={reduceMotion}
        datePickerIndex={datePickerIndex}
        onUpdate={onUpdateCertificate}
        onPickImage={onPickCertificateImage}
        onOpenDatePicker={onOpenCertificateDatePicker}
        onRemove={onRemoveCertificate}
        onAdd={onAddCertificate}
      />
      <ExperienceSection
        messages={msg}
        locale={locale}
        experiences={experiences}
        errors={errors}
        unavailable={Boolean(unavailableCollections.experience)}
        reduceMotion={reduceMotion}
        onUpdate={onUpdateExperience}
        onOpenDatePicker={onOpenExperienceDatePicker}
        onRemove={onRemoveExperience}
        onAdd={onAddExperience}
      />
      <WorksSection
        messages={msg}
        works={works}
        errors={errors}
        unavailable={Boolean(unavailableCollections.portfolio)}
        reduceMotion={reduceMotion}
        onUpdate={onUpdateWork}
        onPickImage={onPickWorkImage}
        onRemove={onRemoveWork}
        onAdd={onAddWork}
      />
      {submitError && (
        <View className={styles.submitErrorCard} accessibilityRole="alert">
          <CircleAlert size={20} color={colors.danger} strokeWidth={2} />
          <Text className={styles.submitErrorText}>{submitError}</Text>
        </View>
      )}
    </>
  );
}
