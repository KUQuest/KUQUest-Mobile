import { ChevronRight, CircleAlert } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { spacing } from "@/theme/spacing";
import { cn } from "@/tw/cn";
import { Pressable, Text, View } from "@/tw";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";

import type { CreateQuestFlowMode } from "../workflow/createQuestWorkflow";
import { isServerEditMode } from "../workflow/createQuestWorkflow";
import type { CompletionState, Step } from "../createQuestTypes";
import styles from "./createQuestStyles";
import { ReviewActionButton } from "./ReviewActionButton";

export function CreateQuestActionBar({
  bottomInset,
  cancelState,
  isSaving,
  messages,
  mode,
  publishBlockedHint,
  publishable,
  publishCanPublish,
  savingAction,
  step,
  stacked,
  onCancel,
  onNext,
  onPublish,
  onSaveDraft,
}: {
  bottomInset: number;
  cancelState: "cancelling" | "error" | "idle";
  isSaving: boolean;
  messages: CreateQuestMessages;
  mode: CreateQuestFlowMode;
  /** First publish blocker, shown beside the disabled publish button. */
  publishBlockedHint: string | null;
  /** False for published Quests: Review saves changes instead of publishing. */
  publishable: boolean;
  publishCanPublish: boolean;
  savingAction: CompletionState | null;
  step: Step;
  stacked: boolean;
  onCancel: () => void;
  onNext: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}) {
  const { colors } = useAppTheme();
  const editingServerQuest = isServerEditMode(mode);
  const nextLabel = step === 2 ? messages.reviewQuest : messages.next;
  const reviewPublishes = step === 3 && publishable;
  const showBlockedHint = reviewPublishes && Boolean(publishBlockedHint);

  return (
    <View
      className={cn(styles.actionBar, stacked && styles.actionBarStacked)}
      style={{
        alignItems: stacked ? "stretch" : "center",
        flexDirection: stacked ? "column" : "row",
        flexWrap: showBlockedHint && !stacked ? "wrap" : "nowrap",
        paddingBottom: Math.max(spacing.sm, bottomInset + spacing.xs),
      }}
    >
      {showBlockedHint ? (
        <View
          accessibilityLiveRegion="polite"
          className={styles.publishBlockedHint}
          testID="create-quest-publish-blocked-hint"
        >
          <CircleAlert color={colors.dangerDark} size={16} strokeWidth={2.2} />
          <Text className={styles.publishBlockedHintText}>
            {publishBlockedHint}
          </Text>
        </View>
      ) : null}
      {editingServerQuest && !reviewPublishes ? (
        <Pressable
          accessibilityLabel={
            cancelState === "cancelling"
              ? messages.cancellingQuest
              : messages.cancelQuest
          }
          accessibilityRole="button"
          accessibilityState={{
            disabled: isSaving || cancelState === "cancelling",
          }}
          className={cn(
            "min-h-[48px] items-center justify-center rounded-[12px] border border-ku-danger px-ku-12",
            stacked ? "w-full" : "flex-1"
          )}
          disabled={isSaving || cancelState === "cancelling"}
          onPress={onCancel}
          testID="edit-quest-cancel"
        >
          <Text className="font-ku-semibold text-ku-danger">
            {cancelState === "cancelling"
              ? messages.cancellingQuest
              : messages.cancelQuest}
          </Text>
        </Pressable>
      ) : null}
      {step < 3 ? (
        <Button
          disabled={isSaving}
          onPress={onNext}
          className={
            editingServerQuest && !stacked
              ? styles.nextButtonRow
              : styles.nextButtonFull
          }
          accessibilityLabel={nextLabel}
        >
          <View className={styles.buttonContent}>
            <Text className={styles.primaryButtonText}>{nextLabel}</Text>
            <ChevronRight
              color={colors.onPrimary}
              size={20}
              strokeWidth={2.5}
            />
          </View>
        </Button>
      ) : editingServerQuest && !publishable ? (
        <ReviewActionButton
          accessibilityLabel={
            savingAction === "DRAFT"
              ? messages.savingChanges
              : messages.saveChanges
          }
          disabled={isSaving}
          label={
            savingAction === "DRAFT"
              ? messages.savingChanges
              : messages.saveChanges
          }
          onPress={onSaveDraft}
          stacked={stacked}
          testID="edit-quest-save"
          variant="primary"
        />
      ) : (
        <>
          <ReviewActionButton
            accessibilityLabel={
              savingAction === "DRAFT"
                ? messages.savingDraft
                : messages.saveDraft
            }
            disabled={isSaving}
            label={
              savingAction === "DRAFT"
                ? messages.savingDraft
                : messages.saveDraft
            }
            onPress={onSaveDraft}
            stacked={stacked}
            testID="create-quest-save-draft"
            variant="secondary"
          />
          <ReviewActionButton
            accessibilityLabel={
              savingAction === "OPEN"
                ? messages.publishingQuest
                : messages.publishQuest
            }
            disabled={isSaving || !publishCanPublish}
            label={
              savingAction === "OPEN"
                ? messages.publishingQuest
                : messages.publishQuest
            }
            onPress={onPublish}
            stacked={stacked}
            testID="create-quest-save-preview"
            variant="primary"
          />
        </>
      )}
    </View>
  );
}
