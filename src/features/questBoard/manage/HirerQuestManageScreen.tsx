import { ActivityIndicator, RefreshControl } from "react-native";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import {
  AlertTriangle,
  Banknote,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  FileEdit,
  Hourglass,
  Info,
  Lock,
  MessageSquare,
  ShieldCheck,
  UsersRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { goBackOrReplace } from "@/utils/navigation";
import { CancelQuestGuardrailSheet } from "./CancelQuestGuardrailSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TopBar } from "@/components/ui/TopBar";
import { formatTimestamp, isDeviceOutsideBangkokZone } from "@/domain/datetime";
import { useServerCountdown } from "@/features/questBoard/shared/useServerCountdown";
import { formatSatang } from "@/domain/satang";
import { CandidateReviewSheet } from "@/features/questBoard/teamAssemble/components/CandidateReviewSheet";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { PartialGroupStartConsentContent } from "@/features/questBoard/teamAssemble/components/PartialGroupStartConsentContent";
import { QuestConditionEditModal } from "@/features/questBoard/shared/components/QuestConditionEditModal";
import { QuestConditionEditStatusCard } from "@/features/questBoard/shared/components/QuestConditionEditStatusCard";
import { myQuestMessages } from "@/locales/myQuestMessages";
import { questNextActionLabels } from "@/locales/questStatusLabels";
import { questWorkMessages } from "@/locales/questWorkMessages";
import { useHirerQuestManageFeature } from "./useHirerQuestManageFeature";
import { getCancelTier } from "./cancelQuestGuardrail";
import { useFileDispute } from "@/features/questBoard/dispute/useFileDispute";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import {
  QuestActor,
  QuestApplicationStatus,
  QuestEditRequestStatus,
  QuestMode,
  QuestNextAction,
  QuestParticipation,
  QuestStatus,
  QuestTeamStatus,
} from "../domain/types";

export interface HirerQuestManageScreenProps {
  questId?: string;
}

type PrimaryActionTone = "hirer" | "warning" | "danger";

const primaryActionTones: Record<
  PrimaryActionTone,
  { frame: string; text: string; icon: "onHirer" | "warningDark" }
> = {
  hirer: { frame: "bg-ku-hirer", text: "text-ku-on-hirer", icon: "onHirer" },
  warning: {
    frame: "border border-ku-border-warning bg-ku-surface-warning",
    text: "text-ku-text-strong",
    icon: "warningDark",
  },
  danger: { frame: "bg-ku-danger", text: "text-ku-on-hirer", icon: "onHirer" },
};

function PrimaryAction({
  icon: Icon,
  label,
  onPress,
  testID,
  tone = "hirer",
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  testID: string;
  tone?: PrimaryActionTone;
}) {
  const variant = primaryActionTones[tone];
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      className={cn(
        "min-h-[52px] flex-row items-center justify-center gap-ku-sm rounded-ku-pill px-ku-lg py-ku-12 active:opacity-80",
        variant.frame
      )}
    >
      <Icon color={colors[variant.icon]} size={20} strokeWidth={2.2} />
      <Text
        className={cn("shrink font-ku-semibold text-ku-control", variant.text)}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onPress,
  testID,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      className="min-h-[60px] flex-row items-center gap-ku-12 rounded-ku-card border border-ku-border bg-ku-surface px-ku-md py-ku-sm active:opacity-80"
    >
      <Icon color={colors.hirer} size={20} strokeWidth={2} />
      <Text className="flex-1 font-ku-medium text-ku-body text-ku-text-strong">
        {label}
      </Text>
      <ChevronRight color={colors.textSecondary} size={20} strokeWidth={2} />
    </Pressable>
  );
}

function ScheduleRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View className="flex-row items-start gap-ku-12 border-t border-ku-divider py-ku-12">
      <View className="mt-ku-2">
        <Icon color={colors.hirer} size={18} strokeWidth={2} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-ku-label text-ku-text-secondary">{label}</Text>
        <Text className="mt-ku-1 font-ku-medium text-ku-body text-ku-text-strong">
          {value}
        </Text>
      </View>
    </View>
  );
}

function StartsIn({
  startTime,
  format,
}: {
  startTime: string;
  format: (days: number, hours: number, minutes: number) => string;
}) {
  const remaining = useServerCountdown(startTime);
  if (!remaining) return null;
  const totalMinutes = Math.floor(remaining / 60_000);
  return (
    <Text
      testID="hirer-manage-starts-in"
      className="font-ku-semibold text-ku-body-small text-ku-hirer-dark"
    >
      {format(
        Math.floor(totalMinutes / 1440),
        Math.floor((totalMinutes % 1440) / 60),
        totalMinutes % 60
      )}
    </Text>
  );
}

export default function HirerQuestManageScreen({
  questId,
}: HirerQuestManageScreenProps) {
  const view = useHirerQuestManageFeature(questId);
  const { colors } = useAppTheme();
  const {
    router,
    locale,
    messages,
    viewerId,
    snapshotQuery,
    snapshot,
    isNotFound,
    error,
    originalConditionItems,
    pendingProof,
    terminal,
    cancelDescription,
    guardrailTier,
    commandBusy,
    setGuardrailTier,
    confirmGuardrailCancel,
    canReviewCandidateProposals,
    canProposeConditionEdit,
    candidateOpen,
    setCandidateOpen,
    underfilledOpen,
    setUnderfilledOpen,
    conditionEditOpen,
    setConditionEditOpen,
    conditionEditSubmitting,
    conditionEditError,
    decideUnderfilled,
    openChat,
    selectApplication,
    selectTeam,
    cancel,
    reviewProof,
    submitConditionEdit,
  } = view;
  const { confirmFileDispute } = useFileDispute();
  const topBar = (
    <TopBar
      title={messages.manageQuestTitle}
      onBackPress={() => goBackOrReplace(router, "/(tabs)/my-quests")}
      backLabel={messages.back}
    />
  );

  if (snapshotQuery.isPending)
    return (
      <ScreenLayout className="flex-1 bg-ku-background">
        {topBar}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            accessibilityLabel={messages.loading}
            color={colors.hirer}
          />
        </View>
      </ScreenLayout>
    );
  if (error || !snapshot)
    return (
      <ScreenLayout className="flex-1 bg-ku-background">
        {topBar}
        <View className="flex-1 items-center justify-center px-ku-lg">
          <Text className="text-center font-ku-bold text-ku-emphasis text-ku-text-strong">
            {isNotFound
              ? messages.questNotFound
              : (error ?? messages.questNotFound)}
          </Text>
          {isNotFound ? (
            <Text className="mt-ku-sm text-center text-ku-body-small text-ku-text-secondary">
              {messages.questNotFoundDescription}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            testID={isNotFound ? "hirer-manage-back" : "hirer-manage-retry"}
            className="mt-ku-md min-h-[48px] items-center justify-center rounded-ku-pill bg-ku-hirer px-ku-20 active:opacity-80"
            onPress={() =>
              isNotFound
                ? goBackOrReplace(router, "/(tabs)/my-quests")
                : void snapshotQuery.refetch()
            }
          >
            <Text className="font-ku-semibold text-ku-body-small text-ku-on-hirer">
              {isNotFound ? messages.back : messages.retry}
            </Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );

  const quest = snapshot.quest;
  const isGroup = snapshot.participation === QuestParticipation.GROUP;
  const submittedTeams = snapshot.teams.filter(
    (team) => team.state === QuestTeamStatus.TEAM_SUBMITTED
  );
  const proposalCount = isGroup
    ? submittedTeams.length
    : snapshot.applications.filter(
        (application) =>
          application.state === QuestApplicationStatus.APPLICATION_APPLIED
      ).length;
  const assignedCount = snapshot.assignments.length;
  const proposalCountLabel = isGroup
    ? messages.submittedTeamCount(proposalCount)
    : messages.applicationCount(proposalCount);
  const candidateReviewLabel = `${messages.reviewCandidates} · ${proposalCountLabel}`;
  const showCandidateReview = canReviewCandidateProposals && proposalCount > 0;
  const showProofReview =
    Boolean(pendingProof) && snapshot.capabilities.canReviewProof;
  const showUnderfilled =
    snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED &&
    snapshot.capabilities.canDecideUnderfilled;
  const showDispute =
    snapshot.state === QuestStatus.QUEST_FAILED &&
    (snapshot.actor === QuestActor.HIRER ||
      (snapshot.actor === QuestActor.WORKER && snapshot.assignment !== null));
  const nextStep = showUnderfilled
    ? "underfilled"
    : showProofReview && snapshot.nextAction === QuestNextAction.REVIEW_PROOF
      ? "proof"
      : showCandidateReview &&
          snapshot.nextAction ===
            (isGroup
              ? QuestNextAction.SELECT_TEAM
              : QuestNextAction.SELECT_CANDIDATE)
        ? "candidate"
        : null;
  const editPending =
    snapshot.editRequest?.status ===
    QuestEditRequestStatus.EDIT_REQUEST_PENDING;
  const showWorkChat =
    snapshot.capabilities.canReadWorkChat && Boolean(snapshot.workConversation);
  const modeLabel =
    snapshot.mode === QuestMode.CANDIDATE
      ? myQuestMessages[locale].modeCandidate
      : myQuestMessages[locale].modeFirstCome;
  const activeState =
    snapshot.state === QuestStatus.QUEST_OPEN ||
    snapshot.state === QuestStatus.QUEST_ASSIGNED ||
    snapshot.state === QuestStatus.QUEST_IN_PROGRESS;
  const rewardPerWorker = quest.questReward ?? null;
  const fundingTotal =
    "questFundingTotal" in quest ? quest.questFundingTotal : null;
  // Group + Candidate: only the Team Leader starts, so a per-Worker count misleads.
  const showStarted =
    assignedCount > 0 &&
    (snapshot.state === QuestStatus.QUEST_ASSIGNED ||
      snapshot.state === QuestStatus.QUEST_IN_PROGRESS) &&
    !(isGroup && snapshot.mode === QuestMode.CANDIDATE);
  const startedCount = snapshot.assignments.filter(
    (assignment) => assignment.startedAt
  ).length;
  const zoneNote = isDeviceOutsideBangkokZone()
    ? ` · ${messages.manageBangkokTime}`
    : "";
  const waitingNote =
    nextStep || snapshot.state !== QuestStatus.QUEST_OPEN
      ? null
      : snapshot.mode === QuestMode.CANDIDATE
        ? messages.manageCandidateAutoCancel
        : isGroup
          ? messages.groupFcfsUnderfillRule
          : messages.noSelectionNeeded;

  return (
    <ScreenLayout className="flex-1 bg-ku-background">
      {topBar}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={snapshotQuery.isRefetching}
            onRefresh={() => void snapshotQuery.refetch()}
          />
        }
        contentContainerClassName="w-full max-w-[720px] gap-ku-lg self-center px-ku-lg pt-ku-md pb-ku-48"
      >
        <View>
          <Text
            accessibilityRole="header"
            className="font-ku-bold text-ku-title-large text-ku-text-strong"
          >
            {quest.title}
          </Text>
          <View
            testID="hirer-manage-state"
            className="mt-ku-sm flex-row flex-wrap items-center gap-ku-sm"
          >
            <View className="rounded-ku-pill border border-ku-hirer-border bg-ku-hirer-subtle px-ku-12 py-ku-xs">
              <Text className="font-ku-semibold text-ku-label text-ku-hirer-dark">
                {messages.statusLabel(snapshot.state)}
              </Text>
            </View>
            <Text className="text-ku-body-small text-ku-text-secondary">
              {`${modeLabel} · ${isGroup ? messages.team : messages.singlePerson}`}
            </Text>
          </View>
        </View>
        {nextStep ||
        showCandidateReview ||
        showProofReview ||
        showDispute ||
        editPending ? (
          <View className="gap-ku-12">
            {nextStep ? (
              <View className="gap-ku-xs" testID="hirer-manage-next-step">
                <Text
                  accessibilityRole="header"
                  className="font-ku-semibold text-ku-body-small text-ku-text-secondary"
                >
                  {messages.nextStep}
                </Text>
                {nextStep === "candidate" ? (
                  <PrimaryAction
                    icon={UsersRound}
                    label={candidateReviewLabel}
                    onPress={() => setCandidateOpen(true)}
                    testID="hirer-manage-candidate-review"
                  />
                ) : null}
                {nextStep === "proof" ? (
                  <PrimaryAction
                    icon={ShieldCheck}
                    label={messages.proofReviewTitle}
                    onPress={reviewProof}
                    testID="hirer-manage-proof-review"
                  />
                ) : null}
                {nextStep === "underfilled" ? (
                  <PrimaryAction
                    icon={Hourglass}
                    label={
                      questNextActionLabels[locale][
                        QuestNextAction.DECIDE_UNDERFILLED
                      ]
                    }
                    onPress={() => setUnderfilledOpen(true)}
                    testID="hirer-manage-underfilled"
                    tone="warning"
                  />
                ) : null}
              </View>
            ) : null}
            {showCandidateReview && nextStep !== "candidate" ? (
              <ActionRow
                icon={UsersRound}
                label={candidateReviewLabel}
                onPress={() => setCandidateOpen(true)}
                testID="hirer-manage-candidate-review"
              />
            ) : null}
            {showProofReview && nextStep !== "proof" ? (
              <ActionRow
                icon={ShieldCheck}
                label={messages.proofReviewTitle}
                onPress={reviewProof}
                testID="hirer-manage-proof-review"
              />
            ) : null}
            {showDispute ? (
              <PrimaryAction
                icon={AlertTriangle}
                label={messages.fileDispute}
                onPress={() => confirmFileDispute(quest.id)}
                testID="hirer-manage-dispute"
                tone="danger"
              />
            ) : null}
            {editPending && snapshot.editRequest ? (
              <QuestConditionEditStatusCard
                editRequest={snapshot.editRequest}
                messages={messages}
              />
            ) : null}
          </View>
        ) : null}

        {waitingNote ? (
          <View
            testID="hirer-manage-waiting-note"
            className="flex-row items-start gap-ku-12 rounded-ku-card bg-ku-hirer-subtle p-ku-md"
          >
            <View className="mt-ku-2">
              <Info color={colors.hirer} size={20} strokeWidth={2} />
            </View>
            <Text className="min-w-0 flex-1 text-ku-body-small text-ku-text-strong">
              {waitingNote}
            </Text>
          </View>
        ) : null}
        {snapshot.state === QuestStatus.QUEST_OPEN ? (
          <StartsIn
            startTime={quest.startTime}
            format={messages.manageStartsIn}
          />
        ) : null}

        <View className="rounded-ku-card border border-ku-border bg-ku-surface px-ku-md">
          <View className="gap-ku-sm py-ku-md">
            <View className="flex-row flex-wrap items-end justify-between gap-ku-sm">
              <View
                accessible
                accessibilityLabel={messages.rosterWorkerCount(
                  assignedCount,
                  quest.headcount
                )}
              >
                <Text className="text-ku-label text-ku-text-secondary">
                  {myQuestMessages[locale].workerLabel}
                </Text>
                <Text className="mt-ku-2 font-ku-bold text-ku-title text-ku-text-strong">
                  {`${assignedCount}/${quest.headcount}`}
                </Text>
              </View>
              {canReviewCandidateProposals ? (
                <Text className="font-ku-medium text-ku-body-small text-ku-text-secondary">
                  {proposalCountLabel}
                </Text>
              ) : null}
            </View>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              className="h-[8px] overflow-hidden rounded-ku-pill bg-ku-hirer-subtle"
            >
              <View
                className="h-full rounded-ku-pill bg-ku-hirer"
                style={{
                  width: `${Math.min(100, (assignedCount / quest.headcount) * 100)}%`,
                }}
              />
            </View>
            {showStarted ? (
              <Text className="text-ku-body-small text-ku-text-secondary">
                {messages.manageStartedCount(startedCount, assignedCount)}
              </Text>
            ) : null}
          </View>
          {rewardPerWorker !== null ? (
            <ScheduleRow
              icon={Banknote}
              label={messages.reward}
              value={`${formatSatang(Math.round(rewardPerWorker * 100), locale)} ${messages.perPerson}`}
            />
          ) : null}
          {activeState && fundingTotal !== null ? (
            <ScheduleRow
              icon={Lock}
              label={messages.manageFundsHeld}
              value={formatSatang(
                Math.round(fundingTotal * quest.headcount * 100),
                locale
              )}
            />
          ) : null}
          <ScheduleRow
            icon={CalendarClock}
            label={messages.startWork}
            value={
              formatTimestamp(
                quest.startTime,
                locale,
                messages.timeNotSpecified
              ) + zoneNote
            }
          />
          <ScheduleRow
            icon={CalendarCheck}
            label={messages.finishBy}
            value={
              formatTimestamp(
                snapshot.dueAt,
                locale,
                messages.timeNotSpecified
              ) + (snapshot.dueAt ? zoneNote : "")
            }
          />
        </View>

        {showWorkChat || canProposeConditionEdit || assignedCount > 0 ? (
          <View className="gap-ku-12">
            {assignedCount > 0 ? (
              <ActionRow
                icon={Users}
                label={messages.selectRosterTitle}
                onPress={() =>
                  router.push({
                    pathname: "/quest/[id]/select-roster",
                    params: { id: quest.id },
                  })
                }
                testID="hirer-manage-roster"
              />
            ) : null}
            {showWorkChat ? (
              <ActionRow
                icon={MessageSquare}
                label={questWorkMessages[locale].workChat}
                onPress={openChat}
                testID="hirer-manage-work-chat"
              />
            ) : null}
            {canProposeConditionEdit ? (
              <ActionRow
                icon={FileEdit}
                label={messages.proposeConditionChanges}
                onPress={() => setConditionEditOpen(true)}
                testID="hirer-manage-condition-edit"
              />
            ) : null}
          </View>
        ) : null}

        {!terminal &&
        snapshot.capabilities.canCancel &&
        getCancelTier(snapshot.state) !== null ? (
          <View className="mt-ku-sm items-center border-t border-ku-divider pt-ku-md">
            <Pressable
              accessibilityLabel={messages.cancelQuest}
              accessibilityHint={cancelDescription}
              accessibilityRole="button"
              testID="hirer-manage-cancel"
              className="min-h-[48px] flex-row items-center justify-center gap-ku-sm rounded-ku-pill px-ku-lg active:bg-ku-surface-danger"
              onPress={cancel}
            >
              <X color={colors.dangerDark} size={20} strokeWidth={2.2} />
              <Text className="font-ku-semibold text-ku-control text-ku-danger-dark">
                {messages.cancelQuest}
              </Text>
            </Pressable>
            {cancelDescription ? (
              <Text className="mt-ku-xs text-center text-ku-body-small text-ku-text-secondary">
                {cancelDescription}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <CandidateReviewSheet
        visible={candidateOpen}
        viewerId={viewerId}
        applications={snapshot.applications}
        teams={submittedTeams}
        mode={isGroup ? "team" : "individual"}
        questTitle={quest.title}
        requestedHeadcount={quest.headcount}
        actualHeadcount={assignedCount}
        onClose={() => setCandidateOpen(false)}
        onAcceptProposal={
          isGroup
            ? snapshot.capabilities.canSelectTeam
              ? selectTeam
              : undefined
            : snapshot.capabilities.canSelectCandidate
              ? selectApplication
              : undefined
        }
        locale={locale}
        fullScreen
      />
      <BottomSheet
        visible={underfilledOpen}
        title={groupQuestMessages[locale].partialConsentTitle}
        subtitle={groupQuestMessages[locale].partialConsentSubtitle}
        closeLabel={groupQuestMessages[locale].close}
        onClose={() => setUnderfilledOpen(false)}
        testID="partial-group-start-consent-sheet"
      >
        <PartialGroupStartConsentContent
          underfilled={snapshot.underfilled}
          hirerId={viewerId}
          viewerId={viewerId}
          questTitle={quest.title}
          canDecide={snapshot.capabilities.canDecideUnderfilled}
          onHirerDecision={decideUnderfilled}
          originalRewardSatang={
            snapshot.quest.questReward == null
              ? undefined
              : Math.round(snapshot.quest.questReward * 100)
          }
          originalDueAt={snapshot.quest.dueAt}
          onExpire={() => void snapshotQuery.refetch()}
          onBrowseQuests={() => router.replace("/(tabs)")}
          locale={locale}
        />
      </BottomSheet>
      <CancelQuestGuardrailSheet
        visible={guardrailTier !== null}
        tier={guardrailTier ?? 2}
        title={myQuestMessages[locale].cancelConfirmTitle}
        description={
          guardrailTier === 3
            ? myQuestMessages[locale].cancelInProgressDescription
            : myQuestMessages[locale].cancelAssignedDescription
        }
        confirmLabel={myQuestMessages[locale].cancelGuardrailConfirm}
        cancelLabel={myQuestMessages[locale].cancelGuardrailKeep}
        keyword={myQuestMessages[locale].cancelGuardrailKeyword}
        keywordLabel={myQuestMessages[locale].cancelGuardrailKeywordLabel}
        keywordPlaceholder={
          myQuestMessages[locale].cancelGuardrailKeywordPlaceholder
        }
        slideLabel={myQuestMessages[locale].cancelGuardrailSlideLabel}
        onConfirm={confirmGuardrailCancel}
        onClose={() => setGuardrailTier(null)}
        busy={commandBusy}
      />
      <QuestConditionEditModal
        visible={conditionEditOpen}
        originalItems={originalConditionItems ?? []}
        onClose={() => setConditionEditOpen(false)}
        onSubmit={submitConditionEdit}
        submitting={conditionEditSubmitting}
        error={conditionEditError}
      />
    </ScreenLayout>
  );
}
