import { Search, SlidersHorizontal, X } from "lucide-react-native";

import { Pressable, ScrollView, Text, TextInput, View } from "@/tw";
import { cn } from "@/tw/cn";
import type { TagItem } from "@/api/QuestApi";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { workerHomeMessages } from "@/locales/workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

interface WorkerSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClearQuery: () => void;
  tags: TagItem[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  onOpenFilter?: () => void;
  tagsError?: boolean;
  onRetryTags?: () => void;
}

export function WorkerSearchBar({
  query,
  onQueryChange,
  onClearQuery,
  tags,
  selectedTagId,
  onSelectTag,
  onOpenFilter,
  tagsError,
  onRetryTags,
}: WorkerSearchBarProps) {
  const { colors: themeColors } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const renderTag = (id: string | null, name: string, testID: string) => {
    const isSelected = selectedTagId === id;
    return (
      <Pressable
        accessibilityLabel={messages.tagFilter(name)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        className={cn(
          styles.tagPill,
          isSelected ? styles.tagPillSelected : styles.tagPillIdle
        )}
        hitSlop={4}
        key={testID}
        onPress={() => onSelectTag(isSelected ? null : id)}
        testID={testID}
      >
        <Text
          className={cn(
            styles.tagPillText,
            isSelected && styles.tagPillTextSelected
          )}
        >
          {name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="gap-ku-12" testID="worker-search-and-tags-section">
      <View className={styles.searchBarContainer}>
        <Search size={18} color={themeColors.textSecondary} />
        <TextInput
          accessibilityLabel={messages.searchPlaceholder}
          accessibilityRole="search"
          autoCapitalize="none"
          className={styles.searchInput}
          onChangeText={onQueryChange}
          placeholder={messages.searchPlaceholder}
          placeholderTextColor={themeColors.textMuted}
          returnKeyType="search"
          testID="worker-quest-search-input"
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityLabel={messages.clearSearch}
            accessibilityRole="button"
            className={styles.searchIconButton}
            hitSlop={2}
            onPress={onClearQuery}
            testID="clear-search-button"
          >
            <X size={18} color={themeColors.textSecondary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={messages.filter}
          accessibilityRole="button"
          className={styles.filterIconButton}
          hitSlop={2}
          onPress={onOpenFilter}
          testID="worker-filter-button"
        >
          <SlidersHorizontal size={18} color={themeColors.workerDark} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerClassName={styles.tagFilterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
        testID="worker-tag-filter-scroll"
      >
        {renderTag(null, messages.tagAll, "tag-pill-all")}
        {tags.map((tag) => renderTag(tag.id, tag.name, `tag-pill-${tag.id}`))}
      </ScrollView>
      {tagsError && onRetryTags ? (
        <View
          accessibilityRole="alert"
          className="flex-row items-center justify-between px-ku-md"
          testID="worker-tags-error"
        >
          <Text className="font-ku-regular text-ku-label text-ku-text-secondary">
            {messages.tagsUnavailable}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="min-h-[48px] justify-center px-ku-sm"
            onPress={onRetryTags}
          >
            <Text className="font-ku-semibold text-ku-label text-ku-worker-dark">
              {messages.errorRetry}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
