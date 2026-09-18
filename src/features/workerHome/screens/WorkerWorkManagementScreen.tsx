import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, CircleX, Clock, RefreshCw } from "lucide-react-native";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { questApi } from "@/api/QuestApi";
import type { QuestV2Assignment } from "@/api/questV2Contracts";
import { authService } from "@/features/auth/AuthService";
import {
  liveQuestService,
  type LiveQuestSnapshot,
} from "@/features/questBoard/liveQuestService";
import { useLocale } from "@/locales/LocaleProvider";
import { getThemeColors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";
import { CurrentQuestCard } from "../components/CurrentQuestCard";
import { NoWorkPromptCard } from "../components/NoWorkPromptCard";
import { WorkingNowFloatingBar } from "../components/WorkingNowFloatingBar";
import { workerHomeMessages } from "../workerHomeMessages";
import { workerHomeStyles as styles } from "../workerHomeStyles";

type ManagementTab = "applied" | "history";

export default function WorkerWorkManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const metrics = getAppChromeMetrics(width, fontScale);
  const { handleScroll } = useNavigationVisibility();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const [activeTab, setActiveTab] = useState<ManagementTab>("applied");
  const [sessionUserId, setSessionUserId] = useState<string>();
  const [currentAssignment, setCurrentAssignment] =
    useState<QuestV2Assignment | null>(null);
  const [currentSnapshot, setCurrentSnapshot] =
    useState<LiveQuestSnapshot | null>(null);
  const [appliedQuests, setAppliedQuests] = useState<QuestV2Assignment[]>([]);
  const [historyQuests, setHistoryQuests] = useState<QuestV2Assignment[]>([]);
  const [questTitles, setQuestTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void authService
      .getSession()
      .then((session) => {
        if (active && session?.user.id) setSessionUserId(session.user.id);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const allAssignments = await questApi.listMyAssignments("all");
      if (!mountedRef.current) return;

      const active = allAssignments.filter(
        (a) => a.state === "ASSIGNMENT_ACTIVE"
      );
      const history = allAssignments.filter(
        (a) =>
          a.state === "ASSIGNMENT_COMPLETED" ||
          a.state === "ASSIGNMENT_CANCELLED" ||
          a.state === "ASSIGNMENT_INCOMPLETE" ||
          a.questState === "QUEST_COMPLETED" ||
          a.questState === "QUEST_CANCELLED" ||
          a.questState === "QUEST_FAILED"
      );
      const applied = allAssignments.filter(
        (a) =>
          a.questState === "QUEST_ASSIGNED" || a.questState === "QUEST_OPEN"
      );

      setHistoryQuests(history);
      setAppliedQuests(applied);

      const questIds = [
        ...new Set(allAssignments.map((item) => item.questId)),
      ];
      void Promise.allSettled(
        questIds.map(async (questId) => {
          const detail = await questApi.getParticipationDetail(questId);
          return [questId, detail.title] as const;
        })
      ).then((titleResults) => {
        if (!mountedRef.current) return;
        const nextQuestTitles: Record<string, string> = {};
        titleResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value[1]) {
            nextQuestTitles[result.value[0]] = result.value[1];
          }
        });
        if (Object.keys(nextQuestTitles).length > 0) {
          setQuestTitles(nextQuestTitles);
        }
      });

      if (active.length > 0) {
        const topActive = active[0];
        setCurrentAssignment(topActive);

        if (sessionUserId) {
          try {
            const snap = await liveQuestService.getLiveSnapshot(
              topActive.questId,
              sessionUserId
            );
            if (mountedRef.current) {
              setCurrentSnapshot(snap);
              if (snap?.quest?.title) {
                setQuestTitles((titles) => ({
                  ...titles,
                  [topActive.questId]: snap.quest.title,
                }));
              }
            }
          } catch {
            // keep topActive without snapshot
          }
        }
      } else {
        setCurrentAssignment(null);
        setCurrentSnapshot(null);
      }
    } catch {
      // fallback
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [sessionUserId]);

  /* eslint-disable react-hooks/set-state-in-effect -- initial async load updates screen */
  useEffect(() => {
    void loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const bottomNavInset = getBottomNavigationInset(metrics, insets.bottom);
  const scrollBottomPadding =
    bottomNavInset + (currentAssignment ? 76 : 16) + spacing.xl;
  const currentQuestState =
    currentSnapshot?.state ?? currentAssignment?.questState;
  const currentQuestCanSubmit =
    currentSnapshot?.capabilities !== undefined
      ? currentSnapshot.capabilities.canSubmitProof ||
        currentSnapshot.capabilities.canConfirmCompletion
      : currentQuestState === "QUEST_IN_PROGRESS";
  const currentQuestSubmissionPending =
    currentSnapshot?.proofs?.some(
      (proof) => proof.status === "PROOF_PENDING"
    ) ?? false;

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: 16,
          paddingTop: 14,
        }}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            colors={[themeColors.primaryDeep]}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            tintColor={themeColors.primaryDeep}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="worker-work-management-scroll"
      >
        {/* Header Title: Work */}
        <View style={{ paddingHorizontal: 4, marginBottom: 14 }}>
          <Text
            accessibilityRole="header"
            style={[styles.screenTitle, { color: themeColors.textStrong }]}
            testID="work-management-title"
          >
            {messages.workTitle}
          </Text>
        </View>

        {/* Section 1: Current Quest Card OR No Work Prompt */}
        {loading && !currentAssignment ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={themeColors.primaryDeep} />
          </View>
        ) : currentAssignment ? (
          <CurrentQuestCard
            assignment={currentAssignment}
            hirerName={
              currentSnapshot?.quest &&
              "hirerName" in currentSnapshot.quest &&
              typeof currentSnapshot.quest.hirerName === "string"
                ? currentSnapshot.quest.hirerName
                : "Hirer"
            }
            onPress={() => {
              router.push({
                pathname: "/quest/[id]/work",
                params: { id: currentAssignment.questId },
              });
            }}
            onSubmit={() => {
              router.push({
                pathname: "/quest/[id]/proof",
                params: { id: currentAssignment.questId },
              });
            }}
            proofRequired={currentSnapshot?.proofRequired}
            state={currentQuestState}
            submitEnabled={currentQuestCanSubmit}
            submissionPending={currentQuestSubmissionPending}
            title={currentSnapshot?.quest.title}
          />
        ) : (
          /* "if no work yet just like have prompt like go find quest you like and navigate to quest finding in the home page" */
          <NoWorkPromptCard
            onFindQuests={() => {
              router.replace("/(tabs)");
            }}
          />
        )}

        {/* Section 2: Tabs Row: [Applied quest] [History] + (⟳) */}
        <View style={styles.managementTabsRow}>
          <View style={styles.tabsGroup}>
            {/* Tab 1: Applied quest */}
            <Pressable
              accessibilityLabel={`${messages.appliedTab} tab (${appliedQuests.length})`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "applied" }}
              onPress={() => setActiveTab("applied")}
              style={[
                styles.managementTabItem,
                activeTab === "applied"
                  ? {
                      backgroundColor: themeColors.primaryDeep,
                      borderColor: themeColors.primaryDeep,
                    }
                  : {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.borderSubtle,
                    },
              ]}
              testID="tab-applied-quest"
            >
              <Text
                style={[
                  styles.managementTabText,
                  {
                    color:
                      activeTab === "applied"
                        ? themeColors.white
                        : themeColors.textSecondary,
                  },
                ]}
              >
                {messages.appliedTab}
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  {
                    backgroundColor:
                      activeTab === "applied"
                        ? "rgba(255,255,255,0.25)"
                        : themeColors.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color:
                      activeTab === "applied"
                        ? themeColors.white
                        : themeColors.textSecondary,
                  }}
                >
                  {appliedQuests.length}
                </Text>
              </View>
            </Pressable>

            {/* Tab 2: History */}
            <Pressable
              accessibilityLabel={`${messages.historyTab} tab (${historyQuests.length})`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "history" }}
              onPress={() => setActiveTab("history")}
              style={[
                styles.managementTabItem,
                activeTab === "history"
                  ? {
                      backgroundColor: themeColors.primaryDeep,
                      borderColor: themeColors.primaryDeep,
                    }
                  : {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.borderSubtle,
                    },
              ]}
              testID="tab-history-quest"
            >
              <Text
                style={[
                  styles.managementTabText,
                  {
                    color:
                      activeTab === "history"
                        ? themeColors.white
                        : themeColors.textSecondary,
                  },
                ]}
              >
                {messages.historyTab}
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  {
                    backgroundColor:
                      activeTab === "history"
                        ? "rgba(255,255,255,0.25)"
                        : themeColors.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color:
                      activeTab === "history"
                        ? themeColors.white
                        : themeColors.textSecondary,
                  }}
                >
                  {historyQuests.length}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Refresh icon (⟳) */}
          <Pressable
            accessibilityLabel="Refresh work list"
            accessibilityRole="button"
            onPress={handleRefresh}
            style={[
              styles.refreshIconButton,
              { backgroundColor: themeColors.surfaceMuted },
            ]}
            testID="work-management-refresh-btn"
          >
            <RefreshCw size={16} color={themeColors.primaryDeep} />
          </Pressable>
        </View>

        {activeTab === "applied" ? (
          appliedQuests.length > 0 ? (
            <View style={styles.cardList} testID="applied-quests-list">
              {appliedQuests.map((quest) => {
                const questTitle =
                  questTitles[quest.questId] ??
                  messages.questDetailsUnavailable;
                const statusLabel =
                  quest.questState === "QUEST_IN_PROGRESS"
                    ? messages.stateInProgress
                    : messages.stateAssigned;
                return (
                  <Pressable
                    accessibilityLabel={questTitle}
                    accessibilityRole="button"
                    key={quest.id}
                    onPress={() => {
                      router.push({
                        pathname: "/quest/[id]",
                        params: {
                          id: quest.questId,
                          joinStatus: "accepted",
                          mode: "join",
                        },
                      });
                    }}
                    style={[
                      styles.feedCard,
                      {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.borderSubtle,
                      },
                    ]}
                    testID={`applied-quest-item-${quest.id}`}
                  >
                    <View style={styles.feedCardTop}>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.cardTitle,
                          { color: themeColors.textStrong },
                        ]}
                      >
                        {questTitle}
                      </Text>
                      <View
                        style={[
                          styles.badgePill,
                          {
                            backgroundColor: themeColors.surfaceAccent,
                            borderColor: themeColors.borderAccent,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: themeColors.primaryDeep },
                          ]}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardMetaRow}>
                      <View style={styles.cardMetaItem}>
                        <Clock size={13} color={themeColors.textSecondary} />
                        <Text
                          style={[
                            styles.cardMetaText,
                            { color: themeColors.textSecondary },
                          ]}
                        >
                          {new Date(quest.createdAt).toLocaleDateString(
                            locale === "th" ? "th-TH" : "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: themeColors.surfaceMuted,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              testID="applied-quests-empty"
            >
              <Text
                style={[styles.emptyTitle, { color: themeColors.textStrong }]}
              >
                {messages.noAppliedQuests}
              </Text>
            </View>
          )
        ) : historyQuests.length > 0 ? (
          <View style={styles.cardList} testID="history-quests-list">
            {historyQuests.map((quest) => {
              const questTitle =
                questTitles[quest.questId] ?? messages.questDetailsUnavailable;
              const isCompleted =
                quest.state === "ASSIGNMENT_COMPLETED" ||
                quest.questState === "QUEST_COMPLETED";
              return (
                <Pressable
                  accessibilityLabel={questTitle}
                  accessibilityRole="button"
                  key={quest.id}
                  onPress={() => {
                    router.push({
                      pathname: "/quest/[id]",
                      params: {
                        id: quest.questId,
                        joinStatus: "history",
                        mode: "join",
                      },
                    });
                  }}
                  style={[
                    styles.feedCard,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.borderSubtle,
                    },
                  ]}
                  testID={`history-quest-item-${quest.id}`}
                >
                  <View style={styles.feedCardTop}>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.cardTitle,
                        { color: themeColors.textStrong },
                      ]}
                    >
                      {questTitle}
                    </Text>
                    <View
                      style={[
                        styles.badgePill,
                        isCompleted
                          ? {
                              backgroundColor: themeColors.surfaceSuccess,
                              borderColor: themeColors.borderSuccess,
                            }
                          : {
                              backgroundColor: themeColors.surfaceMuted,
                              borderColor: themeColors.borderSubtle,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: isCompleted
                              ? themeColors.success
                              : themeColors.textSecondary,
                          },
                        ]}
                      >
                        {isCompleted
                          ? messages.statusCompleted
                          : messages.statusCancelled}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.cardMetaItem}>
                      {isCompleted ? (
                        <CheckCircle2 size={14} color={themeColors.success} />
                      ) : (
                        <CircleX size={14} color={themeColors.textSecondary} />
                      )}
                      <Text
                        style={[
                          styles.cardMetaText,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        {new Date(quest.createdAt).toLocaleDateString(
                          locale === "th" ? "th-TH" : "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: themeColors.surfaceMuted,
                borderColor: themeColors.borderSubtle,
              },
            ]}
            testID="history-quests-empty"
          >
            <Text
              style={[styles.emptyTitle, { color: themeColors.textStrong }]}
            >
              {messages.noHistoryQuests}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Working Now - [Time eclips] floating bar */}
      <WorkingNowFloatingBar
        assignment={currentAssignment}
        bottomInset={bottomNavInset}
        onPress={() => {
          router.push("/my-quests");
        }}
        questTitle={
          currentSnapshot?.quest.title ??
          (currentAssignment
            ? questTitles[currentAssignment.questId]
            : undefined)
        }
      />
    </ScreenLayout>
  );
}
