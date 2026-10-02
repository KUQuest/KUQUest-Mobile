import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  type ListRenderItem,
} from "react-native";
import { QuestUnderfilledState } from "@/features/questBoard/domain/types";
import {
  formatCountdown,
  useServerCountdown,
} from "@/features/questBoard/shared/useServerCountdown";

import { Search } from "lucide-react-native";
import { WorkspaceQuickSwitch } from "@/features/workspace/WorkspaceQuickSwitch";
import { FlatList, Pressable, Text, View } from "@/tw";
import { StateView } from "@/components/ui/StateView";
import type { QuestV2BoardCard } from "@/api/questV2Contracts";
import { useLocale } from "@/features/preferences/localeStore";
import { spacing } from "@/theme/spacing";
import { WorkerQuestFeedCard } from "./WorkerQuestFeedCard";
import { WorkerQuickAccessBar } from "./WorkerQuickAccessBar";
import { WorkerSearchBar } from "./WorkerSearchBar";
import { QuestBoardFilterSheet } from "@/features/questBoard/board/components/QuestBoardFilters";
import { workerHomeStyles as styles } from "../workerHomeStyles";
import { getTagLabel, getTagLabelById } from "@/locales/tagLabels";

import type { WorkerHomeContentProps } from "../workflow/useWorkerHomeController";

function WorkerQuestFeedSeparator() {
  return <View className="h-ku-12" />;
}

function WorkerQuestFeedFooter() {
  return <View className="h-ku-lg" />;
}

export function WorkerHomeContent({
  workerActionAssignment,
  pendingWorkerActionCount,
  activeOngoingAssignment,
  activeQuestDetail,
  assignmentsError,
  boardError,
  boardPending,
  bottomNavInset,
  filterOpen,
  filterDraft,
  filterMessages,
  handleApplyFilters,
  handleChangeFilter,
  handleClearSearch,
  handleCloseFilter,
  handleOpenCurrentWork,
  handleOpenFilter,
  handleQuestPress,
  handleRefresh,
  handleRetryAssignments,
  handleRetryBoard,
  handleRetryTags,
  handleSearchChange,
  handleScroll,
  handleSelectTag,
  isPullRefreshing,
  messages,
  availableQuests,
  scrollBottomPadding,
  searchQuery,
  selectedTagId,
  tagsError,
  tags,
  themeColors,
  handleOpenWorkerAction,
}: WorkerHomeContentProps) {
  const underfilled = workerActionAssignment?.underfilled;
  const expiresAt =
    underfilled?.state === QuestUnderfilledState.UNDERFILLED_DECISION_PENDING
      ? underfilled.decision.expiresAt
      : underfilled?.state === QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING
        ? underfilled.consent.expiresAt
        : null;
  const remaining = useServerCountdown(expiresAt);
  const expiredQuest = useRef<string | null>(null);
  useEffect(() => {
    if (!workerActionAssignment || remaining !== 0 || !expiresAt) {
      if (!expiresAt) expiredQuest.current = null;
      return;
    }
    const key = `${workerActionAssignment.questId}:${underfilled?.state}`;
    if (expiredQuest.current !== key) {
      expiredQuest.current = key;
      handleRetryAssignments();
    }
  }, [
    expiresAt,
    handleRetryAssignments,
    remaining,
    underfilled?.state,
    workerActionAssignment,
  ]);
  const responseExpired = remaining === 0 && expiresAt !== null;
  const actionMessage =
    !workerActionAssignment || !underfilled
      ? null
      : responseExpired
        ? messages.checkingUnderfilledResult
        : underfilled.state ===
            QuestUnderfilledState.UNDERFILLED_CONSENT_PENDING
          ? messages.responseRequired
          : underfilled.state ===
              QuestUnderfilledState.UNDERFILLED_DECISION_PENDING
            ? messages.waitingForDecision
            : underfilled.state === QuestUnderfilledState.UNDERFILLED_CANCELLED
              ? messages.underfilledCancelled(
                  underfilled.cancellationReason ?? null
                )
              : underfilled.state ===
                  QuestUnderfilledState.UNDERFILLED_COMPLETED
                ? messages.underfilledAssigned
                : null;
  const countdownText =
    expiresAt && !responseExpired && remaining !== null
      ? messages.consentCountdown(formatCountdown(remaining))
      : null;
  const { locale } = useLocale();
  const renderQuestItem = useCallback<ListRenderItem<QuestV2BoardCard>>(
    ({ item }) => (
      <WorkerQuestFeedCard
        onPress={() => handleQuestPress(item)}
        quest={item}
        tagLabel={getTagLabelById(tags, item.tag?.id, item.tag?.name, locale)}
      />
    ),
    [handleQuestPress, locale, tags]
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
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          boardPending ? (
            <View className="items-center py-ku-xl">
              <ActivityIndicator color={themeColors.workerDark} />
            </View>
          ) : boardError ? null : (
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
              <View className="flex-row items-start justify-between gap-ku-sm px-ku-md">
                <View className={`${styles.mastheadCopy} min-w-0 flex-1`}>
                  <Text
                    accessibilityRole="header"
                    className={styles.screenTitle}
                    testID="worker-home-title"
                  >
                    {messages.workTitle}
                  </Text>
                </View>
                <WorkspaceQuickSwitch />
              </View>
              {assignmentsError ? (
                <View
                  accessibilityRole="alert"
                  className="mx-ku-md mb-ku-sm rounded-ku-card border border-ku-border bg-ku-surface p-ku-md"
                  testID="worker-assignment-error"
                >
                  <Text className="font-ku-semibold text-ku-body-small text-ku-text-strong">
                    {messages.assignmentsError}
                  </Text>
                  <Text className="mt-ku-xs font-ku-regular text-ku-label text-ku-text-secondary">
                    {messages.assignmentsErrorDescription}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    className="mt-ku-sm min-h-[48px] justify-center"
                    onPress={handleRetryAssignments}
                  >
                    <Text className="font-ku-semibold text-ku-label text-ku-worker-dark">
                      {messages.errorRetry}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              <WorkerSearchBar
                onClearQuery={handleClearSearch}
                onOpenFilter={handleOpenFilter}
                onQueryChange={handleSearchChange}
                onSelectTag={handleSelectTag}
                query={searchQuery}
                selectedTagId={selectedTagId}
                tags={tags}
                onRetryTags={handleRetryTags}
                tagsError={tagsError}
              />
            </View>
            {workerActionAssignment && actionMessage ? (
              <View
                accessibilityRole="alert"
                className="mx-ku-md mt-ku-sm rounded-ku-card border border-ku-worker-border bg-ku-worker-subtle"
              >
                <Pressable
                  accessibilityLabel={
                    countdownText
                      ? `${actionMessage}, ${countdownText}`
                      : actionMessage
                  }
                  accessibilityRole="button"
                  className="min-h-[48px] justify-center px-ku-md py-ku-sm"
                  onPress={() =>
                    handleOpenWorkerAction(
                      workerActionAssignment,
                      responseExpired
                    )
                  }
                  testID="worker-home-underfilled-action"
                >
                  <Text
                    accessibilityRole="header"
                    className="font-ku-semibold text-ku-body-small text-ku-text-strong"
                  >
                    {actionMessage}
                  </Text>
                  {countdownText ? (
                    <Text
                      accessibilityLiveRegion={
                        remaining === 0 ||
                        (remaining !== null &&
                          Math.floor(Math.ceil(remaining / 1000) / 60) !==
                            Math.floor(
                              Math.ceil((remaining + 1_000) / 1000) / 60
                            ))
                          ? "polite"
                          : "none"
                      }
                      className="mt-ku-xs font-ku-medium text-ku-label text-ku-text-secondary"
                      testID="worker-home-underfilled-countdown"
                    >
                      {countdownText}
                    </Text>
                  ) : null}
                </Pressable>
                {pendingWorkerActionCount > 1 ? (
                  <Pressable
                    accessibilityLabel={messages.morePendingActions(
                      pendingWorkerActionCount - 1
                    )}
                    accessibilityRole="button"
                    className="min-h-[48px] justify-center px-ku-md"
                    onPress={() => handleOpenCurrentWork(true)}
                    testID="worker-home-more-actions"
                  >
                    <Text className="font-ku-medium text-ku-label text-ku-worker-dark">
                      {messages.morePendingActions(
                        pendingWorkerActionCount - 1
                      )}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
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
            </View>
            {boardError ? (
              <View className={styles.feedError} testID="worker-home-error">
                <StateView
                  actionLabel={messages.errorRetry}
                  description={messages.errorDescription}
                  onAction={handleRetryBoard}
                  title={messages.boardErrorTitle}
                  variant="error"
                />
              </View>
            ) : null}
          </View>
        }
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            colors={[themeColors.workerDark]}
            onRefresh={handleRefresh}
            refreshing={isPullRefreshing}
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
      {filterOpen ? (
        <QuestBoardFilterSheet
          availableTags={tags.map((tag) => getTagLabel(tag, locale))}
          filter={filterDraft}
          messages={filterMessages}
          onApply={handleApplyFilters}
          onChange={handleChangeFilter}
          onClose={handleCloseFilter}
        />
      ) : null}
    </>
  );
}
