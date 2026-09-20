import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { Chip } from "@/components/ui/Chip";
import {
  Clock3,
  FileText,
  History,
  LayoutDashboard,
  WalletCards,
} from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";

import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import WorkerHomeScreen from "@/features/workerHome/WorkerHomeScreen";
import { isPrototypeDemoEnabled } from "@/features/auth/authEnvironment";
import { useLocale } from "@/features/preferences/localeStore";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { getThemeColors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

import { StateView } from "@/components/ui/StateView";
import { QuestBoardSkeleton } from "@/features/questBoard/components/QuestBoardStates";
import { useHirerHomeQuery } from "./api/homeQueries";
import { HirerQuestProgressCard } from "./components/HirerQuestProgressCard";
import { HirerQuestRosterModal } from "./components/HirerQuestRosterModal";
import {
  hirerHomeQuestFixtures,
  type LiveHirerQuestCardData,
} from "./hirerHomeData";
import { hirerHomeMessages } from "./hirerHomeMessages";
import { hirerHomeStyles as styles } from "./hirerHomeStyles";
export default function HomeScreen() {
  const { workspace } = useRoleWorkspace();
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const handleScroll = handleNavigationScroll;
  const metrics = getAppChromeMetrics(width, fontScale);
  const themeColors = getThemeColors(colorScheme);
  const messages = hirerHomeMessages[locale];
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const {
    data: liveQuests = [],
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useHirerHomeQuery();
  const [rosterModalQuest, setRosterModalQuest] =
    useState<LiveHirerQuestCardData | null>(null);

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
          }))
        : [];

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

  const handleOpenWorkerProfile = useCallback(
    (workerId: string) => {
      router.push(`/profile/${workerId}`);
    },
    [router]
  );
  if (workspace === "worker") return <WorkerHomeScreen />;

  if (isPending) {
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className="bg-ku-background"
      >
        <View className="flex-1 px-4 pt-6" testID="hirer-home-loading">
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
        <View className="flex-1 px-4 pt-6" testID="hirer-home-error">
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
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="hirer-home-scroll"
      >
        <View className={styles.screenContent}>
          <View className={styles.screenHeader}>
            <Text
              accessibilityRole="header"
              className={`${styles.screenTitle} text-ku-text-strong`}
              testID="hirer-home-title"
            >
              {messages.title}
            </Text>
            <Text className={`${styles.screenSubtitle} text-ku-text-secondary`}>
              {messages.subtitle}
            </Text>
          </View>

          {displayQuests.length > 0 ? (
            <>
              <View className={styles.sectionHeaderRow}>
                <Text className={`${styles.sectionTitle} text-ku-text-strong`}>
                  {messages.activeQuestTitle}
                </Text>
                {displayQuests.length > 1 ? (
                  <Chip
                    className={styles.sectionCounterBadge}
                    label={messages.activeQuestCounter(
                      activeCardIndex + 1,
                      displayQuests.length
                    )}
                    textClassName={`${styles.sectionCounterText} text-ku-primary`}
                    testID="hirer-quest-counter"
                    tone="accent"
                  />
                ) : null}
              </View>

              <View className={styles.carouselContainer}>
                <ScrollView
                  contentContainerClassName="gap-[12px]"
                  decelerationRate="fast"
                  horizontal
                  onMomentumScrollEnd={(event) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    const nextIndex = Math.round(offsetX / (cardWidth + 12));
                    setActiveCardIndex(
                      Math.max(0, Math.min(nextIndex, displayQuests.length - 1))
                    );
                  }}
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToAlignment="start"
                  snapToInterval={cardWidth + 12}
                  testID="hirer-quest-carousel"
                >
                  {displayQuests.map((item) => (
                    <View key={item.id} style={{ width: cardWidth }}>
                      <HirerQuestProgressCard
                        dueAt={item.dueAt}
                        onOpenDetails={() => handleOpenDetails(item.id)}
                        onOpenWorkerProfile={handleOpenWorkerProfile}
                        onViewRoster={() => setRosterModalQuest(item)}
                        questId={item.id}
                        status={item.status}
                        tag={item.tag}
                        title={item.title}
                        headcount={item.headcount}
                        mode={item.mode}
                        assignedWorkers={item.assignedWorkers}
                        applicants={item.applicants}
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
                            ? `${styles.paginationDotActive} bg-ku-primary`
                            : `${styles.paginationDotInactive} bg-ku-border-subtle`
                        }`}
                        key={item.id}
                        testID={`hirer-carousel-dot-${index}`}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View
              className={`${styles.emptyState} border-ku-border-subtle bg-ku-surface-muted`}
              testID="hirer-home-empty"
            >
              <Text className={`${styles.emptyTitle} text-ku-text-strong`}>
                {messages.emptyTitle}
              </Text>
              <Text
                className={`${styles.emptyDescription} text-ku-text-secondary`}
              >
                {messages.emptyDescription}
              </Text>
            </View>
          )}

          <View
            className={styles.quickAccessSection}
            testID="hirer-home-quick-access"
          >
            <Text
              accessibilityRole="header"
              className={`${styles.quickAccessTitle} text-ku-text-strong`}
            >
              {messages.quickAccessTitle}
            </Text>

            <View className={styles.quickAccessGrid}>
              <Pressable
                accessibilityLabel={`${messages.quickActiveTitle}: ${messages.quickActiveDesc}`}
                accessibilityRole="button"
                className={`${styles.quickAccessCard} border-ku-border-subtle bg-ku-surface`}
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "active" },
                  })
                }
                testID="hirer-quick-access-active"
              >
                <View
                  className={`${styles.quickAccessIconBox} bg-ku-surface-accent`}
                >
                  <Clock3
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View className={styles.quickAccessCopy}>
                  <Text
                    className={`${styles.quickAccessItemTitle} text-ku-text-strong`}
                    numberOfLines={1}
                  >
                    {messages.quickActiveTitle}
                  </Text>
                  <Text
                    className={`${styles.quickAccessItemDesc} text-ku-text-secondary`}
                    numberOfLines={1}
                  >
                    {messages.quickActiveDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickDraftTitle}: ${messages.quickDraftDesc}`}
                accessibilityRole="button"
                className={`${styles.quickAccessCard} border-ku-border-subtle bg-ku-surface`}
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "draft" },
                  })
                }
                testID="hirer-quick-access-draft"
              >
                <View
                  className={`${styles.quickAccessIconBox} bg-ku-surface-accent`}
                >
                  <FileText
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View className={styles.quickAccessCopy}>
                  <Text
                    className={`${styles.quickAccessItemTitle} text-ku-text-strong`}
                    numberOfLines={1}
                  >
                    {messages.quickDraftTitle}
                  </Text>
                  <Text
                    className={`${styles.quickAccessItemDesc} text-ku-text-secondary`}
                    numberOfLines={1}
                  >
                    {messages.quickDraftDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickHistoryTitle}: ${messages.quickHistoryDesc}`}
                accessibilityRole="button"
                className={`${styles.quickAccessCard} border-ku-border-subtle bg-ku-surface`}
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "completed" },
                  })
                }
                testID="hirer-quick-access-history"
              >
                <View
                  className={`${styles.quickAccessIconBox} bg-ku-surface-accent`}
                >
                  <History
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View className={styles.quickAccessCopy}>
                  <Text
                    className={`${styles.quickAccessItemTitle} text-ku-text-strong`}
                    numberOfLines={1}
                  >
                    {messages.quickHistoryTitle}
                  </Text>
                  <Text
                    className={`${styles.quickAccessItemDesc} text-ku-text-secondary`}
                    numberOfLines={1}
                  >
                    {messages.quickHistoryDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickBoardTitle}: ${messages.quickBoardDesc}`}
                accessibilityRole="button"
                className={`${styles.quickAccessCard} border-ku-border-subtle bg-ku-surface`}
                onPress={() => router.push("/quest-board")}
                testID="hirer-quick-access-board"
              >
                <View
                  className={`${styles.quickAccessIconBox} bg-ku-surface-accent`}
                >
                  <LayoutDashboard
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View className={styles.quickAccessCopy}>
                  <Text
                    className={`${styles.quickAccessItemTitle} text-ku-text-strong`}
                    numberOfLines={1}
                  >
                    {messages.quickBoardTitle}
                  </Text>
                  <Text
                    className={`${styles.quickAccessItemDesc} text-ku-text-secondary`}
                    numberOfLines={1}
                  >
                    {messages.quickBoardDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickTopUpTitle}: ${messages.quickTopUpDesc}`}
                accessibilityRole="button"
                className={`${styles.quickAccessCard} border-ku-border-subtle bg-ku-surface`}
                onPress={() => router.push("/money")}
                testID="hirer-quick-access-topup"
              >
                <View
                  className={`${styles.quickAccessIconBox} bg-ku-surface-accent`}
                >
                  <WalletCards
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View className={styles.quickAccessCopy}>
                  <Text
                    className={`${styles.quickAccessItemTitle} text-ku-text-strong`}
                    numberOfLines={1}
                  >
                    {messages.quickTopUpTitle}
                  </Text>
                  <Text
                    className={`${styles.quickAccessItemDesc} text-ku-text-secondary`}
                    numberOfLines={1}
                  >
                    {messages.quickTopUpDesc}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      {rosterModalQuest && (
        <HirerQuestRosterModal
          visible={Boolean(rosterModalQuest)}
          questTitle={rosterModalQuest.title}
          questId={rosterModalQuest.id}
          status={rosterModalQuest.status}
          headcount={rosterModalQuest.headcount}
          assignedWorkers={rosterModalQuest.assignedWorkers}
          applicants={rosterModalQuest.applicants}
          onClose={() => setRosterModalQuest(null)}
          onOpenWorkerProfile={handleOpenWorkerProfile}
          onOpenManageQuest={() => {
            const hasPendingSelection =
              rosterModalQuest.mode === "CANDIDATE" &&
              rosterModalQuest.applicants.length > 0;
            if (hasPendingSelection) {
              router.push({
                pathname: "/quest/[id]/select-roster",
                params: { id: rosterModalQuest.id },
              });
            } else {
              handleOpenDetails(rosterModalQuest.id);
            }
          }}
        />
      )}
    </ScreenLayout>
  );
}
