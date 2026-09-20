import { useCallback, useMemo, useState } from "react";
import {
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
import { useSessionQuery } from "@/features/auth/sessionQueries";
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
  const sessionQuery = useSessionQuery();
  const sessionUserId = sessionQuery.data?.user.id;

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
        contentContainerClassName="px-ku-md pt-[14px]"
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
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
        <View className="mb-[14px] px-[4px]">
          <Text
            accessibilityRole="header"
            className={`${styles.screenTitle} text-ku-text-strong`}
            testID="work-management-title"
          >
            {messages.workTitle}
          </Text>
        </View>

        {/* Section 1: Current Quest Card OR No Work Prompt */}
        {assignmentsQuery.isError ? (
          <View
            className={`${styles.errorState} border-ku-border-subtle bg-ku-surface-muted`}
            testID="worker-work-management-error"
          >
            <Text className={`${styles.errorText} text-ku-text-strong`}>
              {messages.errorTitle}
            </Text>
            <Pressable
              accessibilityLabel={messages.errorRetry}
              accessibilityRole="button"
              className={`${styles.retryButton} bg-ku-primary-dark`}
              onPress={() => void assignmentsQuery.refetch()}
              testID="worker-work-management-retry"
            >
              <Text className={`${styles.retryText} text-ku-on-primary`}>
                {messages.errorRetry}
              </Text>
            </Pressable>
          </View>
        ) : assignmentsQuery.isPending && !currentAssignment ? (
          <View
            className="items-center py-ku-md"
            testID="worker-work-management-loading"
          ></View>
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

        <View className={styles.managementTabsRow}>
          <View className={styles.tabsGroup}>
            <Pressable
              accessibilityLabel={`${messages.appliedTab} tab (${appliedQuests.length})`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "applied" }}
              className={`${styles.managementTabItem} ${
                activeTab === "applied"
                  ? "border-ku-primary-dark bg-ku-primary-dark"
                  : "border-ku-border-subtle bg-ku-surface"
              }`}
              onPress={() => setActiveTab("applied")}
              testID="tab-applied-quest"
            >
              <Text
                className={`${styles.managementTabText} ${
                  activeTab === "applied"
                    ? "text-ku-on-primary"
                    : "text-ku-text-secondary"
                }`}
              >
                {messages.appliedTab}
              </Text>
              <View
                className={`${styles.tabCountBadge} ${
                  activeTab === "applied"
                    ? "bg-ku-on-primary/[0.25]"
                    : "bg-ku-surface-muted"
                }`}
              >
                <Text
                  className={`font-ku-bold text-ku-caption ${
                    activeTab === "applied"
                      ? "text-ku-on-primary"
                      : "text-ku-text-secondary"
                  }`}
                >
                  {appliedQuests.length}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel={`${messages.historyTab} tab (${historyQuests.length})`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "history" }}
              className={`${styles.managementTabItem} ${
                activeTab === "history"
                  ? "border-ku-primary-dark bg-ku-primary-dark"
                  : "border-ku-border-subtle bg-ku-surface"
              }`}
              onPress={() => setActiveTab("history")}
              testID="tab-history-quest"
            >
              <Text
                className={`${styles.managementTabText} ${
                  activeTab === "history"
                    ? "text-ku-on-primary"
                    : "text-ku-text-secondary"
                }`}
              >
                {messages.historyTab}
              </Text>
              <View
                className={`${styles.tabCountBadge} ${
                  activeTab === "history"
                    ? "bg-ku-on-primary/[0.25]"
                    : "bg-ku-surface-muted"
                }`}
              >
                <Text
                  className={`font-ku-bold text-ku-caption ${
                    activeTab === "history"
                      ? "text-ku-on-primary"
                      : "text-ku-text-secondary"
                  }`}
                >
                  {historyQuests.length}
                </Text>
              </View>
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel="Refresh work list"
            accessibilityRole="button"
            className={`${styles.refreshIconButton} bg-ku-surface-muted`}
            onPress={handleRefresh}
            testID="work-management-refresh-btn"
          >
            <RefreshCw size={16} color={themeColors.primaryDeep} />
          </Pressable>
        </View>

        {activeTab === "applied" ? (
          appliedQuests.length > 0 ? (
            <View className={styles.cardList} testID="applied-quests-list">
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
                    className={`${styles.feedCard} border-ku-border-subtle bg-ku-surface`}
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
                    testID={`applied-quest-item-${quest.id}`}
                  >
                    <View className={styles.feedCardTop}>
                      <Text
                        className={`${styles.cardTitle} text-ku-text-strong`}
                        numberOfLines={2}
                      >
                        {questTitle}
                      </Text>
                      <View
                        className={`${styles.badgePill} border-ku-border-accent bg-ku-surface-accent`}
                      >
                        <Text
                          className={`${styles.badgeText} text-ku-primary-dark`}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                    <View className={styles.cardMetaRow}>
                      <View className={styles.cardMetaItem}>
                        <Clock size={13} color={themeColors.textSecondary} />
                        <Text
                          className={`${styles.cardMetaText} text-ku-text-secondary`}
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
              className={`${styles.emptyState} border-ku-border-subtle bg-ku-surface-muted`}
              testID="applied-quests-empty"
            >
              <Text className={`${styles.emptyTitle} text-ku-text-strong`}>
                {messages.noAppliedQuests}
              </Text>
            </View>
          )
        ) : historyQuests.length > 0 ? (
          <View className={styles.cardList} testID="history-quests-list">
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
                  className={`${styles.feedCard} border-ku-border-subtle bg-ku-surface`}
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
                  testID={`history-quest-item-${quest.id}`}
                >
                  <View className={styles.feedCardTop}>
                    <Text
                      className={`${styles.cardTitle} text-ku-text-strong`}
                      numberOfLines={2}
                    >
                      {questTitle}
                    </Text>
                    <View
                      className={`${styles.badgePill} ${
                        isCompleted
                          ? "border-ku-border-success bg-ku-surface-success"
                          : "border-ku-border-subtle bg-ku-surface-muted"
                      }`}
                    >
                      <Text
                        className={`${styles.badgeText} ${
                          isCompleted
                            ? "text-ku-success"
                            : "text-ku-text-secondary"
                        }`}
                      >
                        {isCompleted
                          ? messages.statusCompleted
                          : messages.statusCancelled}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.cardMetaRow}>
                    <View className={styles.cardMetaItem}>
                      {isCompleted ? (
                        <CheckCircle2 size={14} color={themeColors.success} />
                      ) : (
                        <CircleX size={14} color={themeColors.textSecondary} />
                      )}
                      <Text
                        className={`${styles.cardMetaText} text-ku-text-secondary`}
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
            className={`${styles.emptyState} border-ku-border-subtle bg-ku-surface-muted`}
            testID="history-quests-empty"
          >
            <Text className={`${styles.emptyTitle} text-ku-text-strong`}>
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
