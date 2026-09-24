import { ActivityIndicator, RefreshControl } from "react-native";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  FileEdit,
  Hourglass,
  MessageSquare,
  ShieldCheck,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import { formatTimestamp } from "@/domain/datetime";
import { CandidateReviewSheet } from "@/features/questBoard/teamAssemble/components/CandidateReviewSheet";
import { PartialGroupStartConsentSheet } from "@/features/questBoard/teamAssemble/components/PartialGroupStartConsentSheet";
import { QuestConditionEditModal } from "@/features/questBoard/shared/components/QuestConditionEditModal";
import { QuestConditionEditStatusCard } from "@/features/questBoard/shared/components/QuestConditionEditStatusCard";
import { ProofReviewModal } from "@/features/questBoard/review/components/ProofReviewModal";
import { myQuestMessages } from "@/locales/myQuestMessages";
import { questNextActionLabels } from "@/locales/questStatusLabels";
import { questWorkMessages } from "@/locales/questWorkMessages";
import { useHirerQuestManageFeature } from "./useHirerQuestManageFeature";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import {
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
  divided,
  icon: Icon,
  label,
  onPress,
  testID,
}: {
  divided?: boolean;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      className={cn(
        "min-h-[56px] flex-row items-center gap-ku-12 py-ku-14 active:opacity-70",
        divided && "border-t border-ku-divider"
      )}
    >
      <Icon color={colors.hirer} size={20} strokeWidth={2} />
      <Text className="flex-1 font-ku-medium text-ku-body text-ku-text-strong">
        {label}
      </Text>
      <ChevronRight color={colors.textMuted} size={20} strokeWidth={2} />
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
    <View className="flex-row items-start gap-ku-12 border-t border-ku-hirer-border py-ku-12">
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
    error,
    originalConditionItems,
    pendingProof,
    terminal,
    cancelDescription,
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
    proofReviewOpen,
    setProofReviewOpen,
    decideUnderfilled,
    openChat,
    selectApplication,
    selectTeam,
    cancel,
    reviewProof,
    submitProofReview,
    submitConditionEdit,
  } = view;
  const topBar = (
    <TopBar
      title={messages.manageQuestTitle}
      onBackPress={() => router.back()}
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
            {error ?? messages.questNotFound}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-ku-md min-h-[48px] items-center justify-center rounded-ku-pill bg-ku-hirer px-ku-20 active:opacity-80"
            onPress={() => void snapshotQuery.refetch()}
          >
            <Text className="font-ku-semibold text-ku-body-small text-ku-on-hirer">
              {messages.retry}
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
  const showCandidateReview = canReviewCandidateProposals && proposalCount > 0;
  const showProofReview =
    Boolean(pendingProof) && snapshot.capabilities.canReviewProof;
  const showUnderfilled =
    snapshot.nextAction === QuestNextAction.DECIDE_UNDERFILLED &&
    snapshot.capabilities.canDecideUnderfilled;
  const showDispute = snapshot.state === QuestStatus.QUEST_FAILED;
  const editPending =
    snapshot.editRequest?.status ===
    QuestEditRequestStatus.EDIT_REQUEST_PENDING;
  const showWorkChat =
    snapshot.capabilities.canReadWorkChat && Boolean(snapshot.workConversation);
  const modeLabel =
    snapshot.mode === QuestMode.CANDIDATE
      ? myQuestMessages[locale].modeCandidate
      : myQuestMessages[locale].modeFirstCome;

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
          <Text
            testID="hirer-manage-state"
            className="mt-ku-xs text-ku-body-small text-ku-text-secondary"
          >
            <Text className="font-ku-semibold text-ku-hirer">
              {messages.statusLabel(snapshot.state)}
            </Text>
            {` · ${modeLabel} · ${isGroup ? messages.team : messages.singlePerson}`}
          </Text>
        </View>

        <View className="rounded-ku-card border border-ku-hirer-border bg-ku-hirer-subtle px-ku-md pt-ku-md">
          <View className="flex-row flex-wrap items-end justify-between gap-ku-sm pb-ku-md">
            <View
              accessible
              accessibilityLabel={messages.participantsSummary(
                assignedCount,
                quest.headcount
              )}
            >
              <Text className="text-ku-label text-ku-text-secondary">
                {messages.participants}
              </Text>
              <Text className="mt-ku-2 font-ku-bold text-ku-title text-ku-text-strong">
                {`${assignedCount}/${quest.headcount}`}
              </Text>
            </View>
            {canReviewCandidateProposals ? (
              <Text className="font-ku-medium text-ku-body-small text-ku-text-secondary">
                {isGroup
                  ? messages.submittedTeamCount(proposalCount)
                  : messages.applicationCount(proposalCount)}
              </Text>
            ) : null}
          </View>
          <ScheduleRow
            icon={CalendarClock}
            label={messages.startWork}
            value={formatTimestamp(
              quest.startTime,
              locale,
              messages.timeNotSpecified
            )}
          />
          <ScheduleRow
            icon={CalendarCheck}
            label={messages.finishBy}
            value={formatTimestamp(
              snapshot.dueAt,
              locale,
              messages.timeNotSpecified
            )}
          />
        </View>

        {showCandidateReview ||
        showProofReview ||
        showUnderfilled ||
        showDispute ||
        editPending ? (
          <View className="gap-ku-12">
            {showCandidateReview ? (
              <PrimaryAction
                icon={UsersRound}
                label={messages.reviewCandidates}
                onPress={() => setCandidateOpen(true)}
                testID="hirer-manage-candidate-review"
              />
            ) : null}
            {showProofReview ? (
              <PrimaryAction
                icon={ShieldCheck}
                label={messages.proofReviewTitle}
                onPress={reviewProof}
                testID="hirer-manage-proof-review"
              />
            ) : null}
            {showUnderfilled ? (
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
            {showDispute ? (
              <PrimaryAction
                icon={AlertTriangle}
                label={messages.fileDispute}
                onPress={() =>
                  router.push({
                    pathname: "/quest/[id]/dispute",
                    params: { id: quest.id },
                  })
                }
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

        {showWorkChat || canProposeConditionEdit ? (
          <View className="rounded-ku-card border border-ku-border-subtle bg-ku-surface px-ku-md">
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
                divided={showWorkChat}
                icon={FileEdit}
                label={messages.proposeConditionChanges}
                onPress={() => setConditionEditOpen(true)}
                testID="hirer-manage-condition-edit"
              />
            ) : null}
          </View>
        ) : null}

        {!terminal && snapshot.capabilities.canCancel ? (
          <View className="mt-ku-sm">
            <Pressable
              accessibilityRole="button"
              testID="hirer-manage-cancel"
              className="min-h-[52px] flex-row items-center justify-center gap-ku-sm rounded-ku-pill border border-ku-danger-dark px-ku-lg py-ku-12 active:bg-ku-surface-danger"
              onPress={cancel}
            >
              <X color={colors.dangerDark} size={20} strokeWidth={2.2} />
              <Text className="font-ku-semibold text-ku-control text-ku-danger-dark">
                {messages.cancelQuest}
              </Text>
            </Pressable>
            {cancelDescription ? (
              <Text className="mt-ku-sm text-center text-ku-body-small text-ku-text-secondary">
                {cancelDescription}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <CandidateReviewSheet
        visible={candidateOpen}
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
      <PartialGroupStartConsentSheet
        visible={underfilledOpen}
        underfilled={snapshot.underfilled}
        hirerId={viewerId}
        viewerId={viewerId}
        questTitle={quest.title}
        canDecide={snapshot.capabilities.canDecideUnderfilled}
        onHirerDecision={decideUnderfilled}
        onClose={() => setUnderfilledOpen(false)}
        locale={locale}
      />
      <QuestConditionEditModal
        visible={conditionEditOpen}
        originalItems={originalConditionItems ?? []}
        onClose={() => setConditionEditOpen(false)}
        onSubmit={submitConditionEdit}
        submitting={conditionEditSubmitting}
        error={conditionEditError}
      />
      <ProofReviewModal
        dueAt={snapshot.dueAt}
        onClose={() => setProofReviewOpen(false)}
        onReview={submitProofReview}
        proof={pendingProof}
        visible={proofReviewOpen && Boolean(pendingProof)}
      />
    </ScreenLayout>
  );
}
