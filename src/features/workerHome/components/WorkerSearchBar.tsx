import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react-native";

import { Pressable, ScrollView, Text, TextInput, View } from "@/tw";
import type { TagItem } from "@/api/QuestApi";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface WorkerSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClearQuery: () => void;
  tags: TagItem[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  onOpenFilter?: () => void;
}

export function WorkerSearchBar({
  query,
  onQueryChange,
  onClearQuery,
  tags,
  selectedTagId,
  onSelectTag,
  onOpenFilter,
}: WorkerSearchBarProps) {
  const { colors: themeColors } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  return (
    <View testID="worker-search-and-tags-section">
      <View
        className={`${styles.searchBarContainer} border-ku-border-subtle bg-ku-surface`}
      >
        <Search size={18} color={themeColors.textSecondary} />
        <TextInput
          accessibilityLabel={messages.searchPlaceholder}
          accessibilityRole="search"
          autoCapitalize="none"
          className={`${styles.searchInput} text-ku-text-strong`}
          onChangeText={onQueryChange}
          placeholder={messages.searchPlaceholder}
          placeholderTextColor={themeColors.textSecondary}
          testID="worker-quest-search-input"
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            className="p-[4px]"
            onPress={onClearQuery}
            testID="clear-search-button"
          >
            <X size={16} color={themeColors.textSecondary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={messages.filter}
          accessibilityRole="button"
          className={`${styles.filterIconButton} bg-ku-surface-muted`}
          onPress={onOpenFilter}
          testID="worker-filter-button"
        >
          <SlidersHorizontal size={17} color={themeColors.primaryDeep} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerClassName={styles.tagFilterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
        className={styles.tagFilterScrollView}
        testID="worker-tag-filter-scroll"
      >
        <Pressable
          accessibilityLabel={`${messages.tagAll} filter`}
          accessibilityRole="button"
          className={`${styles.tagPill} ${
            selectedTagId === null
              ? "border-ku-primary-dark bg-ku-primary-dark"
              : "border-ku-border-subtle bg-ku-surface"
          }`}
          onPress={() => onSelectTag(null)}
          testID="tag-pill-all"
        >
          <Text
            className={`${styles.tagPillText} ${
              selectedTagId === null
                ? "font-ku-semibold text-ku-on-primary"
                : "text-ku-text-secondary"
            }`}
          >
            {messages.tagAll}
          </Text>
        </Pressable>
        {tags.map((tag) => {
          const isSelected = selectedTagId === tag.id;
          return (
            <Pressable
              accessibilityLabel={`${tag.name} filter`}
              accessibilityRole="button"
              className={`${styles.tagPill} ${
                isSelected
                  ? "border-ku-primary-dark bg-ku-primary-dark"
                  : "border-ku-border-subtle bg-ku-surface"
              }`}
              key={tag.id}
              onPress={() => onSelectTag(isSelected ? null : tag.id)}
              testID={`tag-pill-${tag.id}`}
            >
              <Text
                className={`${styles.tagPillText} ${
                  isSelected
                    ? "font-ku-semibold text-ku-on-primary"
                    : "text-ku-text-secondary"
                }`}
              >
                {tag.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
