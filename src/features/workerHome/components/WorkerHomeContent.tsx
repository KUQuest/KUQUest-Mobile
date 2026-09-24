import { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  type ListRenderItem,
} from "react-native";

import { Search } from "lucide-react-native";
import { FlatList, Text, View } from "@/tw";
import { StateView } from "@/components/ui/StateView";
import type { QuestV2BoardCard } from "@/api/questV2Contracts";
import { spacing } from "@/theme/spacing";
import { WorkerQuestFeedCard } from "./WorkerQuestFeedCard";
import { WorkerQuickAccessBar } from "./WorkerQuickAccessBar";
import { WorkerSearchBar } from "./WorkerSearchBar";
import { workerHomeStyles as styles } from "../workerHomeStyles";

import type { WorkerHomeContentProps } from "../workflow/useWorkerHomeController";

function WorkerQuestFeedSeparator() {
  return <View className="h-ku-12" />;
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
  const showFeedError = assignmentsError && boardError;
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
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          showFeedError ? (
            <View className={styles.feedError} testID="worker-home-error">
              <StateView
                actionLabel={messages.errorRetry}
                description={messages.errorDescription}
                onAction={handleRefresh}
                title={messages.errorTitle}
                variant="error"
              />
            </View>
          ) : boardPending ? (
            <View className="items-center py-ku-xl">
              <ActivityIndicator color={themeColors.workerDark} />
            </View>
          ) : (
            <View className={styles.emptyState} testID="worker-feed-empty">
              <View className={styles.emptyIconCircle}>
                <Search size={24} color={themeColors.workerDark} />
              </View>
              <Text className={styles.emptyTitle}>
                {messages.noAvailableQuestsTitle}
              </Text>
              <Text className={styles.emptyDescription}>
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
            <View className={styles.masthead}>
              <View className={styles.mastheadCopy}>
                <Text
                  accessibilityRole="header"
                  className={styles.screenTitle}
                  testID="worker-home-title"
                >
                  {messages.workTitle}
                </Text>
                <Text className={styles.screenSubtitle}>
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
            </View>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionTitleRow}>
                <Text
                  accessibilityRole="header"
                  className={styles.sectionTitle}
                >
                  {messages.feedSectionTitle}
                </Text>
                {availableQuests.length > 0 ? (
                  <Text className={styles.sectionCount}>
                    {availableQuests.length}
                  </Text>
                ) : null}
              </View>
              <Text className={styles.sectionSubtitle}>
                {messages.feedSectionSubtitle}
              </Text>
            </View>
          </View>
        }
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            colors={[themeColors.workerDark]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={themeColors.workerDark}
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
