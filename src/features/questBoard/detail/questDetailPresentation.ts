import {
  BriefcaseBusiness,
  Check,
  CircleAlert,
  LogOut,
  type LucideIcon,
} from "lucide-react-native";

import { colors } from "@/theme/colors";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type { SupportedLocale } from "@/locales/locale";
import type { QuestDetailBodyProps } from "../components/QuestDetailBody";
import type { QuestDetailSheetsProps } from "../components/QuestDetailSheets";
import type { PartialGroupStartVoter } from "../components/PartialGroupStartConsentSheet";
import type { TeamDirectoryMember } from "../components/TeamAssembleSheet";
import { getQuestRewardSatang } from "../questWorkflow";
import {
  MAX_QUEST_IMAGES,
  QuestCandidateMode,
  QuestInvitationStatus,
  QuestPartialStartConsentStatus,
  QuestParticipation,
  QuestStatus,
  QuestTeamStatus,
  type QuestBoardQuest,
  type QuestDetailState,
} from "../types";
import type { QuestDetailProjection } from "../questDetailProjection";
import type {
  QuestDetailReadModel,
  QuestDetailReadSource,
} from "./useQuestDetailReadSource";
import type { ResolvedQuestDetailRoute } from "./questDetailRoute";
import type { QuestDetailNavigation } from "./useQuestDetailNavigation";
import {
  getQuestDetailLiveTeam,
  type QuestDetailLiveActions,
} from "./questDetailActions";
import type {
  QuestDetailSurfaceState,
  QuestDetailSurfaceTransitions,
} from "./useQuestDetailSurfaceState";

export interface QuestDetailPresentationFacts {
  quest: QuestBoardQuest;
  source: QuestDetailReadSource;
  projection: QuestDetailProjection | null;
  activePrototypeState: QuestDetailState | null;
  liveSnapshot: NonNullable<
    Extract<QuestDetailReadSource, { kind: "live-snapshot" }>["snapshot"]
  > | null;
  locale: SupportedLocale;
  messages: QuestBoardMessages;
  groupMessages: GroupQuestMessages;
  viewerId: string;
  routeIntentKey: string;
  isJoinView: boolean;
  isPostView: boolean;
  isHirerView: boolean;
  firstCome: boolean;
  candidateGroup: boolean;
  imageUris: string[];
  participants: QuestDetailBodyProps["participants"];
  participantCount: number;
  previewApplicationStatus: "none" | "pending" | "accepted";
  availability: "available" | "full" | "closed";
  joinedStatus: "pending" | "accepted" | "history" | undefined;
  canApply: boolean;
  canShowWithdraw: boolean;
  confirmationOpen: boolean;
  canMessageOwner: boolean;
  canReportQuest: boolean;
  statusTitle: string;
  statusDescription: string;
  statusIsUnavailable: boolean;
  statusIcon: LucideIcon;
  statusIconColor: string;
  teamSheetTeam: QuestDetailState["teams"][number] | undefined;
  teamDirectory: TeamDirectoryMember[];
  partialVoters: PartialGroupStartVoter[];
  livePartialVoters: PartialGroupStartVoter[];
  liveTeamSheetTeam: NonNullable<
    Extract<QuestDetailReadSource, { kind: "live-snapshot" }>["snapshot"]
  >["team"];
  liveTeamSurface: boolean;
  partialStartSheetOpen: boolean;
  refreshing: boolean;
}

export interface QuestDetailPresentationContext {
  facts: QuestDetailPresentationFacts;
  surface: QuestDetailSurfaceState;
  transitions: QuestDetailSurfaceTransitions;
  navigation: QuestDetailNavigation;
  bottomInset: number;
  onRefresh: () => void;
  confirmApplication: () => Promise<void>;
  leaveQuest: () => void;
  selectCandidate: (proposalId: string) => void;
  rejectCandidate: (proposalId: string) => void;
  openLiveUnderfilled: () => void;
  liveUnderfilledDecision: (decision: "PROCEED" | "CANCEL") => void;
  liveUnderfilledConsent: (decision: "ACCEPT" | "DECLINE") => void;
  liveCreateTeam: () => void;
  liveJoinTeam: (joinCode: string) => void;
  liveLeaveTeam: (teamId: string) => void;
  liveRemoveTeamMember: (teamId: string, memberId: string) => void;
  liveRegenerateTeamCode: (teamId: string) => void;
  liveUpdateTeamName: (teamId: string, name: string) => void;
  liveSubmitTeam: (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => void;
  fixtureCreateTeam: () => void;
  fixtureInviteMembers: (memberIds: string[]) => void;
  fixtureSubmitTeam: (teamId: string) => void;
  fixtureRespondInvitation: (invitationId: string, accept: boolean) => void;
  fixturePartialStartVote: (approve: boolean) => void;
  uploadTeamFile: QuestDetailLiveActions["uploadTeamFile"];
}

export function getQuestDetailPresentationFacts({
  read,
  route,
  locale,
  messages,
  groupMessages,
  viewerId,
  surface,
  teamDirectory,
}: {
  read: QuestDetailReadModel;
  route: ResolvedQuestDetailRoute;
  locale: SupportedLocale;
  messages: QuestBoardMessages;
  groupMessages: GroupQuestMessages;
  viewerId: string;
  surface: QuestDetailSurfaceState;
  teamDirectory: TeamDirectoryMember[];
}): QuestDetailPresentationFacts | null {
  const quest = read.quest;
  if (!quest) return null;
  const projection = read.projection;
  const explicitPreview = read.source.kind === "preview";
  const activePrototypeState =
    read.source.kind === "preview" ? read.source.state : null;
  const liveSnapshot =
    read.source.kind === "live-snapshot" ? read.source.snapshot : null;
  const isJoinView = route.mode === "join";
  const isPostView = route.mode === "post";
  const isHirerView = explicitPreview
    ? (projection?.isOwner ?? false)
    : liveSnapshot?.actor === "HIRER";
  const firstCome = quest.candidateMode === QuestCandidateMode.NO_CANDIDATE;
  const candidateGroup = Boolean(
    quest && !firstCome && quest.participationMode === "team"
  );
  const applicationStatusHydrated = explicitPreview || liveSnapshot !== null;
  const applicationStatus = projection?.applicationStatus ?? "none";
  const previewApplicationStatus =
    route.previewState === "application-pending"
      ? "pending"
      : route.previewState === "application-accepted"
        ? "accepted"
        : applicationStatus;
  const availability =
    route.previewState === "full"
      ? "full"
      : route.previewState === "closed"
        ? "closed"
        : (projection?.availability ??
          (quest.status === QuestStatus.QUEST_OPEN ? "available" : "closed"));
  const imageUris = quest.imageUris?.slice(0, MAX_QUEST_IMAGES) ?? [];
  const joinedStatus =
    surface.localJoinedStatus ??
    (isJoinView && applicationStatusHydrated
      ? explicitPreview
        ? (route.joinStatus ??
          (applicationStatus === "pending" || applicationStatus === "accepted"
            ? applicationStatus
            : "accepted"))
        : projection?.joinStatus
      : undefined);
  const canonicalOpen =
    projection?.lifecycleState === QuestStatus.QUEST_OPEN ||
    (!projection && quest.status === QuestStatus.QUEST_OPEN);
  const partialStartPending = projection?.partialStartPending ?? false;
  const capabilities = projection?.capabilities;
  const canApply =
    !isJoinView &&
    !isPostView &&
    availability === "available" &&
    canonicalOpen &&
    !partialStartPending &&
    previewApplicationStatus === "none" &&
    !candidateGroup &&
    applicationStatusHydrated &&
    (firstCome
      ? Boolean(capabilities?.canJoin)
      : Boolean(capabilities?.canApply));
  const canWithdrawApplication = Boolean(
    applicationStatusHydrated &&
    !isPostView &&
    capabilities?.canWithdrawApplication
  );
  const canShowWithdraw =
    !isPostView &&
    !surface.leftQuest &&
    canWithdrawApplication &&
    (isJoinView ? joinedStatus === "pending" : applicationStatus === "pending");
  const routeIntentKey = `${route.questId ?? ""}:${route.intent ?? ""}`;
  const confirmationOpen =
    surface.manualConfirmationOpen ||
    (route.intent === "apply" &&
      surface.dismissedIntent !== routeIntentKey &&
      canApply);
  const canMessageOwner = Boolean(!isPostView && capabilities?.canMessageOwner);
  const canReportQuest = Boolean(
    isJoinView &&
    !surface.leftQuest &&
    (joinedStatus === "accepted" || joinedStatus === "history") &&
    capabilities?.canReportQuest
  );
  const statusTitle = isPostView
    ? messages.postOwnerView
    : isJoinView
      ? surface.leftQuest
        ? messages.leftQuest
        : joinedStatus === "history"
          ? messages.historyQuest
          : joinedStatus === "accepted"
            ? messages.participationConfirmed
            : joinedStatus === "pending"
              ? messages.applicationPending
              : ""
      : previewApplicationStatus === "accepted"
        ? firstCome
          ? messages.participationConfirmed
          : messages.applicationAccepted
        : previewApplicationStatus === "pending"
          ? messages.applicationPending
          : availability === "full"
            ? messages.questFull
            : availability === "closed"
              ? messages.applicationsClosed
              : "";
  const statusIsUnavailable =
    !isJoinView &&
    !isPostView &&
    availability !== "available" &&
    previewApplicationStatus === "none";
  const statusDescription = isPostView
    ? messages.postOwnerViewDescription
    : isJoinView
      ? surface.leftQuest
        ? messages.leftQuestDescription
        : joinedStatus === "history"
          ? messages.historyQuestDescription
          : joinedStatus === "accepted"
            ? messages.applicationAcceptedDescription
            : messages.applicationPendingDescription
      : previewApplicationStatus === "accepted"
        ? messages.applicationAcceptedDescription
        : previewApplicationStatus === "pending"
          ? messages.applicationPendingDescription
          : messages.unavailableApplication;
  const statusIcon = statusIsUnavailable
    ? CircleAlert
    : isPostView
      ? BriefcaseBusiness
      : surface.leftQuest
        ? LogOut
        : Check;
  const statusIconColor = statusIsUnavailable
    ? colors.textMuted
    : surface.leftQuest
      ? colors.dangerDark
      : colors.primary;
  const participants =
    projection?.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
    })) ?? [];
  const participantCount = projection?.participantCount ?? 0;

  const teamSheetTeam = (() => {
    if (!activePrototypeState || !candidateGroup || isHirerView)
      return undefined;
    const ownTeam = activePrototypeState.teams.find(
      (team) =>
        team.members.some((member) => member.workerId === viewerId) ||
        team.leaderId === viewerId
    );
    if (ownTeam) return ownTeam;
    const invitation = activePrototypeState.invitations.find(
      (item) =>
        item.invitedWorkerId === viewerId &&
        item.status === QuestInvitationStatus.INVITATION_PENDING
    );
    return invitation
      ? activePrototypeState.teams.find((team) => team.id === invitation.teamId)
      : undefined;
  })();
  const consent = activePrototypeState?.partialStartConsent;
  const partialVoters: PartialGroupStartVoter[] =
    !activePrototypeState || !consent
      ? []
      : consent.requiredVoterIds.map((id) => ({
          id,
          displayName:
            id === activePrototypeState.quest.hirerId
              ? (quest.creator.name ?? id)
              : id,
          role: id === activePrototypeState.quest.hirerId ? "HIRER" : "WORKER",
        }));
  const liveCandidateGroup = Boolean(
    liveSnapshot &&
    liveSnapshot.participation === "GROUP" &&
    liveSnapshot.mode === "CANDIDATE" &&
    !isHirerView
  );
  const liveTeamSheetTeam = liveCandidateGroup
    ? getQuestDetailLiveTeam(liveSnapshot)
    : null;
  const liveTeamSurface = Boolean(
    liveCandidateGroup &&
    liveSnapshot &&
    (liveSnapshot.team ||
      capabilities?.canCreateTeam ||
      capabilities?.canJoinTeam)
  );
  const livePartialVoters: PartialGroupStartVoter[] =
    !liveSnapshot?.underfilled || !liveSnapshot.underfilled.responses
      ? []
      : liveSnapshot.underfilled.responses.map((response) => ({
          id: response.workerId,
          displayName: response.workerId,
          role: "WORKER",
        }));
  const partialStartSheetOpen = Boolean(
    activePrototypeState?.partialStartConsent &&
    activePrototypeState.partialStartConsent.status !==
      QuestPartialStartConsentStatus.PARTIAL_START_APPROVED &&
    !surface.partialStartSheetDismissed
  );

  return {
    quest,
    source: read.source,
    projection,
    activePrototypeState,
    liveSnapshot,
    locale,
    messages,
    groupMessages,
    viewerId,
    routeIntentKey,
    isJoinView,
    isPostView,
    isHirerView,
    firstCome,
    candidateGroup,
    imageUris,
    participants,
    participantCount,
    previewApplicationStatus,
    availability,
    joinedStatus,
    canApply,
    canShowWithdraw,
    confirmationOpen,
    canMessageOwner,
    canReportQuest,
    statusTitle,
    statusDescription,
    statusIsUnavailable,
    statusIcon,
    statusIconColor,
    teamSheetTeam,
    teamDirectory,
    partialVoters,
    liveTeamSheetTeam,
    liveTeamSurface,
    livePartialVoters,
    partialStartSheetOpen,
    refreshing: read.refreshing,
  };
}

export function buildQuestDetailBodyProps(
  context: QuestDetailPresentationContext
): QuestDetailBodyProps {
  const { facts, surface, transitions, navigation } = context;
  return {
    canParticipate: facts.canApply,
    participationFirstCome: facts.firstCome,
    onOpenParticipation: transitions.openConfirmation,
    participationBusy: Boolean(surface.liveAction),
    participants: facts.participants,
    participantCount: facts.participantCount,
    onOpenParticipantProfile: navigation.openParticipantProfile,
    canReportQuest: facts.canReportQuest,
    canonicalStatus: facts.projection?.lifecycleState,
    imageUris: facts.imageUris,
    liveEntry: facts.liveSnapshot
      ? {
          snapshot: facts.liveSnapshot,
          groupMessages: facts.groupMessages,
          busy: Boolean(surface.liveAction),
          onOpenTeam: transitions.openTeam,
          onOpenCandidateReview: transitions.openCandidateReview,
          onOpenPartialConsent: context.openLiveUnderfilled,
        }
      : undefined,
    messages: facts.messages,
    locale: facts.locale,
    onOpenWorkHub: navigation.openWorkHub,
    onRefresh: context.onRefresh,
    onReportQuest: navigation.openReportQuest,
    prototypeEntry: facts.activePrototypeState
      ? {
          state: facts.activePrototypeState,
          viewerId: facts.viewerId,
          isHirer: facts.isHirerView,
          messages: facts.groupMessages,
          onOpenTeam: transitions.openTeam,
          onOpenCandidateReview: transitions.openCandidateReview,
          onOpenPartialConsent: transitions.reopenPartialConsent,
        }
      : undefined,
    quest: facts.quest,
    refreshing: facts.refreshing,
    status: facts.statusTitle
      ? {
          title: facts.statusTitle,
          description: facts.statusDescription,
          unavailable: facts.statusIsUnavailable,
          postView: facts.isPostView,
          leftQuest: surface.leftQuest,
          history: facts.joinedStatus === "history",
          Icon: facts.statusIcon,
          iconColor: facts.statusIconColor,
        }
      : undefined,
  };
}

function closeConfirmation(
  facts: QuestDetailPresentationFacts,
  transitions: QuestDetailSurfaceTransitions
): () => void {
  return () => {
    transitions.closeConfirmation();
    transitions.dismissIntent(facts.routeIntentKey);
  };
}

export function buildQuestDetailSheetsProps(
  context: QuestDetailPresentationContext
): QuestDetailSheetsProps {
  const { facts, surface, transitions, bottomInset } = context;
  const closeConfirm = closeConfirmation(facts, transitions);
  return {
    confirmationSheet: facts.confirmationOpen
      ? {
          locale: facts.locale,
          messages: facts.messages,
          onCancel: closeConfirm,
          onConfirm: context.confirmApplication,
          busy: Boolean(surface.liveAction),
          quest: facts.quest,
        }
      : undefined,
    liveCandidateSheet:
      facts.source.kind === "live-snapshot" &&
      facts.liveSnapshot &&
      facts.liveSnapshot.actor === "HIRER" &&
      facts.liveSnapshot.mode === "CANDIDATE" &&
      (facts.projection?.capabilities.canSelectCandidate ||
        facts.projection?.capabilities.canSelectTeam ||
        facts.projection?.capabilities.canRejectCandidate ||
        facts.projection?.capabilities.canRejectTeam)
        ? {
            actualHeadcount: facts.participantCount,
            applications: facts.liveSnapshot.applications,
            bottomInset,
            fullScreen: true,
            loading:
              surface.liveAction === "select-candidate" ||
              surface.liveAction === "reject-candidate",
            locale: facts.locale,
            mode:
              facts.liveSnapshot.participation === "GROUP"
                ? "team"
                : "individual",
            onAcceptProposal: surface.liveAction
              ? undefined
              : context.selectCandidate,
            onRejectProposal: surface.liveAction
              ? undefined
              : context.rejectCandidate,
            onClose: transitions.closeCandidateReview,
            onSelectProposal: transitions.selectProposal,
            rewardSatangPerWorker: getQuestRewardSatang(facts.quest),
            requestedHeadcount: facts.liveSnapshot.quest.headcount,
            selectedProposalId: surface.selectedProposalId,
            teams:
              facts.liveSnapshot.participation === "GROUP"
                ? facts.liveSnapshot.teams
                : [],
            visible: surface.candidateReviewSheetOpen,
          }
        : undefined,
    liveConsentSheet:
      facts.source.kind === "live-snapshot" &&
      facts.liveSnapshot?.participation === "GROUP" &&
      facts.liveSnapshot.mode === "FIRST_COME_FIRST_SERVED" &&
      facts.liveSnapshot.underfilled
        ? {
            actualHeadcount: facts.liveSnapshot.underfilled.activeWorkerCount,
            bottomInset,
            canConsent:
              facts.projection?.capabilities.canConsentUnderfilled ?? false,
            canDecide:
              facts.projection?.capabilities.canDecideUnderfilled ?? false,
            canRespond: Boolean(
              facts.projection?.capabilities.canConsentUnderfilled ||
              facts.projection?.capabilities.canDecideUnderfilled
            ),
            error: undefined,
            loading:
              surface.liveAction === "underfilled-decision" ||
              surface.liveAction === "underfilled-consent",
            locale: facts.locale,
            onClose: transitions.dismissPartialConsent,
            onHirerDecision: context.liveUnderfilledDecision,
            onWorkerConsent: context.liveUnderfilledConsent,
            questTitle: facts.quest.title,
            requestedHeadcount: facts.liveSnapshot.underfilled.headcount,
            underfilled: facts.liveSnapshot.underfilled,
            viewerId: facts.viewerId,
            visible:
              !surface.partialStartSheetDismissed &&
              Boolean(
                facts.projection?.capabilities.canDecideUnderfilled ||
                facts.projection?.capabilities.canConsentUnderfilled
              ),
            voters: facts.livePartialVoters,
          }
        : undefined,
    liveTeamSheet:
      facts.liveTeamSurface && facts.liveSnapshot
        ? {
            bottomInset,
            canLeaveTeam: facts.projection?.capabilities.canLeaveTeam ?? false,
            canRemoveMember:
              facts.projection?.capabilities.canRemoveTeamMember ?? false,
            canRegenerateJoinCode:
              facts.projection?.capabilities.canRegenerateTeamCode ?? false,
            canUpdateTeam:
              facts.projection?.capabilities.canUpdateTeam ?? false,
            eligibleMembers: [],
            joinCode: facts.liveTeamSheetTeam?.joinCode,
            joinCodeExpiresAt: facts.liveTeamSheetTeam?.joinCodeExpiresAt,
            teamName: facts.liveTeamSheetTeam?.name,
            onClose: transitions.closeTeam,
            onCreateTeam: facts.projection?.capabilities.canCreateTeam
              ? context.liveCreateTeam
              : undefined,
            onJoinTeam: facts.projection?.capabilities.canJoinTeam
              ? context.liveJoinTeam
              : undefined,
            onLeaveTeam: context.liveLeaveTeam,
            onRemoveMember: context.liveRemoveTeamMember,
            onRegenerateJoinCode: context.liveRegenerateTeamCode,
            onUpdateTeamName: context.liveUpdateTeamName,
            onReviewChange: transitions.setTeamReviewing,
            onSubmitTeam: context.liveSubmitTeam,
            onUploadProposalFile: context.uploadTeamFile,
            requestedHeadcount: facts.liveSnapshot.quest.headcount,
            reviewing: surface.teamReviewing,
            searchQuery: surface.teamSearchQuery,
            submitting: surface.liveAction === "submit-team",
            team: facts.liveTeamSheetTeam,
            viewerId: facts.viewerId,
            visible: surface.teamSheetOpen,
          }
        : undefined,
    prototypeCandidateSheet:
      facts.activePrototypeState &&
      facts.isHirerView &&
      facts.quest.candidateMode === QuestCandidateMode.CANDIDATE
        ? {
            actualHeadcount: facts.participantCount,
            applications: facts.activePrototypeState.applications,
            bottomInset,
            locale: facts.locale,
            mode: facts.candidateGroup ? "team" : "individual",
            onAcceptProposal: facts.projection?.capabilities.canSelectCandidate
              ? context.selectCandidate
              : undefined,
            onClose: transitions.closeCandidateReview,
            onRejectProposal: facts.projection?.capabilities[
              facts.candidateGroup ? "canRejectTeam" : "canRejectCandidate"
            ]
              ? context.rejectCandidate
              : undefined,
            onSelectProposal: transitions.selectProposal,
            questTitle: facts.quest.title,
            requestedHeadcount: facts.activePrototypeState.quest.headcount,
            rewardSatangPerWorker:
              facts.activePrototypeState.quest.reward.rewardSatang,
            selectedProposalId: surface.selectedProposalId,
            settlement: facts.projection?.settlement ?? undefined,
            teams: facts.candidateGroup
              ? facts.activePrototypeState.teams.filter(
                  (team) => team.status !== QuestTeamStatus.TEAM_FORMING
                )
              : [],
            visible: surface.candidateReviewSheetOpen,
            fullScreen: true,
          }
        : undefined,
    prototypeConsentSheet:
      facts.activePrototypeState &&
      facts.activePrototypeState.quest.participation ===
        QuestParticipation.GROUP &&
      facts.activePrototypeState.quest.candidateMode ===
        QuestCandidateMode.NO_CANDIDATE &&
      facts.activePrototypeState.partialStartConsent
        ? {
            actualHeadcount: facts.participantCount,
            bottomInset,
            canRespond:
              facts.projection?.capabilities.canRespondPartialStart ?? false,
            consent: facts.activePrototypeState.partialStartConsent,
            hirerId: facts.activePrototypeState.quest.hirerId,
            locale: facts.locale,
            onClose: transitions.dismissPartialConsent,
            onVote: context.fixturePartialStartVote,
            questTitle: facts.quest.title,
            requestedHeadcount: facts.activePrototypeState.quest.headcount,
            voters: facts.partialVoters,
            viewerId: facts.viewerId,
            visible: facts.partialStartSheetOpen,
          }
        : undefined,
    prototypeTeamSheet:
      facts.activePrototypeState && facts.candidateGroup && !facts.isHirerView
        ? {
            bottomInset,
            eligibleMembers: facts.teamDirectory,
            invitations: facts.activePrototypeState.invitations,
            locale: facts.locale,
            onClose: transitions.closeTeam,
            onCreateTeam: facts.projection?.capabilities.canCreateTeam
              ? context.fixtureCreateTeam
              : undefined,
            onInviteMembers: facts.projection?.capabilities.canInviteWorker
              ? context.fixtureInviteMembers
              : undefined,
            onRespondInvitation: facts.projection?.capabilities
              .canRespondInvitation
              ? context.fixtureRespondInvitation
              : undefined,
            onSearchQueryChange: transitions.setTeamSearchQuery,
            onSelectedMemberIdsChange: transitions.setTeamSelectedMemberIds,
            onReviewChange: transitions.setTeamReviewing,
            onSubmit: facts.projection?.capabilities.canSubmitTeam
              ? context.fixtureSubmitTeam
              : undefined,
            requestedHeadcount: facts.activePrototypeState.quest.headcount,
            reviewing: surface.teamReviewing,
            searchQuery: surface.teamSearchQuery,
            selectedMemberIds: surface.teamSelectedMemberIds,
            team: facts.teamSheetTeam,
            viewerId: facts.viewerId,
            visible: surface.teamSheetOpen,
          }
        : undefined,
  };
}

export interface QuestDetailActionBarModel {
  isPostView: boolean;
  canEditPost: boolean;
  canReview: boolean;
  canMessageOwner: boolean;
  onMessageOwner: () => void;
  canShowWithdraw: boolean;
  onLeaveQuest: () => void;
  canApply: boolean;
  firstCome: boolean;
  onOpenApply: () => void;
  onEditPost: () => void;
  onOpenReview: () => void;
  busy: boolean;
}

export function buildQuestDetailActionBar(
  context: QuestDetailPresentationContext
): QuestDetailActionBarModel {
  const { facts, surface, transitions, navigation } = context;
  return {
    isPostView: facts.isPostView,
    canEditPost:
      facts.isPostView &&
      facts.isHirerView &&
      facts.quest.status === QuestStatus.QUEST_DRAFT,
    canReview:
      facts.isPostView &&
      facts.isHirerView &&
      (facts.quest.status === QuestStatus.QUEST_COMPLETED ||
        facts.quest.status === QuestStatus.QUEST_CANCELLED ||
        facts.quest.status === QuestStatus.QUEST_FAILED) &&
      facts.liveSnapshot?.capabilities.canCreateReview === true,
    canMessageOwner: facts.canMessageOwner,
    onMessageOwner: navigation.openMessageOwner,
    canShowWithdraw: facts.canShowWithdraw,
    onLeaveQuest: context.leaveQuest,
    canApply: facts.canApply,
    firstCome: facts.firstCome,
    onOpenApply: transitions.openConfirmation,
    onEditPost: navigation.openEditPost,
    onOpenReview: navigation.openReview,
    busy: Boolean(surface.liveAction),
  };
}
