import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, ScrollView, Text, View } from "@/tw";
import {
  Clock3,
  FileText,
  History,
  LayoutDashboard,
  WalletCards,
} from "lucide-react-native";

import { questApi } from "@/api/QuestApi";
import { studentApi } from "@/api/StudentApi";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { isPrototypeDemoEnabled } from "@/features/auth/authEnvironment";
import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { useLocale } from "@/locales/LocaleProvider";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { getThemeColors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

import { HirerQuestProgressCard } from "./components/HirerQuestProgressCard";
import { HirerQuestRosterModal } from "./components/HirerQuestRosterModal";
import {
  hirerHomeQuestFixtures,
  type CanonicalHirerQuestStatus,
  type LiveHirerQuestCardData,
  type QuestMemberProfile,
} from "./hirerHomeData";
import { hirerHomeMessages } from "./hirerHomeMessages";
import { hirerHomeStyles as styles } from "./hirerHomeStyles";
export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { handleScroll } = useNavigationVisibility();
  const metrics = getAppChromeMetrics(width, fontScale);
  const themeColors = getThemeColors(colorScheme);
  const messages = hirerHomeMessages[locale];
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [liveQuests, setLiveQuests] = useState<LiveHirerQuestCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rosterModalQuest, setRosterModalQuest] =
    useState<LiveHirerQuestCardData | null>(null);

  const fetchActiveQuests = useCallback(async () => {
    try {
      const res = await questApi.listMine({ limit: 50 });
      const mineQuests = res.items;

      // Active and open quests created by this Hirer (exclude cancelled & completed)
      const activeQuests = mineQuests.filter(
        (q) => q.state !== "QUEST_CANCELLED" && q.state !== "QUEST_COMPLETED"
      );

      const cardPromises = activeQuests.map(async (q) => {
        const [assignments, applications] = await Promise.all([
          questApi.listQuestAssignments(q.id).catch(() => []),
          q.mode === "CANDIDATE"
            ? questApi.listApplications(q.id).catch(() => [])
            : Promise.resolve([]),
        ]);

        const memberIds = Array.from(
          new Set([
            ...assignments.map((a) => a.workerId),
            ...applications.map((a) => a.memberId),
          ])
        );

        const profileMap = new Map<string, QuestMemberProfile>();
        await Promise.all(
          memberIds.map(async (id) => {
            try {
              const p = await studentApi.getPublicProfile(id);
              const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
              profileMap.set(id, {
                id,
                displayName: name || "KU Student",
                avatarUri: p.avatar?.url,
                faculty: p.department?.faculty?.name,
              });
            } catch {
              profileMap.set(id, {
                id,
                displayName: "KU Student",
              });
            }
          })
        );

        const assignedWorkers = assignments
          .map((a) => profileMap.get(a.workerId))
          .filter((p): p is QuestMemberProfile => Boolean(p));

        const applicantsList = applications
          .filter((app) => app.state === "APPLICATION_APPLIED")
          .map((app) => profileMap.get(app.memberId))
          .filter((p): p is QuestMemberProfile => Boolean(p));

        return {
          id: q.id,
          title: q.title,
          tag: q.tag?.name,
          status: q.state as CanonicalHirerQuestStatus,
          mode: q.mode,
          participation: q.participation,
          headcount: q.headcount,
          dueAt: q.dueAt,
          assignedWorkers,
          applicants: applicantsList,
        };
      });

      const cards = await Promise.all(cardPromises);
      setLiveQuests(cards);
    } catch (err) {
      console.warn("[HomeScreen] Failed to load active quests:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchActiveQuests();
    }, [fetchActiveQuests])
  );

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
        pathname: "/quest/[id]/manage",
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
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchActiveQuests();
            }}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="hirer-home-scroll"
      >
        <View style={styles.screenContent}>
          <View style={styles.screenHeader}>
            <Text
              accessibilityRole="header"
              style={[styles.screenTitle, { color: themeColors.textStrong }]}
              testID="hirer-home-title"
            >
              {messages.title}
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

          {displayQuests.length > 0 ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: themeColors.textStrong },
                  ]}
                >
                  {messages.activeQuestTitle}
                </Text>
                {displayQuests.length > 1 ? (
                  <View
                    style={[
                      styles.sectionCounterBadge,
                      {
                        backgroundColor: themeColors.surfaceAccent,
                        borderColor: themeColors.borderAccent,
                      },
                    ]}
                    testID="hirer-quest-counter"
                  >
                    <Text
                      style={[
                        styles.sectionCounterText,
                        { color: themeColors.primary },
                      ]}
                    >
                      {messages.activeQuestCounter(
                        activeCardIndex + 1,
                        displayQuests.length
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.carouselContainer}>
                <ScrollView
                  contentContainerStyle={{ gap: 12 }}
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
                    style={styles.carouselPagination}
                    testID="hirer-quest-carousel-dots"
                  >
                    {displayQuests.map((item, index) => (
                      <View
                        key={item.id}
                        style={[
                          styles.paginationDot,
                          index === activeCardIndex
                            ? [
                                styles.paginationDotActive,
                                { backgroundColor: themeColors.primary },
                              ]
                            : [
                                styles.paginationDotInactive,
                                { backgroundColor: themeColors.borderSubtle },
                              ],
                        ]}
                        testID={`hirer-carousel-dot-${index}`}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: themeColors.surfaceMuted,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              testID="hirer-home-empty"
            >
              <Text
                style={[styles.emptyTitle, { color: themeColors.textStrong }]}
              >
                {messages.emptyTitle}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: themeColors.textSecondary },
                ]}
              >
                {messages.emptyDescription}
              </Text>
            </View>
          )}

          {/* Quick Access Section */}
          <View
            style={styles.quickAccessSection}
            testID="hirer-home-quick-access"
          >
            <Text
              accessibilityRole="header"
              style={[
                styles.quickAccessTitle,
                { color: themeColors.textStrong },
              ]}
            >
              {messages.quickAccessTitle}
            </Text>

            <View style={styles.quickAccessGrid}>
              <Pressable
                accessibilityLabel={`${messages.quickActiveTitle}: ${messages.quickActiveDesc}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "active" },
                  })
                }
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-active"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <Clock3
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickActiveTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickActiveDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickDraftTitle}: ${messages.quickDraftDesc}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "draft" },
                  })
                }
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-draft"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <FileText
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickDraftTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickDraftDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickHistoryTitle}: ${messages.quickHistoryDesc}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/my-quests",
                    params: { role: "hirer", tab: "completed" },
                  })
                }
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-history"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <History
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickHistoryTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickHistoryDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickBoardTitle}: ${messages.quickBoardDesc}`}
                accessibilityRole="button"
                onPress={() => router.push("/quest-board")}
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-board"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <LayoutDashboard
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickBoardTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {messages.quickBoardDesc}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityLabel={`${messages.quickTopUpTitle}: ${messages.quickTopUpDesc}`}
                accessibilityRole="button"
                onPress={() => router.push("/top-up")}
                style={[
                  styles.quickAccessCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="hirer-quick-access-topup"
              >
                <View
                  style={[
                    styles.quickAccessIconBox,
                    { backgroundColor: themeColors.surfaceAccent },
                  ]}
                >
                  <WalletCards
                    color={themeColors.primary}
                    size={22}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={styles.quickAccessCopy}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemTitle,
                      { color: themeColors.textStrong },
                    ]}
                  >
                    {messages.quickTopUpTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.quickAccessItemDesc,
                      { color: themeColors.textSecondary },
                    ]}
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
          onOpenManageQuest={handleOpenDetails}
        />
      )}
    </ScreenLayout>
  );
}
