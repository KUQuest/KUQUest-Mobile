import { CircleAlert } from "lucide-react-native";
import { Platform } from "react-native";

import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";
import { KeyboardAvoidingView, Text, View } from "@/tw";

import { CreateQuestActionBar } from "./components/CreateQuestActionBar";
import { CreateQuestCompletionState } from "./components/CreateQuestCompletionState";
import { CreateQuestForm } from "./components/CreateQuestForm";
import { CreateQuestFrame } from "./components/CreateQuestFrame";
import { CreateQuestSkeleton } from "./components/CreateQuestSkeleton";
import styles from "./components/createQuestStyles";
import {
  useCreateQuestController,
  type CreateQuestScreenProps,
} from "./workflow/useCreateQuestController";
export type { CreateQuestScreenProps };

export default function CreateQuestScreen({
  editQuestId,
  editMode = false,
}: CreateQuestScreenProps = {}) {
  const { frame, content, formProps, actionBarProps } =
    useCreateQuestController({ editQuestId, editMode });

  if (!content.draftHydrated && content.saveState !== "error") {
    return (
      <CreateQuestFrame {...frame}>
        {content.draftLoadError ? (
          <View className={styles.loadErrorState}>
            <View className={styles.loadErrorIcon}>
              <CircleAlert
                color={colors.dangerDark}
                size={26}
                strokeWidth={2.2}
              />
            </View>
            <Text accessibilityRole="alert" className={styles.loadErrorText}>
              {frame.messages.loadDraftError}
            </Text>
            <Button
              onPress={content.retryDraftLoad}
              className={styles.fullButton}
            >
              {frame.messages.retryLoadDraft}
            </Button>
          </View>
        ) : (
          <CreateQuestSkeleton
            horizontalPadding={content.layout.horizontalPadding}
            contentMaxWidth={
              content.layout.isExpanded
                ? content.layout.contentMaxWidth
                : "100%"
            }
            loadingLabel={frame.messages.loadingDraft}
            stackedActions={content.useStackedActions}
            step={frame.step}
          />
        )}
      </CreateQuestFrame>
    );
  }

  if (content.completedState) {
    return (
      <CreateQuestFrame
        {...frame}
        step={3}
        onBackPress={content.onDismissCompletion}
      >
        <CreateQuestCompletionState
          completedState={content.completedState}
          messages={frame.messages}
          mode={content.mode}
          onLeave={content.onLeave}
          onReset={content.onReset}
        />
      </CreateQuestFrame>
    );
  }

  return (
    <CreateQuestFrame {...frame}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <CreateQuestForm {...formProps} />
        <CreateQuestActionBar {...actionBarProps} />
      </KeyboardAvoidingView>
    </CreateQuestFrame>
  );
}
