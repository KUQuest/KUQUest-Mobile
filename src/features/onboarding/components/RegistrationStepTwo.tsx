import React from "react";
import { Text, View } from "@/tw";

import { TextArea } from "@/components/ui/TextArea";
import styles from "@/features/onboarding/styles/registrationStyles";
import { onboardingMessages } from "../../../locales/registrationOnboarding";

type Messages = (typeof onboardingMessages)["en"];

export interface RegistrationStepTwoProps {
  messages: Messages;
  description: string;
  errors: Record<string, string>;
  onDescriptionChange: (value: string) => void;
}

export function RegistrationStepTwo({
  messages: msg,
  description,
  onDescriptionChange,
}: RegistrationStepTwoProps) {
  return (
    <>
      <View className={styles.step2Intro}>
        <Text className={styles.step2CardTitle}>{msg.aboutYourself}</Text>
        <Text className={styles.step2CardSubtitle}>{msg.aboutYourselfSub}</Text>
      </View>
      <TextArea
        label={msg.descriptionLabel}
        placeholder={msg.descriptionPlaceholder}
        value={description}
        onChangeText={onDescriptionChange}
        maxLength={1000}
      />
    </>
  );
}
