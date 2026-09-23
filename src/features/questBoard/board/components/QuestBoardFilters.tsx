import React, { useState } from "react";
import { AccessibilityInfo, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Search, X } from "lucide-react-native";

import { Pressable, ScrollView, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import { getActionBarPaddingBottom } from "@/theme/layout";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import styles from "../questBoardStyles";
import {
  emptyQuestBoardFilter,
  type QuestBoardFilter,
  type QuestBoardSort,
  type QuestLocationMode,
  type StartTimeBucket,
} from "../../domain/types";
import {
  deadlineOptions,
  getActiveFilterCount,
  sortOptions,
  startTimeOptions,
} from "../questBoardOptions";

function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function formatBound(value: number | null): string {
  return value === null ? "" : String(value);
}

function parseRewardBound(value: string): number | null | undefined {
  if (value === "") return null;
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

interface OptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
  accessibilityRole?: "checkbox" | "radio";
}

function Option({
  label,
  selected,
  onPress,
  testID,
  accessibilityRole = "checkbox",
}: OptionProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={accessibilityRole}
      accessibilityState={
        accessibilityRole === "radio" ? { selected } : { checked: selected }
      }
      onPress={onPress}
      className={cn(styles.option, selected && styles.optionSelected)}
      testID={testID}
    >
      <Text
        className={cn(styles.optionText, selected && styles.optionTextSelected)}
      >
        {label}
      </Text>
      {selected ? (
        <Check color={colors.primary} size={15} strokeWidth={2.5} />
      ) : null}
    </Pressable>
  );
}

export interface QuestBoardFilterSheetProps {
  filter: QuestBoardFilter;
  messages: QuestBoardMessages;
  availableTags: string[];
  onChange: (next: QuestBoardFilter) => void;
  onApply: () => void;
  onClose: () => void;
}

export function QuestBoardFilterSheet({
  filter,
  messages,
  availableTags,
  onChange,
  onApply,
  onClose,
}: QuestBoardFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [minimumText, setMinimumText] = useState(formatBound(filter.rewardMin));
  const [maximumText, setMaximumText] = useState(formatBound(filter.rewardMax));
  const [tagQuery, setTagQuery] = useState("");
  const minimum = parseRewardBound(minimumText);
  const maximum = parseRewardBound(maximumText);
  const rewardBoundsValid =
    minimum !== undefined &&
    maximum !== undefined &&
    (minimum === null || maximum === null || minimum <= maximum);
  const activeFilterCount = getActiveFilterCount(filter);
  const displayedTags = [...new Set([...availableTags, ...filter.tags])].sort(
    (left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" })
  );
  const normalizedTagQuery = tagQuery.trim().toLocaleLowerCase();
  const tagSuggestions = normalizedTagQuery
    ? displayedTags.filter(
        (tag) =>
          !filter.tags.includes(tag) &&
          tag.toLocaleLowerCase().includes(normalizedTagQuery)
      )
    : [];

  const updateRewardBounds = (
    nextMinimumText: string,
    nextMaximumText: string
  ) => {
    const nextMinimum = parseRewardBound(nextMinimumText);
    const nextMaximum = parseRewardBound(nextMaximumText);
    if (nextMinimum !== undefined && nextMaximum !== undefined) {
      onChange({ ...filter, rewardMin: nextMinimum, rewardMax: nextMaximum });
    }
  };

  const addTag = (tag: string) => {
    onChange({ ...filter, tags: [...filter.tags, tag] });
    setTagQuery("");
  };
  const removeTag = (tag: string) =>
    onChange({ ...filter, tags: filter.tags.filter((value) => value !== tag) });
  const toggleStartTime = (bucket: StartTimeBucket) =>
    onChange({
      ...filter,
      startTimeBuckets: filter.startTimeBuckets.includes(bucket)
        ? filter.startTimeBuckets.filter((value) => value !== bucket)
        : [...filter.startTimeBuckets, bucket],
    });
  const toggleLocation = (location: QuestLocationMode) =>
    onChange({
      ...filter,
      locationModes: filter.locationModes.includes(location)
        ? filter.locationModes.filter((value) => value !== location)
        : [...filter.locationModes, location],
    });
  const clearDraft = () => {
    setMinimumText("");
    setMaximumText("");
    onChange({ ...emptyQuestBoardFilter, query: filter.query });
  };

  return (
    <Modal
      animationType="slide"
      onDismiss={() => announce(messages.resultsLabel)}
      onRequestClose={onClose}
      onShow={() => announce(messages.filtersTitle)}
      transparent
      visible
    >
      <Pressable
        onPress={onClose}
        className={styles.modalBackdrop}
        testID="quest-filter-backdrop"
      >
        <Pressable
          accessibilityViewIsModal
          onPress={(event) => event.stopPropagation()}
          className={styles.sheet}
          style={{
            height: "88%",
            paddingBottom: getActionBarPaddingBottom(insets.bottom),
          }}
          testID="quest-filter-sheet"
        >
          <View className={styles.sheetHandle} />
          <View className={styles.sheetHeader}>
            <View className={styles.sheetHeaderCopy}>
              <Text accessibilityRole="header" className={styles.sheetTitle}>
                {messages.filtersTitle}
              </Text>
              <Text className={styles.sheetSummary}>
                {messages.selectedFilters(activeFilterCount)}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={messages.cancel}
              accessibilityRole="button"
              onPress={onClose}
              className={styles.sheetCloseButton}
              testID="close-quest-filters"
            >
              <X color={colors.textStrong} size={22} />
            </Pressable>
          </View>
          <ScrollView
            className={styles.sheetScroll}
            contentContainerClassName={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View className={styles.sheetSection}>
              <Text className={styles.sheetSectionTitle}>{messages.tags}</Text>
              {filter.tags.length > 0 ? (
                <View className={styles.selectedTags}>
                  {filter.tags.map((tag) => (
                    <Pressable
                      accessibilityLabel={messages.removeSelectedTag(tag)}
                      accessibilityRole="button"
                      key={tag}
                      onPress={() => removeTag(tag)}
                      className={styles.selectedTag}
                      testID={`quest-filter-selected-tag-${tag}`}
                    >
                      <Text className={styles.selectedTagText}>{tag}</Text>
                      <X color={colors.primary} size={13} strokeWidth={2.5} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View className={styles.tagSearchField}>
                <Search color={colors.textMuted} size={20} strokeWidth={2} />
                <TextInput
                  accessibilityLabel={messages.searchTags}
                  accessibilityRole="search"
                  autoCapitalize="none"
                  onChangeText={setTagQuery}
                  placeholder={messages.searchTags}
                  placeholderTextColor={colors.textFaint}
                  value={tagQuery}
                  className={styles.tagSearchInput}
                  testID="quest-filter-tag-search"
                />
                {tagQuery ? (
                  <Pressable
                    accessibilityLabel={messages.clearTagSearch}
                    accessibilityRole="button"
                    onPress={() => setTagQuery("")}
                    className={styles.iconButton}
                    testID="clear-quest-filter-tag-search"
                  >
                    <X color={colors.textMuted} size={20} />
                  </Pressable>
                ) : null}
              </View>
              {normalizedTagQuery ? (
                tagSuggestions.length > 0 ? (
                  <View className={styles.tagSuggestions}>
                    {tagSuggestions.map((tag) => (
                      <Option
                        key={tag}
                        label={tag}
                        onPress={() => addTag(tag)}
                        selected={false}
                        testID={`quest-filter-tag-${tag}`}
                      />
                    ))}
                  </View>
                ) : (
                  <Text
                    accessibilityLiveRegion="polite"
                    className={styles.noTagResults}
                  >
                    {messages.noMatchingTags}
                  </Text>
                )
              ) : null}
            </View>
            <View className={styles.sheetSection}>
              <Text className={styles.sheetSectionTitle}>
                {messages.reward}
              </Text>
              <View className={styles.rewardInputs}>
                <View className={styles.rewardField}>
                  <Text className={styles.rewardFieldLabel}>
                    {messages.rewardMin}
                  </Text>
                  <TextInput
                    accessibilityLabel={messages.rewardMin}
                    keyboardType="number-pad"
                    onChangeText={(value) => {
                      setMinimumText(value);
                      updateRewardBounds(value, maximumText);
                    }}
                    placeholder="0"
                    placeholderTextColor={colors.textFaint}
                    value={minimumText}
                    className={styles.rewardInput}
                    testID="quest-filter-reward-min"
                  />
                </View>
                <View className={styles.rewardField}>
                  <Text className={styles.rewardFieldLabel}>
                    {messages.rewardMax}
                  </Text>
                  <TextInput
                    accessibilityLabel={messages.rewardMax}
                    keyboardType="number-pad"
                    onChangeText={(value) => {
                      setMaximumText(value);
                      updateRewardBounds(minimumText, value);
                    }}
                    placeholder={messages.noLimit}
                    placeholderTextColor={colors.textFaint}
                    value={maximumText}
                    className={styles.rewardInput}
                    testID="quest-filter-reward-max"
                  />
                </View>
              </View>
              {!rewardBoundsValid ? (
                <Text
                  className={styles.rewardError}
                  testID="quest-filter-reward-error"
                >
                  {messages.rewardInvalid}
                </Text>
              ) : null}
            </View>
            <View className={styles.sheetSection}>
              <Text className={styles.sheetSectionTitle}>
                {messages.deadline}
              </Text>
              <View className={styles.optionList}>
                {deadlineOptions.map((option) => (
                  <Option
                    key={option.value}
                    label={messages[option.labelKey]}
                    onPress={() =>
                      onChange({
                        ...filter,
                        deadline:
                          filter.deadline === option.value
                            ? null
                            : option.value,
                      })
                    }
                    selected={filter.deadline === option.value}
                    testID={`quest-filter-deadline-${option.value}`}
                  />
                ))}
              </View>
            </View>
            <View className={styles.sheetSection}>
              <Text className={styles.sheetSectionTitle}>
                {messages.startTime}
              </Text>
              <View className={styles.optionList}>
                {startTimeOptions.map((option) => (
                  <Option
                    key={option.value}
                    label={messages[option.labelKey]}
                    onPress={() => toggleStartTime(option.value)}
                    selected={filter.startTimeBuckets.includes(option.value)}
                    testID={`quest-filter-start-time-${option.value}`}
                  />
                ))}
              </View>
            </View>
            <View className={styles.sheetSection}>
              <Text className={styles.sheetSectionTitle}>
                {messages.location}
              </Text>
              <View className={styles.optionList}>
                <Option
                  label={messages.online}
                  onPress={() => toggleLocation("online")}
                  selected={filter.locationModes.includes("online")}
                  testID="quest-filter-location-online"
                />
                <Option
                  label={messages.onCampus}
                  onPress={() => toggleLocation("on-campus")}
                  selected={filter.locationModes.includes("on-campus")}
                  testID="quest-filter-location-on-campus"
                />
              </View>
            </View>
          </ScrollView>
          <View className={styles.sheetActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className={styles.cancelAction}
            >
              <Text className={styles.cancelActionText}>{messages.cancel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={clearDraft}
              className={styles.secondaryAction}
            >
              <Text className={styles.secondaryActionText}>
                {messages.clearAll}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!rewardBoundsValid}
              accessibilityState={{ disabled: !rewardBoundsValid }}
              onPress={() => {
                if (rewardBoundsValid) onApply();
              }}
              className={cn(
                styles.primaryAction,
                !rewardBoundsValid && styles.primaryActionDisabled
              )}
              testID="apply-quest-filters"
            >
              <Text className={styles.primaryActionText}>
                {messages.applyFilters}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export interface QuestBoardSortSheetProps {
  sort: QuestBoardSort;
  messages: QuestBoardMessages;
  onSelect: (value: QuestBoardSort) => void;
  onClose: () => void;
}

export function QuestBoardSortSheet({
  sort,
  messages,
  onSelect,
  onClose,
}: QuestBoardSortSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      animationType="slide"
      onDismiss={() => announce(messages.resultsLabel)}
      onRequestClose={onClose}
      onShow={() => announce(messages.sortTitle)}
      transparent
      visible
    >
      <Pressable onPress={onClose} className={styles.modalBackdrop}>
        <Pressable
          accessibilityViewIsModal
          onPress={() => undefined}
          className={styles.sheet}
          style={{
            paddingBottom: getActionBarPaddingBottom(insets.bottom),
          }}
        >
          <View className={styles.sheetHeader}>
            <Text accessibilityRole="header" className={styles.sheetTitle}>
              {messages.sortTitle}
            </Text>
            <Pressable
              accessibilityLabel={messages.close}
              accessibilityRole="button"
              onPress={onClose}
              className={styles.sheetCloseButton}
              testID="close-quest-sort"
            >
              <X color={colors.textStrong} size={24} />
            </Pressable>
          </View>
          <View className={styles.optionList}>
            {sortOptions.map((option) => (
              <Option
                key={option.value}
                accessibilityRole="radio"
                label={messages[option.labelKey]}
                onPress={() => onSelect(option.value)}
                selected={sort === option.value}
                testID={`quest-sort-${option.value}`}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
