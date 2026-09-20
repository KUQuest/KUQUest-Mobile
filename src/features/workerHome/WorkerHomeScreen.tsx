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
  return <View style={{ height: 12 }} />;
}

function WorkerQuestFeedFooter() {
  return <View style={{ height: 24 }} />;
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
        contentContainerStyle={[
          styles.screenContent,
          { paddingBottom: scrollBottomPadding },
        ]}
        data={availableQuests}
        ItemSeparatorComponent={WorkerQuestFeedSeparator}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="never"
        ListEmptyComponent={
          boardQuery.isPending ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={themeColors.primaryDeep} />
            </View>
          ) : (
            <View
              accessibilityRole="text"
              style={[
                styles.emptyState,
                {
                  backgroundColor: themeColors.surfaceMuted,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              testID="worker-feed-empty"
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: themeColors.surface },
                ]}
              >
                <Search size={22} color={themeColors.textSecondary} />
              </View>
              <Text
                style={[styles.emptyTitle, { color: themeColors.textStrong }]}
              >
                {messages.noAvailableQuestsTitle}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: themeColors.textSecondary },
                ]}
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
            {/* Header with Title: Work */}
            <View style={styles.screenHeader}>
              <View style={styles.headerTopRow}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: themeColors.surfaceSuccess,
                      borderColor: themeColors.borderSuccess,
                    },
                  ]}
                  testID="worker-workspace-badge"
                >
                  <View
                    style={[
                      styles.roleBadgeDot,
                      { backgroundColor: themeColors.success },
                    ]}
                  />
                  <Text
                    style={[
                      styles.roleBadgeText,
                      { color: themeColors.success },
                    ]}
                  >
                    {messages.badge}
                  </Text>
                </View>

                <Pressable
                  accessibilityHint="Switches role to Hirer workspace"
                  accessibilityLabel={messages.switchToHirer}
                  accessibilityRole="button"
                  onPress={handleSwitchToHirer}
                  style={[
                    styles.switchRoleButton,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.borderSubtle,
                    },
                  ]}
                  testID="switch-to-hirer-button"
                >
                  <ArrowRightLeft size={13} color={themeColors.primaryDeep} />
                  <Text
                    style={[
                      styles.switchRoleText,
                      { color: themeColors.primaryDeep },
                    ]}
                  >
                    {messages.switchToHirer}
                  </Text>
                </Pressable>
              </View>

              <Text
                accessibilityRole="header"
                style={[styles.screenTitle, { color: themeColors.textStrong }]}
                testID="worker-home-title"
              >
                {messages.workTitle}
              </Text>
              <Text
                style={[
                  styles.screenSubtitle,
                  { color: themeColors.textSecondary },
                ]}
              >
                {messages.subtitle}
              </Text>
            </View>

            {/* Search / Filter & Quick Tag Filter */}
            <WorkerSearchBar
              onClearQuery={handleClearSearch}
              onOpenFilter={handleOpenFilter}
              onQueryChange={handleSearchChange}
              onSelectTag={handleSelectTag}
              query={searchQuery}
              selectedTagId={selectedTagId}
              tags={tags}
            />

            {/* Error Notice */}
            {assignmentsQuery.isError && boardQuery.isError ? (
              <View
                style={[
                  styles.errorState,
                  {
                    backgroundColor: themeColors.surfaceMuted,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="worker-home-error"
              >
                <Text
                  style={[styles.errorText, { color: themeColors.textStrong }]}
                >
                  {messages.errorTitle}
                </Text>
                <Pressable
                  accessibilityLabel={messages.errorRetry}
                  accessibilityRole="button"
                  onPress={handleRefresh}
                  style={[
                    styles.retryButton,
                    { backgroundColor: themeColors.primaryDeep },
                  ]}
                  testID="worker-home-retry-btn"
                >
                  <Text
                    style={[styles.retryText, { color: themeColors.white }]}
                  >
                    {messages.errorRetry}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: themeColors.textStrong }]}
              >
                {messages.feedSectionTitle}
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: themeColors.textSecondary },
                ]}
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
