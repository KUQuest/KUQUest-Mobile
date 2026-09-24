import { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  type ListRenderItem,
} from "react-native";

import { Search } from "lucide-react-native";
import { FlatList, Pressable, Text, View } from "@/tw";
import type { QuestV2BoardCard } from "@/api/questV2Contracts";
import { spacing } from "@/theme/spacing";
import { WorkerQuestFeedCard } from "./WorkerQuestFeedCard";
import { WorkerQuickAccessBar } from "./WorkerQuickAccessBar";
import { WorkerSearchBar } from "./WorkerSearchBar";
import { workerHomeStyles as styles } from "../workerHomeStyles";

import type { WorkerHomeContentProps } from "../workflow/useWorkerHomeController";

function WorkerQuestFeedSeparator() {
  return <View className="h-[12px]" />;
}

function WorkerQuestFeedFooter() {
  return <View className="h-ku-lg" />;
}

export function WorkerHomeContent({
  activeOngoingAssignment,
  activeQuestDetail,
  assignmentsError,
  boardError,
  boardPending,
  bottomNavInset,
  handleClearSearch,
  handleOpenCurrentWork,
  handleOpenFilter,
  handleQuestPress,
  handleRefresh,
  handleSearchChange,
  handleScroll,
  handleSelectTag,
  isRefreshing,
  messages,
  availableQuests,
  scrollBottomPadding,
  searchQuery,
  selectedTagId,
  tags,
  themeColors,
}: WorkerHomeContentProps) {
  const renderQuestItem = useCallback<ListRenderItem<QuestV2BoardCard>>(
    ({ item }) => (
      <WorkerQuestFeedCard
        onPress={() => handleQuestPress(item)}
        quest={item}
      />
    ),
    [handleQuestPress]
  );
  const keyExtractor = useCallback((quest: QuestV2BoardCard) => quest.id, []);
  return (
    <>
      <FlatList
        contentContainerStyle={{
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.px14,
        }}
        data={availableQuests}
        ItemSeparatorComponent={WorkerQuestFeedSeparator}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="never"
        ListEmptyComponent={
          boardPending ? (
            <View className="items-center py-ku-xl">
              <ActivityIndicator color={themeColors.workerDeep} />
            </View>
          ) : (
            <View
              accessibilityRole="text"
              className={`${styles.emptyState} border-ku-border-subtle bg-ku-surface-muted`}
              testID="worker-feed-empty"
            >
              <View className={`${styles.emptyIconCircle} bg-ku-surface`}>
                <Search size={22} color={themeColors.textSecondary} />
              </View>
              <Text className={`${styles.emptyTitle} text-ku-text-strong`}>
                {messages.noAvailableQuestsTitle}
              </Text>
              <Text
                className={`${styles.emptyDescription} text-ku-text-secondary`}
              >
                {messages.noAvailableQuestsDesc}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          availableQuests.length > 0 ? WorkerQuestFeedFooter : undefined
        }
        ListHeaderComponent={
          <View>
            <View className={styles.screenHeader}>
              <Text
                accessibilityRole="header"
                className={`${styles.screenTitle} text-ku-text-strong`}
                testID="worker-home-title"
              >
                {messages.workTitle}
              </Text>
              <Text
                className={`${styles.screenSubtitle} text-ku-text-secondary`}
              >
                {messages.subtitle}
              </Text>
            </View>
            <WorkerSearchBar
              onClearQuery={handleClearSearch}
              onOpenFilter={handleOpenFilter}
              onQueryChange={handleSearchChange}
              onSelectTag={handleSelectTag}
              query={searchQuery}
              selectedTagId={selectedTagId}
              tags={tags}
            />
            {assignmentsError && boardError ? (
              <View
                className={`${styles.errorState} border-ku-border-subtle bg-ku-surface-muted`}
                testID="worker-home-error"
              >
                <Text className={`${styles.errorText} text-ku-text-strong`}>
                  {messages.errorTitle}
                </Text>
                <Pressable
                  accessibilityLabel={messages.errorRetry}
                  accessibilityRole="button"
                  className={`${styles.retryButton} bg-ku-worker-dark`}
                  onPress={handleRefresh}
                  testID="worker-home-retry-btn"
                >
                  <Text className={`${styles.retryText} text-ku-on-worker`}>
                    {messages.errorRetry}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <View className={styles.sectionHeader}>
              <Text className={`${styles.sectionTitle} text-ku-text-strong`}>
                {messages.feedSectionTitle}
              </Text>
              <Text
                className={`${styles.sectionSubtitle} text-ku-text-secondary`}
              >
                {messages.feedSectionSubtitle}
              </Text>
            </View>
          </View>
        }
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            colors={[themeColors.workerDeep]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={themeColors.workerDeep}
          />
        }
        renderItem={renderQuestItem}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="worker-home-scroll"
      />
      <WorkerQuickAccessBar
        assignment={activeOngoingAssignment}
        bottomInset={bottomNavInset}
        onPress={handleOpenCurrentWork}
        questState={
          activeQuestDetail?.state ?? activeOngoingAssignment?.questState
        }
        questTitle={activeQuestDetail?.title}
      />
    </>
  );
}
