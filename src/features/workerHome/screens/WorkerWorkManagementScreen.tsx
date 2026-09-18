import { useCallback, useEffect, useMemo, useState } from "react";
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
import { handleNavigationScroll } from "@/features/navigation/navigationUiStore";
import { useLocale } from "@/features/preferences/localeStore";
import { authService } from "@/features/auth/AuthService";
import {
  useWorkerAssignmentTitlesQuery,
  useWorkerAssignmentsQuery,
  useWorkerLiveSnapshotQuery,
} from "../api/workerHomeQueries";
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
  const handleScroll = handleNavigationScroll;
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const [activeTab, setActiveTab] = useState<ManagementTab>("applied");
  const [sessionUserId, setSessionUserId] = useState<string>();

  useEffect(() => {
    void authService
      .getSession()
      .then((session) => {
        if (session?.user.id) setSessionUserId(session.user.id);
      })
      .catch(() => undefined);
  }, []);

  const assignmentsQuery = useWorkerAssignmentsQuery("all");
  const allAssignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  );
  const activeAssignments = useMemo(
    () =>
      allAssignments.filter(
        (assignment) => assignment.state === "ASSIGNMENT_ACTIVE"
      ),
    [allAssignments]
  );
  const historyQuests = useMemo(
    () =>
      allAssignments.filter(
        (assignment) =>
          assignment.state === "ASSIGNMENT_COMPLETED" ||
          assignment.state === "ASSIGNMENT_CANCELLED" ||
          assignment.state === "ASSIGNMENT_INCOMPLETE" ||
          assignment.questState === "QUEST_COMPLETED" ||
          assignment.questState === "QUEST_CANCELLED" ||
          assignment.questState === "QUEST_FAILED"
      ),
    [allAssignments]
  );
  const appliedQuests = useMemo(
    () =>
      allAssignments.filter(
        (assignment) =>
          assignment.questState === "QUEST_ASSIGNED" ||
          assignment.questState === "QUEST_OPEN"
      ),
    [allAssignments]
  );
  const currentAssignment = activeAssignments[0] ?? null;
  const questIds = useMemo(
    () => allAssignments.map((assignment) => assignment.questId),
    [allAssignments]
  );
  const titlesQuery = useWorkerAssignmentTitlesQuery(questIds);
  const questTitles = titlesQuery.data ?? {};
  const snapshotQuery = useWorkerLiveSnapshotQuery(
    currentAssignment?.questId ?? null,
    sessionUserId ?? null
  );
  const currentSnapshot = snapshotQuery.data ?? null;

  const handleRefresh = useCallback(() => {
    void Promise.all([
      assignmentsQuery.refetch(),
      titlesQuery.refetch(),
      currentAssignment && sessionUserId
        ? snapshotQuery.refetch()
        : Promise.resolve(),
    ]);
  }, [
    assignmentsQuery,
    currentAssignment,
    sessionUserId,
    snapshotQuery,
    titlesQuery,
  ]);

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
            refreshing={
              assignmentsQuery.isRefetching ||
              titlesQuery.isRefetching ||
              snapshotQuery.isRefetching
            }
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
        {assignmentsQuery.isPending && !currentAssignment ? (
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
