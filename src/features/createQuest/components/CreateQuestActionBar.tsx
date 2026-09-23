import { ChevronRight } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";
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
  publishCanPublish: boolean;
  savingAction: CompletionState | null;
  step: Step;
  stacked: boolean;
  onCancel: () => void;
  onNext: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}) {
  const editingServerQuest = isServerEditMode(mode);
  const nextLabel = step === 2 ? messages.reviewQuest : messages.next;

  return (
    <View
      className={cn(styles.actionBar, stacked && styles.actionBarStacked)}
      style={{
        alignItems: stacked ? "stretch" : "center",
        flexDirection: stacked ? "column" : "row",
        paddingBottom: Math.max(spacing.sm, bottomInset + spacing.xs),
      }}
    >
      {editingServerQuest ? (
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
      ) : editingServerQuest ? (
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
