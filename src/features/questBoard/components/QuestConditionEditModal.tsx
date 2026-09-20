import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { Pressable, ScrollView, Text, TextInput, View } from "@/tw";

import { BottomSheet } from "@/components/ui/BottomSheet";

export const MAX_CONDITION_ITEM_LENGTH = 255;

export interface QuestConditionEditModalProps {
  visible: boolean;
  originalItems: string[];
  onClose: () => void;
  onSubmit: (items: string[]) => void;
  submitting?: boolean;
  error?: string;
}

interface ConditionDiff {
  added: string[];
  removed: string[];
  reordered: boolean;
}

function diffConditionItems(
  original: string[],
  proposed: string[]
): ConditionDiff {
  const remaining = [...original];
  const added: string[] = [];
  for (const text of proposed) {
    const index = remaining.indexOf(text);
    if (index >= 0) remaining.splice(index, 1);
    else added.push(text);
  }
  const reordered =
    added.length === 0 &&
    remaining.length === 0 &&
    proposed.some((text, index) => text !== original[index]);
  return { added, removed: remaining, reordered };
}

/**
 * Hirer-only composer for a Quest Edit proposal while a Quest is
 * QUEST_ASSIGNED. Lets the Hirer add, edit, delete, and reorder condition
 * items, previews the diff against the current conditions, and submits the
 * proposal that starts the 10-minute Worker consensus window.
 */
export function QuestConditionEditModal({
  visible,
  originalItems,
  onClose,
  onSubmit,
  submitting = false,
  error,
}: QuestConditionEditModalProps) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const [items, setItems] = useState<string[]>(originalItems);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setItems(originalItems);
  }

  const trimmedItems = useMemo(() => items.map((item) => item.trim()), [items]);
  const diff = useMemo(
    () => diffConditionItems(originalItems, trimmedItems),
    [originalItems, trimmedItems]
  );
  const hasChanges =
    diff.added.length > 0 || diff.removed.length > 0 || diff.reordered;
  const hasEmptyItem = trimmedItems.some((item) => item.length === 0);
  const canSubmit = hasChanges && !hasEmptyItem && !submitting;

  const updateItem = (index: number, text: string) =>
    setItems((current) =>
      current.map((item, i) => (i === index ? text : item))
    );
  const removeItem = (index: number) =>
    setItems((current) => current.filter((_, i) => i !== index));
  const addItem = () => setItems((current) => [...current, ""]);
  const moveItem = (index: number, direction: -1 | 1) =>
    setItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(trimmedItems);
  };

  return (
    <BottomSheet
      visible={visible}
      title={messages.conditionEditTitle}
      subtitle={messages.conditionEditSubtitle}
      closeLabel={messages.close}
      onClose={onClose}
      testID="quest-condition-edit-modal"
      fullScreen
    >
      <ScrollView className="flex-1" testID="quest-condition-edit-scroll">
        <View className="mt-4 rounded-2xl border border-ku-border-warning bg-ku-surface-warning p-4">
          <Text className="text-ku-body-small text-ku-warning-dark">
            {messages.conditionEditWarning}
          </Text>
        </View>

        <View className="mt-4">
          {items.map((item, index) => (
            <View key={index} className="mb-3 flex-row items-start gap-2">
              <TextInput
                value={item}
                onChangeText={(text) => updateItem(index, text)}
                placeholder={messages.conditionItemPlaceholder}
                multiline
                maxLength={MAX_CONDITION_ITEM_LENGTH}
                accessibilityLabel={messages.conditionItemLabel(index + 1)}
                testID={`quest-condition-item-${index}`}
                className="flex-1 rounded-xl border border-ku-border bg-ku-surface p-3 text-ku-text-strong"
              />
              <View className="gap-1">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.moveConditionItemUp(index + 1)}
                  disabled={index === 0}
                  onPress={() => moveItem(index, -1)}
                  testID={`quest-condition-move-up-${index}`}
                  className="h-9 w-9 items-center justify-center rounded-full bg-ku-surface disabled:opacity-40"
                >
                  <ArrowUp size={16} color={colors.textStrong} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.moveConditionItemDown(index + 1)}
                  disabled={index === items.length - 1}
                  onPress={() => moveItem(index, 1)}
                  testID={`quest-condition-move-down-${index}`}
                  className="h-9 w-9 items-center justify-center rounded-full bg-ku-surface disabled:opacity-40"
                >
                  <ArrowDown size={16} color={colors.textStrong} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={messages.removeConditionItem(index + 1)}
                  disabled={items.length <= 1}
                  onPress={() => removeItem(index)}
                  testID={`quest-condition-remove-${index}`}
                  className="h-9 w-9 items-center justify-center rounded-full bg-ku-surface disabled:opacity-40"
                >
                  <Trash2 size={16} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={messages.addConditionItem}
            onPress={addItem}
            testID="quest-condition-add"
            className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-ku-border bg-ku-surface p-3"
          >
            <Plus size={16} color={colors.primary} />
            <Text className="font-ku-semibold text-ku-primary">
              {messages.addConditionItem}
            </Text>
          </Pressable>
        </View>

        <View
          className="mt-5 rounded-2xl bg-ku-surface-muted p-4"
          testID="quest-condition-diff"
        >
          <Text className="font-ku-bold text-ku-text-strong">
            {messages.conditionDiffTitle}
          </Text>
          {hasChanges ? (
            <View className="mt-2 gap-1">
              {diff.added.map((text, index) => (
                <Text
                  key={`added-${index}-${text}`}
                  accessibilityLabel={`${messages.conditionDiffAdded}: ${text}`}
                  className="text-ku-body-small text-ku-success"
                >
                  + {text}
                </Text>
              ))}
              {diff.removed.map((text, index) => (
                <Text
                  key={`removed-${index}-${text}`}
                  accessibilityLabel={`${messages.conditionDiffRemoved}: ${text}`}
                  className="text-ku-body-small text-ku-danger-dark line-through"
                >
                  {text}
                </Text>
              ))}
              {diff.reordered ? (
                <Text className="text-ku-body-small text-ku-text-secondary">
                  {messages.conditionDiffReordered}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text className="mt-2 text-ku-body-small text-ku-text-secondary">
              {messages.conditionNoChanges}
            </Text>
          )}
        </View>

        {hasEmptyItem ? (
          <Text
            accessibilityRole="alert"
            className="mt-3 text-ku-body-small text-ku-danger-dark"
          >
            {messages.conditionItemRequired}
          </Text>
        ) : null}
        {error ? (
          <Text
            accessibilityRole="alert"
            className="mt-3 text-ku-body-small text-ku-danger-dark"
          >
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <Button
        onPress={handleSubmit}
        disabled={!canSubmit}
        className="mt-4"
        testID="quest-condition-submit"
      >
        {submitting
          ? messages.submittingConditionEdit
          : messages.submitConditionEdit}
      </Button>
    </BottomSheet>
  );
}

QuestConditionEditModal.displayName = "QuestConditionEditModal";

export default QuestConditionEditModal;
