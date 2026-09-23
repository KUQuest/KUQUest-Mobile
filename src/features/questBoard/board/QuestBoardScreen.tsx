import { useCallback } from "react";
import { RefreshControl, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import { QuestList } from "@/components/ui/QuestList";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { spacing } from "@/theme/spacing";
import { getAppChromeMetrics } from "@/theme/layout";
import { View } from "@/tw";
import { QuestBoardSkeleton } from "./components/QuestBoardStates";
import {
  QuestBoardFilterSheet,
  QuestBoardSortSheet,
} from "./components/QuestBoardFilters";
import { QuestBoardListHeader } from "./components/QuestBoardListHeader";
import { QuestCard } from "./components/QuestCard";
import { useQuestBoardController } from "./useQuestBoardController";
import type { BoardPreviewState } from "../fixtures/questBoardHarness";
import type { QuestBoardQuest } from "../domain/types";
import styles from "./questBoardStyles";

export type { BoardPreviewState } from "../fixtures/questBoardHarness";

export interface QuestBoardScreenProps {
  currentStudentId?: string;
  initialPreviewState?: BoardPreviewState;
}

export default function QuestBoardScreen({
  currentStudentId,
  initialPreviewState = "populated",
}: QuestBoardScreenProps) {
  const board = useQuestBoardController(currentStudentId, initialPreviewState);
  const { locale, openOwnerProfile, openQuest, rewardSatang } = board;
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chromeMetrics = getAppChromeMetrics(width, fontScale);

  const renderQuest = useCallback(
    ({ item }: { item: QuestBoardQuest }) => (
      <QuestCard
        locale={locale}
        onDetail={() => openQuest(item)}
        onOwnerPress={(event) => openOwnerProfile(item, event)}
        quest={item}
        rewardSatang={rewardSatang(item)}
      />
    ),
    [locale, openOwnerProfile, openQuest, rewardSatang]
  );

  const listHeader = (
    <QuestBoardListHeader
      messages={board.messages}
      query={board.query}
      onQueryChange={board.setQuery}
      onClearQuery={() => board.setQuery("")}
      hasActiveFilters={board.hasActiveFilters}
      activeFilterCount={board.activeFilterCount}
      filterOpen={board.filterOpen}
      onOpenFilters={board.openFilters}
      sortOpen={board.sortOpen}
      onOpenSort={() => board.setSortOpen(true)}
      sortLabel={board.sortLabel}
      filters={board.filters}
      onRemoveTag={board.removeTag}
      onRemoveLocation={board.removeLocation}
      onRemoveRewardBounds={board.removeRewardBounds}
      onRemoveDeadline={board.removeDeadline}
      onRemoveStartTimeBucket={board.removeStartTimeBucket}
      showRetryStatus={
        board.boardModel.kind === "ready" && board.retryAttempt > 0
      }
    />
  );

  const noMatchDescription =
    board.hasActiveFilters || board.query
      ? board.messages.subtitle
      : board.messages.noQuests;
  const boardModel = board.boardModel;
  const emptyState =
    boardModel.kind === "loading" ? (
      <QuestBoardSkeleton loadingLabel={board.messages.loading} />
    ) : boardModel.kind === "error" ? (
      <StateView
        variant="error"
        title={board.messages.errorTitle}
        description={board.messages.errorDescription}
        actionLabel={board.messages.retry}
        onAction={board.retryBoard}
      />
    ) : boardModel.kind === "empty" ? (
      <StateView
        variant="empty"
        title={board.messages.noQuests}
        description={board.messages.subtitle}
      />
    ) : boardModel.kind === "unavailable" ? (
      <StateView
        variant="empty"
        title={
          boardModel.availability === "full"
            ? board.messages.stateFull
            : board.messages.stateClosed
        }
        description={board.messages.noMatches}
        actionLabel={board.messages.title}
        onAction={() =>
          board.openQuest(boardModel.quest, boardModel.availability)
        }
      />
    ) : board.noMatch ? (
      <StateView
        variant="empty"
        title={board.messages.noMatches}
        description={noMatchDescription}
        actionLabel={board.noMatchActionLabel}
        onAction={
          board.hasActiveFilters || board.query
            ? board.noMatchAction
            : undefined
        }
      />
    ) : null;

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <QuestList
        accessibilityLabel={board.messages.resultsLabel}
        refreshControl={
          <RefreshControl
            onRefresh={board.refreshBoard}
            refreshing={board.refreshing}
            testID="quest-board-refresh-control"
          />
        }
        contentContainerClassName={styles.scrollContent}
        contentContainerStyle={{
          paddingBottom:
            chromeMetrics.navHeight +
            insets.bottom +
            spacing.xl +
            spacing.xl +
            spacing.lg,
          paddingHorizontal: spacing.md,
        }}
        data={board.boardModel.kind === "ready" ? board.visibleQuests : []}
        keyExtractor={(quest) => quest.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={emptyState}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View className={styles.cardSeparator} />}
        renderItem={renderQuest}
        onScroll={handleNavigationScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
      {board.filterOpen ? (
        <QuestBoardFilterSheet
          availableTags={board.availableTags}
          filter={board.draftFilters}
          messages={board.messages}
          onApply={board.applyFilters}
          onChange={board.setDraftFilters}
          onClose={() => board.setFilterOpen(false)}
        />
      ) : null}
      {board.sortOpen ? (
        <QuestBoardSortSheet
          messages={board.messages}
          onClose={() => board.setSortOpen(false)}
          onSelect={(value) => {
            board.setSort(value);
            board.setSortOpen(false);
          }}
          sort={board.sort}
        />
      ) : null}
    </ScreenLayout>
  );
}
