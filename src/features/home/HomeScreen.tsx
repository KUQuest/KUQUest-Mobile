import React, { useCallback, useState } from "react";
import { RefreshControl, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { Chip } from "@/components/ui/Chip";
import { Plus } from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";

import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { isPrototypeDemoEnabled } from "@/features/auth/authEnvironment";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";

import { StateView } from "@/components/ui/StateView";
import { QuestBoardSkeleton } from "@/features/questBoard/board/components/QuestBoardStates";
import { useHirerHomeQuery } from "./api/homeQueries";
import { HirerQuestProgressCard } from "./components/HirerQuestProgressCard";
import {
  HirerAttentionSection,
  HirerHomeMasthead,
  type HirerMyQuestsTab,
  HirerShortcutsSection,
  type HirerShortcutRoute,
} from "./components/HirerHomeSections";
import {
  getHirerAttentionItems,
  type HirerAttentionItem,
  hirerHomeQuestFixtures,
} from "./hirerHomeData";
import { hirerHomeMessages } from "./hirerHomeMessages";
import { hirerHomeStyles as styles } from "./hirerHomeStyles";
export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const handleScroll = handleNavigationScroll;
  const metrics = getAppChromeMetrics(width, fontScale);
  const messages = hirerHomeMessages[locale];
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const {
    data: homeData,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useHirerHomeQuery();
  const liveQuests = homeData?.activeQuests ?? [];
  const activeQuestCount = homeData?.activeQuestCount ?? 0;
  const draftCount = homeData?.draftCount ?? 0;
  const completedCount = homeData?.completedCount ?? 0;
  const isPrototypeDemo = isPrototypeDemoEnabled();
  const displayQuests =
    liveQuests.length > 0
      ? liveQuests
      : isPrototypeDemo
        ? hirerHomeQuestFixtures.map((f) => ({
            id: f.id,
            title: f.title[locale],
            tag: f.tag?.[locale],
            status: f.status,
            mode: "FIRST_COME_FIRST_SERVED" as const,
            participation: "SINGLE" as const,
            headcount: 1,
            dueAt: f.dueAt,
            assignedWorkers: [
              {
                id: f.worker.id,
                displayName: f.worker.displayName[locale],
                avatarUri: f.worker.avatarUri,
                faculty: f.worker.faculty?.[locale],
              },
            ],
            applicants: [],
            proofPending: false,
          }))
        : [];
  const displayedActiveQuestCount =
    liveQuests.length > 0 ? activeQuestCount : displayQuests.length;

  const cardWidth = Math.min(width - 32, 640);
  const handleOpenDetails = useCallback(
    (questId: string) => {
      router.push({
        pathname: "/quest/[id]",
        params: { id: questId },
      });
    },
    [router]
  );

  const handleReviewProof = useCallback(
    (questId: string) => {
      router.push({
        pathname: "/quest/[id]/proof-review",
        params: { id: questId },
      });
    },
    [router]
  );

  const handleOpenWorkerProfile = useCallback(
    (workerId: string) => {
      router.push(`/profile/${workerId}`);
    },
    [router]
  );

  const handleOpenRoster = useCallback(
    (questId: string) => {
      router.push({
        pathname: "/quest/[id]/select-roster",
        params: { id: questId },
      });
    },
    [router]
  );

  const attentionItems = getHirerAttentionItems(liveQuests);

  const handleOpenMyQuests = (tab: HirerMyQuestsTab) =>
    router.push({ pathname: "/my-quests", params: { role: "hirer", tab } });

  const handleOpenAttentionItem = (item: HirerAttentionItem) =>
    item.kind === "proof"
      ? handleReviewProof(item.questId)
      : handleOpenRoster(item.questId);

  const handleOpenShortcut = (route: HirerShortcutRoute) =>
    route === "/my-quests"
      ? router.push({ pathname: route, params: { role: "hirer" } })
      : router.push(route);

  if (isPending) {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className="bg-ku-background"
      >
        <View className="flex-1 px-ku-md pt-ku-lg" testID="hirer-home-loading">
          <QuestBoardSkeleton loadingLabel={messages.loading} />
        </View>
      </ScreenLayout>
    );
  }

  if (isError) {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className="bg-ku-background"
      >
        <View className="flex-1 px-ku-md pt-ku-lg" testID="hirer-home-error">
          <StateView
            actionLabel={messages.retry}
            description={messages.errorDescription}
            onAction={() => void refetch()}
            title={messages.errorTitle}
            variant="error"
          />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <ScrollView
        contentContainerStyle={{
          paddingBottom:
            getBottomNavigationInset(metrics, insets.bottom) + spacing.xl,
        }}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            colors={[themeColors.hirer]}
            tintColor={themeColors.hirer}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="hirer-home-scroll"
      >
        <View className={styles.screenContent}>
          <HirerHomeMasthead
            activeCount={displayedActiveQuestCount}
            completedCount={completedCount}
            draftCount={draftCount}
            messages={messages}
            onOpenMyQuests={handleOpenMyQuests}
          />

          <HirerAttentionSection
            items={attentionItems}
            messages={messages}
            onOpenItem={handleOpenAttentionItem}
          />

          {displayQuests.length > 0 ? (
            <View className={styles.section}>
              <View className={styles.sectionHeaderRow}>
                <Text
                  accessibilityRole="header"
                  className={styles.sectionTitle}
                >
                  {messages.activeQuestTitle}
                </Text>
                <View className="flex-row items-center gap-ku-sm">
                  {displayQuests.length > 1 ? (
                    <Chip
                      className={styles.sectionCounterBadge}
                      label={messages.activeQuestCounter(
                        activeCardIndex + 1,
                        displayedActiveQuestCount
                      )}
                      textClassName={`${styles.sectionCounterText} text-ku-hirer`}
                      testID="hirer-quest-counter"
                      tone="accent"
                    />
                  ) : null}
                  {displayedActiveQuestCount > displayQuests.length ? (
                    <Pressable
                      accessibilityLabel={messages.viewAllActive}
                      accessibilityRole="button"
                      className={styles.viewAllButton}
                      onPress={() => handleOpenMyQuests("active")}
                      testID="hirer-view-all-active"
                    >
                      <Text className={`${styles.viewAllText} text-ku-hirer`}>
                        {messages.viewAllActive}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View className={styles.carouselContainer}>
                <ScrollView
                  contentContainerClassName="gap-ku-12"
                  decelerationRate="fast"
                  horizontal
                  onMomentumScrollEnd={(event) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    const nextIndex = Math.round(
                      offsetX / (cardWidth + spacing.px12)
                    );
                    setActiveCardIndex(
                      Math.max(0, Math.min(nextIndex, displayQuests.length - 1))
                    );
                  }}
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToAlignment="start"
                  snapToInterval={cardWidth + spacing.px12}
                  testID="hirer-quest-carousel"
                >
                  {displayQuests.map((item) => (
                    <View key={item.id} style={{ width: cardWidth }}>
                      <HirerQuestProgressCard
                        dueAt={item.dueAt}
                        onOpenDetails={() => handleOpenDetails(item.id)}
                        onOpenWorkerProfile={handleOpenWorkerProfile}
                        onViewRoster={() => handleOpenRoster(item.id)}
                        questId={item.id}
                        status={item.status}
                        tag={item.tag}
                        title={item.title}
                        headcount={item.headcount}
                        mode={item.mode}
                        assignedWorkers={item.assignedWorkers}
                        applicants={item.applicants}
                        proofPending={item.proofPending}
                        onReviewProof={() => handleReviewProof(item.id)}
                      />
                    </View>
                  ))}
                </ScrollView>

                {displayQuests.length > 1 ? (
                  <View
                    accessibilityLabel={messages.activeQuestCounter(
                      activeCardIndex + 1,
                      displayQuests.length
                    )}
                    accessibilityRole="progressbar"
                    accessibilityValue={{
                      min: 1,
                      max: displayQuests.length,
                      now: activeCardIndex + 1,
                    }}
                    className={styles.carouselPagination}
                    testID="hirer-quest-carousel-dots"
                  >
                    {displayQuests.map((item, index) => (
                      <View
                        className={`${styles.paginationDot} ${
                          index === activeCardIndex
                            ? `${styles.paginationDotActive} bg-ku-hirer`
                            : `${styles.paginationDotInactive} bg-ku-border-subtle`
                        }`}
                        key={item.id}
                        testID={`hirer-carousel-dot-${index}`}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <View className={styles.emptyState} testID="hirer-home-empty">
              <Text accessibilityRole="header" className={styles.emptyTitle}>
                {messages.emptyTitle}
              </Text>
              <Text className={styles.emptyDescription}>
                {messages.emptyDescription}
              </Text>
              <Pressable
                accessibilityRole="button"
                className={styles.emptyAction}
                onPress={() => router.push("/create")}
                testID="hirer-home-empty-create"
              >
                <Plus
                  color={themeColors.hirerDark}
                  size={20}
                  strokeWidth={2.2}
                />
                <Text className={styles.emptyActionText}>
                  {messages.emptyAction}
                </Text>
              </Pressable>
            </View>
          )}

          <HirerShortcutsSection
            messages={messages}
            onNavigate={handleOpenShortcut}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
