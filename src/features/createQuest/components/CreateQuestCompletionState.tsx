import { Check } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";
import { Text, View } from "@/tw";

import type { CreateQuestMessages } from "@/locales/createQuestMessages";
import type { CompletionState } from "../createQuestTypes";
import type { CreateQuestFlowMode } from "../workflow/createQuestWorkflow";
import { isServerEditMode } from "../workflow/createQuestWorkflow";
import styles from "./createQuestStyles";

export function CreateQuestCompletionState({
  completedState,
  messages,
  mode,
  onLeave,
  onReset,
}: {
  completedState: CompletionState;
  messages: CreateQuestMessages;
  mode: CreateQuestFlowMode;
  onLeave: () => void;
  onReset: () => void | Promise<void>;
}) {
  const editingServerQuest = isServerEditMode(mode);
  const published = !editingServerQuest && completedState === "OPEN";

  return (
    <View className={styles.successState}>
      <View className={styles.successIcon}>
        <Check color={colors.primary} size={32} strokeWidth={2.5} />
      </View>
      <Text accessibilityRole="header" className={styles.successTitle}>
        {editingServerQuest
          ? messages.updatedQuestTitle
          : published
            ? messages.publishedQuestTitle
            : messages.savedDraftTitle}
      </Text>
      <Text className={styles.successDescription}>
        {editingServerQuest
          ? messages.updatedQuestDescription
          : published
            ? messages.publishedQuestDescription
            : messages.savedDraftDescription}
      </Text>
      {editingServerQuest ? (
        <Button onPress={onLeave} className={styles.fullButton}>
          {messages.backToQuest}
        </Button>
      ) : (
        <>
          <Button onPress={() => void onReset()} className={styles.fullButton}>
            {published ? messages.createNewQuest : messages.createAnotherDraft}
          </Button>
          <Button
            variant="secondary"
            onPress={onLeave}
            className={styles.fullButton}
          >
            {messages.viewQuestBoard}
          </Button>
        </>
      )}
    </View>
  );
}
