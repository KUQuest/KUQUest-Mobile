import { ArrowDownUp, SlidersHorizontal, X } from "lucide-react-native";

import { SearchInput } from "@/components/ui/SearchInput";
import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { HomeWalletOverview } from "@/features/wallet/HomeWalletOverview";
import { colors } from "@/theme/colors";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type {
  QuestBoardFilter,
  QuestLocationMode,
  StartTimeBucket,
} from "../types";
import styles from "../questBoardStyles";
import { deadlineOptions, startTimeOptions } from "../questBoardOptions";

export interface QuestBoardListHeaderProps {
  locale: "en" | "th";
  messages: QuestBoardMessages;
  query: string;
  onQueryChange: (query: string) => void;
  onClearQuery: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filterOpen: boolean;
  onOpenFilters: () => void;
  sortOpen: boolean;
  onOpenSort: () => void;
  sortLabel: string;
  filters: QuestBoardFilter;
  onRemoveTag: (tag: string) => void;
  onRemoveLocation: (location: QuestLocationMode) => void;
  onRemoveRewardBounds: () => void;
  onRemoveDeadline: () => void;
  onRemoveStartTimeBucket: (bucket: StartTimeBucket) => void;
  showRetryStatus: boolean;
}

export function QuestBoardListHeader({
  locale,
  messages,
  query,
  onQueryChange,
  onClearQuery,
  hasActiveFilters,
  activeFilterCount,
  filterOpen,
  onOpenFilters,
  sortOpen,
  onOpenSort,
  sortLabel,
  filters,
  onRemoveTag,
  onRemoveLocation,
  onRemoveRewardBounds,
  onRemoveDeadline,
  onRemoveStartTimeBucket,
  showRetryStatus,
}: QuestBoardListHeaderProps) {
  return (
    <>
      <View className={styles.boardIntro}>
        <View className={styles.boardIntroRow}>
          <View className={styles.boardIntroCopy}>
            <Text accessibilityRole="header" className={styles.boardTitle}>
              {messages.title}
            </Text>
            <Text className={styles.boardSubtitle}>{messages.subtitle}</Text>
          </View>
        </View>
      </View>
      <HomeWalletOverview locale={locale} />
      <SearchInput
        accessibilityLabel={messages.searchPlaceholder}
        autoCapitalize="none"
        clearAccessibilityLabel={messages.clearSearch}
        clearButtonClassName={styles.iconButton}
        clearButtonTestID="clear-quest-search"
        clearIconColor={colors.textMuted}
        clearIconSize={20}
        clearIconStrokeWidth={2}
        className={styles.searchField}
        iconColor={colors.textMuted}
        iconSize={23}
        iconStrokeWidth={2}
        inputClassName={styles.searchInput}
        onChangeText={onQueryChange}
        onClear={onClearQuery}
        placeholder={messages.searchPlaceholder}
        placeholderTextColor={colors.textMuted}
        testID="quest-board-search"
        value={query}
      />
      <View className={styles.toolbar}>
        <Pressable
          accessibilityLabel={`${messages.filter}${hasActiveFilters ? `, ${messages.selectedFilters(activeFilterCount)}` : ""}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: filterOpen }}
          onPress={onOpenFilters}
          className={cn(
            styles.toolbarButton,
            hasActiveFilters && styles.toolbarButtonActive
          )}
          testID="open-quest-filters"
        >
          <SlidersHorizontal
            color={hasActiveFilters ? colors.white : colors.textStrong}
            size={22}
            strokeWidth={2.3}
          />
          <Text
            className={cn(
              styles.toolbarText,
              hasActiveFilters && styles.toolbarTextActive
            )}
          >
            {messages.filter}
          </Text>
          {activeFilterCount > 0 ? (
            <View className={styles.filterCount}>
              <Text className={styles.filterCountText}>
                {activeFilterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityLabel={`${messages.sort}: ${sortLabel}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: sortOpen }}
          onPress={onOpenSort}
          className={cn(styles.toolbarButton, styles.toolbarButtonRight)}
          testID="open-quest-sort"
        >
          <ArrowDownUp color={colors.textStrong} size={22} strokeWidth={2.3} />
          <Text className={styles.toolbarText}>
            {messages.sort}: {sortLabel}
          </Text>
        </Pressable>
      </View>
      {hasActiveFilters ? (
        <View
          accessibilityLabel={messages.activeFiltersLabel}
          className={styles.activeFilters}
        >
          {filters.tags.map((tag) => (
            <Pressable
              accessibilityLabel={messages.removeFilter(tag)}
              accessibilityRole="button"
              key={tag}
              onPress={() => onRemoveTag(tag)}
              className={styles.filterChip}
              testID={`active-quest-filter-tag-${tag}`}
            >
              <Text className={styles.filterChipText}>{tag}</Text>
              <X color={colors.primary} size={13} strokeWidth={2.5} />
            </Pressable>
          ))}
          {filters.locationModes.map((location) => (
            <Pressable
              accessibilityLabel={messages.removeFilter(
                location === "online" ? messages.online : messages.onCampus
              )}
              accessibilityRole="button"
              key={location}
              onPress={() => onRemoveLocation(location)}
              className={styles.filterChip}
              testID={`active-quest-filter-${location}`}
            >
              <Text className={styles.filterChipText}>
                {location === "online" ? messages.online : messages.onCampus}
              </Text>
              <X color={colors.primary} size={13} strokeWidth={2.5} />
            </Pressable>
          ))}
          {filters.rewardMin !== null || filters.rewardMax !== null ? (
            <Pressable
              accessibilityLabel={messages.removeFilter(
                messages.rewardSummary(filters.rewardMin, filters.rewardMax)
              )}
              accessibilityRole="button"
              onPress={onRemoveRewardBounds}
              className={styles.filterChip}
              testID="active-quest-filter-reward"
            >
              <Text className={styles.filterChipText}>
                {messages.rewardSummary(filters.rewardMin, filters.rewardMax)}
              </Text>
              <X color={colors.primary} size={13} strokeWidth={2.5} />
            </Pressable>
          ) : null}
          {filters.deadline ? (
            <Pressable
              accessibilityLabel={messages.removeFilter(
                messages[
                  deadlineOptions.find(
                    (option) => option.value === filters.deadline
                  )?.labelKey ?? "within7Days"
                ]
              )}
              accessibilityRole="button"
              onPress={onRemoveDeadline}
              className={styles.filterChip}
              testID="active-quest-filter-deadline"
            >
              <Text className={styles.filterChipText}>
                {
                  messages[
                    deadlineOptions.find(
                      (option) => option.value === filters.deadline
                    )?.labelKey ?? "within7Days"
                  ]
                }
              </Text>
              <X color={colors.primary} size={13} strokeWidth={2.5} />
            </Pressable>
          ) : null}
          {filters.startTimeBuckets.map((bucket) => (
            <Pressable
              accessibilityLabel={messages.removeFilter(
                messages[
                  startTimeOptions.find((option) => option.value === bucket)
                    ?.labelKey ?? "morning"
                ]
              )}
              accessibilityRole="button"
              onPress={() => onRemoveStartTimeBucket(bucket)}
              className={styles.filterChip}
              key={bucket}
              testID={`active-quest-filter-start-time-${bucket}`}
            >
              <Text className={styles.filterChipText}>
                {
                  messages[
                    startTimeOptions.find((option) => option.value === bucket)
                      ?.labelKey ?? "morning"
                  ]
                }
              </Text>
              <X color={colors.primary} size={13} strokeWidth={2.5} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {showRetryStatus ? (
        <Text
          accessibilityLabel={messages.retrySuccess}
          accessibilityLiveRegion="polite"
          className={styles.retryStatus}
        >
          {messages.retrySuccess}
        </Text>
      ) : null}
    </>
  );
}
