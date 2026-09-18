import React from "react";
import { useColorScheme } from "react-native";
import { Search, SlidersHorizontal, X } from "lucide-react-native";

import { Pressable, ScrollView, Text, TextInput, View } from "@/tw";
import type { TagItem } from "@/api/QuestApi";
import { useLocale } from "@/locales/LocaleProvider";
import { getThemeColors } from "@/theme/colors";
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
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  return (
    <View testID="worker-search-and-tags-section">
      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.borderSubtle,
          },
        ]}
      >
        <Search size={18} color={themeColors.textSecondary} />
        <TextInput
          accessibilityLabel={messages.searchPlaceholder}
          accessibilityRole="search"
          autoCapitalize="none"
          onChangeText={onQueryChange}
          placeholder={messages.searchPlaceholder}
          placeholderTextColor={themeColors.textSecondary}
          style={[styles.searchInput, { color: themeColors.textStrong }]}
          testID="worker-quest-search-input"
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            onPress={onClearQuery}
            style={{ padding: 4 }}
            testID="clear-search-button"
          >
            <X size={16} color={themeColors.textSecondary} />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityLabel={messages.filter}
          accessibilityRole="button"
          onPress={onOpenFilter}
          style={[
            styles.filterIconButton,
            {
              backgroundColor: themeColors.surfaceMuted,
            },
          ]}
          testID="worker-filter-button"
        >
          <SlidersHorizontal size={17} color={themeColors.primaryDeep} />
        </Pressable>
      </View>

      {/* Quick Tag Filter Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagFilterScrollView}
        testID="worker-tag-filter-scroll"
      >
        <View style={styles.tagFilterRow}>
          {/* "All" Tag Chip */}
          <Pressable
            accessibilityLabel={`${messages.tagAll} filter`}
            accessibilityRole="button"
            onPress={() => onSelectTag(null)}
            style={[
              styles.tagPill,
              selectedTagId === null
                ? {
                    backgroundColor: themeColors.primaryDeep,
                    borderColor: themeColors.primaryDeep,
                  }
                : {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
            ]}
            testID="tag-pill-all"
          >
            <Text
              style={[
                styles.tagPillText,
                {
                  color:
                    selectedTagId === null
                      ? themeColors.white
                      : themeColors.textSecondary,
                  fontWeight: selectedTagId === null ? "600" : "500",
                },
              ]}
            >
              {messages.tagAll}
            </Text>
          </Pressable>

          {/* Dynamic Tag Chips */}
          {tags.map((tag) => {
            const isSelected = selectedTagId === tag.id;
            return (
              <Pressable
                accessibilityLabel={`${tag.name} filter`}
                accessibilityRole="button"
                key={tag.id}
                onPress={() => onSelectTag(isSelected ? null : tag.id)}
                style={[
                  styles.tagPill,
                  isSelected
                    ? {
                        backgroundColor: themeColors.primaryDeep,
                        borderColor: themeColors.primaryDeep,
                      }
                    : {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.borderSubtle,
                      },
                ]}
                testID={`tag-pill-${tag.id}`}
              >
                <Text
                  style={[
                    styles.tagPillText,
                    {
                      color: isSelected
                        ? themeColors.white
                        : themeColors.textSecondary,
                      fontWeight: isSelected ? "600" : "500",
                    },
                  ]}
                >
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
