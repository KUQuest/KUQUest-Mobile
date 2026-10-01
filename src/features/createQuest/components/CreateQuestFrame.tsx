import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";
import { View } from "@/tw";

import styles from "./createQuestStyles";
import type { Step } from "../createQuestTypes";
import { CreateQuestHeader } from "./CreateQuestHeader";

export function CreateQuestFrame({
  children,
  messages,
  onBackPress,
  onStepPress,
  step,
  title,
}: {
  children: ReactNode;
  messages: CreateQuestMessages;
  onBackPress: () => void;
  onStepPress?: (step: Step) => void;
  step: Step;
  title?: string;
}) {
  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <StatusBar style="light" />
      <CreateQuestHeader
        messages={messages}
        step={step}
        onBackPress={onBackPress}
        onStepPress={onStepPress}
        title={title}
      />
      <View className={styles.surface}>{children}</View>
    </ScreenLayout>
  );
}
