import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  type ListRenderItem,
  RefreshControl,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRightLeft, Search } from "lucide-react-native";

import { FlatList, Pressable, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import { useLocale } from "@/features/preferences/localeStore";
import {
  useWorkerAssignmentsQuery,
  useWorkerBoardQuery,
  useWorkerParticipationDetailQuery,
  useWorkerTagsQuery,
} from "./api/workerHomeQueries";
import { getThemeColors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";

import type { QuestV2BoardCard } from "@/api/questV2Contracts";
import { WorkerQuestFeedCard } from "./components/WorkerQuestFeedCard";
import { WorkerQuickAccessBar } from "./components/WorkerQuickAccessBar";
import { WorkerSearchBar } from "./components/WorkerSearchBar";
import { workerHomeMessages } from "./workerHomeMessages";
import { workerHomeStyles as styles } from "./workerHomeStyles";

function WorkerQuestFeedSeparator() {
  return <View className="h-[12px]" />;
}

function WorkerQuestFeedFooter() {
  return <View className="h-ku-lg" />;
}

export default function WorkerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const metrics = getAppChromeMetrics(width, fontScale);
  const handleScroll = handleNavigationScroll;
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];
  const { switchWorkspace } = useRoleWorkspace();

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const assignmentsQuery = useWorkerAssignmentsQuery("active");
  const boardQuery = useWorkerBoardQuery({
    q: searchQuery,
    tagId: selectedTagId,
  });
  const tagsQuery = useWorkerTagsQuery();
  const activeAssignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  );
  const availableQuests = boardQuery.data?.items ?? [];
  const tags = tagsQuery.data ?? [];
  const activeOngoingAssignment = useMemo(
    () =>
      activeAssignments.find(
        (assignment) =>
          assignment.state === "ASSIGNMENT_ACTIVE" &&
          (assignment.questState === "QUEST_ASSIGNED" ||
            assignment.questState === "QUEST_IN_PROGRESS")
      ) ?? null,
    [activeAssignments]
  );
  const activeQuestDetailQuery = useWorkerParticipationDetailQuery(
    activeOngoingAssignment?.questId ?? null
  );
  const activeQuestDetail = activeQuestDetailQuery.data ?? null;

  const handleRefresh = useCallback(() => {
    void Promise.all([
      assignmentsQuery.refetch(),
      boardQuery.refetch(),
      tagsQuery.refetch(),
      activeOngoingAssignment
        ? activeQuestDetailQuery.refetch()
        : Promise.resolve(),
    ]);
  }, [
    activeOngoingAssignment,
    activeQuestDetailQuery,
    assignmentsQuery,
    boardQuery,
    tagsQuery,
  ]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleSelectTag = useCallback((tagId: string | null) => {
    setSelectedTagId(tagId);
  }, []);

  const handleSwitchToHirer = useCallback(() => {
    void switchWorkspace("hirer");
  }, [switchWorkspace]);

  const handleOpenFilter = useCallback(() => {
    // Open filter or toggle search options
  }, []);

  const handleQuestPress = useCallback(
    (quest: QuestV2BoardCard) => {
      router.push({
        pathname: "/quest/[id]",
        params: { id: quest.id },
      });
    },
    [router]
  );

  const renderQuestItem = useCallback<ListRenderItem<QuestV2BoardCard>>(
    ({ item }) => (
      <WorkerQuestFeedCard
        onPress={() => {
          handleQuestPress(item);
        }}
        quest={item}
      />
    ),
    [handleQuestPress]
  );

  const keyExtractor = useCallback((quest: QuestV2BoardCard) => quest.id, []);

  const handleOpenMyQuests = useCallback(() => {
    router.push("/my-quests");
  }, [router]);

  const bottomNavInset = getBottomNavigationInset(metrics, insets.bottom);

  // Extra padding when the Grab-like quick access bar is showing
  const scrollBottomPadding =
    bottomNavInset + (activeOngoingAssignment ? 76 : 16) + spacing.xl;
  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <FlatList
        contentContainerClassName={styles.screenContent}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        data={availableQuests}
        ItemSeparatorComponent={WorkerQuestFeedSeparator}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="never"
        ListEmptyComponent={
          boardQuery.isPending ? (
            <View className="items-center py-ku-xl">
              <ActivityIndicator color={themeColors.primaryDeep} />
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
              <View className={styles.headerTopRow}>
                <View
                  className={`${styles.roleBadge} border-ku-border-success bg-ku-surface-success`}
                  testID="worker-workspace-badge"
                >
                  <View className={`${styles.roleBadgeDot} bg-ku-success`} />
                  <Text className={`${styles.roleBadgeText} text-ku-success`}>
                    {messages.badge}
                  </Text>
                </View>
                <Pressable
                  accessibilityHint="Switches role to Hirer workspace"
                  accessibilityLabel={messages.switchToHirer}
                  accessibilityRole="button"
                  className={`${styles.switchRoleButton} border-ku-border-subtle bg-ku-surface`}
                  onPress={handleSwitchToHirer}
                  testID="switch-to-hirer-button"
                >
                  <ArrowRightLeft size={13} color={themeColors.primaryDeep} />
                  <Text
                    className={`${styles.switchRoleText} text-ku-primary-dark`}
                  >
                    {messages.switchToHirer}
                  </Text>
                </Pressable>
              </View>
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
            {assignmentsQuery.isError && boardQuery.isError ? (
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
                  className={`${styles.retryButton} bg-ku-primary-dark`}
                  onPress={handleRefresh}
                  testID="worker-home-retry-btn"
                >
                  <Text className={`${styles.retryText} text-ku-on-primary`}>
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
            colors={[themeColors.primaryDeep]}
            onRefresh={handleRefresh}
            refreshing={
              assignmentsQuery.isRefetching ||
              boardQuery.isRefetching ||
              tagsQuery.isRefetching ||
              activeQuestDetailQuery.isRefetching
            }
            tintColor={themeColors.primaryDeep}
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
        onPress={handleOpenMyQuests}
        questState={
          activeQuestDetail?.state ?? activeOngoingAssignment?.questState
        }
        questTitle={activeQuestDetail?.title}
      />
    </ScreenLayout>
  );
}
