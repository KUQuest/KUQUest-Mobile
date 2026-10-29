import {
  Check,
  CircleAlert,
  LogOut,
  type LucideIcon,
} from "lucide-react-native";

import type { ThemeColors } from "@/theme/colors";
import type { TagItem } from "@/api/QuestApi";
import { isTerminalStatus } from "@/domain/questLifecycle";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type { SupportedLocale } from "@/locales/locale";
import { localizeQuestBoardQuest } from "@/locales/tagLabels";
import type { QuestDetailBodyProps } from "./components/QuestDetailBody";
import type { QuestDetailSheetsProps } from "./components/QuestDetailSheets";
import type { TeamAssembleViewProps } from "../teamAssemble/components/TeamAssembleView";
import type { PartialGroupStartConsentContentProps } from "../teamAssemble/components/PartialGroupStartConsentContent";
import { getQuestRewardSatang } from "../presentation/questBoardViewData";
import {
  isHirerActor,
  MAX_QUEST_IMAGES,
  QuestActor,
  QuestMode,
  QuestParticipation,
  QuestStatus,
  type QuestUnderfilledConsentDecision,
  type QuestUnderfilledDecision,
  type QuestBoardQuest,
  QuestAssignmentStatus,
} from "../domain/types";
import type { QuestDetailProjection } from "./questDetailProjection";
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
  applicationStatus: "none" | "pending" | "accepted";
  availability: "available" | "full" | "closed";
  joinedStatus: "pending" | "accepted" | "history" | undefined;
  canApply: boolean;
  canShowWithdraw: boolean;
  confirmationOpen: boolean;
  groupFcfs: QuestDetailBodyProps["groupFcfs"];
  groupFcfsConfirmFull: boolean;
  canMessageOwner: boolean;
  statusTitle: string;
  statusDescription: string;
  statusIsUnavailable: boolean;
  statusIcon: LucideIcon;
  statusIconColor: string;
  statusActionLabel: string;
  liveTeamSheetTeam: NonNullable<
    Extract<QuestDetailReadSource, { kind: "live-snapshot" }>["snapshot"]
  >["team"];
  liveTeamSurface: boolean;
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
  liveUnderfilledDecision: (decision: QuestUnderfilledDecision) => void;
  liveUnderfilledConsent: (decision: QuestUnderfilledConsentDecision) => void;
  liveCreateTeam: (name: string) => void;
  liveJoinTeam: (teamId: string, joinCode: string) => void;
  liveLeaveTeam: (teamId: string) => void;
  liveRemoveTeamMember: (teamId: string, memberId: string) => void;
  liveRegenerateTeamCode: (teamId: string) => void;
  liveUpdateTeamName: (teamId: string, name: string) => void;
  liveSubmitTeam: (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => void;
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
  tagCatalog,
  colors,
}: {
  read: QuestDetailReadModel;
  route: ResolvedQuestDetailRoute;
  locale: SupportedLocale;
  messages: QuestBoardMessages;
  groupMessages: GroupQuestMessages;
  viewerId: string;
  surface: QuestDetailSurfaceState;
  tagCatalog: readonly TagItem[];
  colors: ThemeColors;
}): QuestDetailPresentationFacts | null {
  const questSource = read.quest;
  if (!questSource) return null;
  const quest = localizeQuestBoardQuest(questSource, tagCatalog, locale);
  const projection = read.projection;
  const liveSnapshot =
    read.source.kind === "live-snapshot" ? read.source.snapshot : null;
  const isJoinView = route.mode === "join";
  const isPostView = route.mode === "post";
  const isHirerView = isHirerActor(liveSnapshot?.actor);
  const firstCome = quest.mode === QuestMode.FIRST_COME_FIRST_SERVED;
  const candidateGroup = Boolean(
    quest && !firstCome && quest.participation === QuestParticipation.GROUP
  );
  const applicationStatusHydrated = liveSnapshot !== null;
  const applicationStatus = projection?.applicationStatus ?? "none";
  const availability =
    projection?.availability ??
    (quest.status === QuestStatus.QUEST_OPEN ? "available" : "closed");
  const imageUris = quest.imageUris?.slice(0, MAX_QUEST_IMAGES) ?? [];
  const joinedStatus =
    surface.localJoinedStatus ??
    (isJoinView && applicationStatusHydrated
      ? projection?.joinStatus
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
    applicationStatus === "none" &&
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
  const statusTitle = isPostView
    ? ""
    : isJoinView
      ? surface.leftQuest
        ? messages.leftQuest
        : joinedStatus === "history"
          ? messages.historyQuest
          : joinedStatus === "accepted"
            ? capabilities?.canRespondToEdit
              ? messages.editResponsePending
              : messages.participationConfirmed
            : joinedStatus === "pending"
              ? messages.applicationPending
              : ""
      : applicationStatus === "accepted"
        ? capabilities?.canRespondToEdit
          ? messages.editResponsePending
          : firstCome
            ? messages.participationConfirmed
            : messages.applicationAccepted
        : applicationStatus === "pending"
          ? messages.applicationPending
          : availability === "full"
            ? messages.questFull
            : availability === "closed"
              ? messages.applicationsClosed
              : "";
  const statusActionLabel = capabilities?.canRespondToEdit
    ? messages.respondToEdit
    : messages.openWorkHub;
  const statusIsUnavailable =
    !isJoinView &&
    !isPostView &&
    availability !== "available" &&
    applicationStatus === "none";
  const statusDescription = statusIsUnavailable
    ? messages.unavailableApplication
    : "";
  const statusIcon = statusIsUnavailable
    ? CircleAlert
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
  const groupFcfs =
    !isHirerView &&
    liveSnapshot?.participation === QuestParticipation.GROUP &&
    liveSnapshot.mode === QuestMode.FIRST_COME_FIRST_SERVED
      ? {
          activeWorkerCount:
            liveSnapshot.underfilled?.activeWorkerCount ??
            ("activeWorkerCount" in liveSnapshot.quest
              ? liveSnapshot.quest.activeWorkerCount
              : participantCount),
          headcount: liveSnapshot.quest.headcount,
          isJoined:
            liveSnapshot.assignment?.state ===
            QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
          state: liveSnapshot.state,
          startTime: liveSnapshot.quest.startTime,
          underfilled: liveSnapshot.underfilled,
          canConsent: Boolean(capabilities?.canConsentUnderfilled),
        }
      : undefined;
  const groupFcfsFull = Boolean(
    groupFcfs &&
    (groupFcfs.activeWorkerCount >= groupFcfs.headcount ||
      groupFcfs.state === QuestStatus.QUEST_ASSIGNED)
  );

  const liveCandidateGroup = Boolean(
    liveSnapshot &&
    liveSnapshot.participation === QuestParticipation.GROUP &&
    liveSnapshot.mode === QuestMode.CANDIDATE &&
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

  return {
    quest,
    source: read.source,
    projection,
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
    applicationStatus,
    availability,
    joinedStatus,
    canApply,
    canShowWithdraw,
    confirmationOpen,
    canMessageOwner,
    statusTitle,
    statusDescription,
    statusIsUnavailable,
    statusIcon,
    statusActionLabel,
    statusIconColor,
    liveTeamSheetTeam,
    liveTeamSurface,
    groupFcfs,
    groupFcfsConfirmFull: groupFcfsFull,
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
    canonicalStatus: facts.projection?.lifecycleState,
    imageUris: facts.imageUris,
    liveEntry: facts.liveSnapshot
      ? {
          snapshot: facts.liveSnapshot,
          groupMessages: facts.groupMessages,
          busy: Boolean(surface.liveAction),
          onOpenTeam: navigation.openTeam,
          onOpenCandidateReview: transitions.openCandidateReview,
          onOpenPartialConsent: navigation.openPartialStart,
        }
      : undefined,
    messages: facts.messages,
    locale: facts.locale,
    isOwnerPost: facts.isPostView && facts.isHirerView,
    onOpenWorkHub: navigation.openWorkHub,
    onRefresh: context.onRefresh,
    quest: facts.quest,
    refreshing: facts.refreshing,
    status: facts.statusTitle
      ? {
          title: facts.statusTitle,
          description: facts.statusDescription,
          unavailable: facts.statusIsUnavailable,
          leftQuest: surface.leftQuest,
          history: facts.joinedStatus === "history",
          Icon: facts.statusIcon,
          iconColor: facts.statusIconColor,
          actionLabel: facts.statusActionLabel,
        }
      : undefined,
    groupFcfs: facts.groupFcfs,
    onOpenPartialConsent: navigation.openPartialStart,
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
  const { facts, surface, transitions } = context;
  const closeConfirm = closeConfirmation(facts, transitions);
  return {
    confirmationSheet: facts.confirmationOpen
      ? {
          quest: facts.quest,
          locale: facts.locale,
          messages: facts.messages,
          onCancel: closeConfirm,
          onConfirm: context.confirmApplication,
          busy: Boolean(surface.liveAction),
          capacityFull: facts.groupFcfsConfirmFull,
        }
      : undefined,
    liveCandidateSheet:
      facts.source.kind === "live-snapshot" &&
      facts.liveSnapshot &&
      isHirerActor(facts.liveSnapshot.actor) &&
      facts.liveSnapshot.mode === QuestMode.CANDIDATE &&
      (facts.projection?.capabilities.canSelectCandidate ||
        facts.projection?.capabilities.canSelectTeam ||
        facts.projection?.capabilities.canRejectCandidate ||
        facts.projection?.capabilities.canRejectTeam)
        ? {
            actualHeadcount: facts.participantCount,
            applications: facts.liveSnapshot.applications,
            fullScreen: true,
            loading:
              surface.liveAction === "select-candidate" ||
              surface.liveAction === "reject-candidate",
            locale: facts.locale,
            mode:
              facts.liveSnapshot.participation === QuestParticipation.GROUP
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
              facts.liveSnapshot.participation === QuestParticipation.GROUP
                ? facts.liveSnapshot.teams
                : [],
            visible: surface.candidateReviewSheetOpen,
            viewerId: facts.viewerId,
          }
        : undefined,
  };
}

export function buildQuestDetailPartialStartProps(
  context: QuestDetailPresentationContext
): PartialGroupStartConsentContentProps {
  const { facts, surface } = context;
  const snapshot = facts.liveSnapshot;
  if (
    snapshot?.participation === QuestParticipation.GROUP &&
    snapshot.mode === QuestMode.FIRST_COME_FIRST_SERVED &&
    snapshot.underfilled
  ) {
    return {
      actualHeadcount: snapshot.underfilled.activeWorkerCount,
      canConsent: facts.projection?.capabilities.canConsentUnderfilled ?? false,
      canDecide: facts.projection?.capabilities.canDecideUnderfilled ?? false,
      canRespond: Boolean(
        facts.projection?.capabilities.canConsentUnderfilled ||
        facts.projection?.capabilities.canDecideUnderfilled
      ),
      loading:
        surface.liveAction === "underfilled-decision" ||
        surface.liveAction === "underfilled-consent",
      locale: facts.locale,
      onHirerDecision: context.liveUnderfilledDecision,
      onWorkerConsent: context.liveUnderfilledConsent,
      questTitle: facts.quest.title,
      hirerId: facts.isHirerView ? facts.viewerId : undefined,
      requestedHeadcount: snapshot.underfilled.headcount,
      underfilled: snapshot.underfilled,
      viewerId: facts.viewerId,
      voters: (snapshot.underfilled.responses ?? []).map((response) => ({
        id: response.workerId,
        displayName: response.workerId,
        role: "WORKER",
      })),
    };
  }

  return { locale: facts.locale, surfaceState: "empty" };
}

export function buildQuestDetailTeamProps(
  context: QuestDetailPresentationContext
): TeamAssembleViewProps | undefined {
  const { facts, surface, transitions, bottomInset } = context;
  if (facts.liveTeamSurface && facts.liveSnapshot) {
    return {
      bottomInset,
      canLeaveTeam: facts.projection?.capabilities.canLeaveTeam ?? false,
      canRemoveMember:
        facts.projection?.capabilities.canRemoveTeamMember ?? false,
      canRegenerateJoinCode:
        facts.projection?.capabilities.canRegenerateTeamCode ?? false,
      canUpdateTeam: facts.projection?.capabilities.canUpdateTeam ?? false,
      eligibleMembers: [],
      joinCode: facts.liveTeamSheetTeam?.joinCode,
      joinCodeExpiresAt: facts.liveTeamSheetTeam?.joinCodeExpiresAt,
      teamName: facts.liveTeamSheetTeam?.name,
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
      submitting:
        surface.liveAction === "create-team" ||
        surface.liveAction === "submit-team" ||
        surface.liveAction === "join-team",
      team: facts.liveTeamSheetTeam,
      viewerId: facts.viewerId,
    };
  }
  return undefined;
}

export interface QuestDetailActionBarModel {
  isPostView: boolean;
  canEditPost: boolean;
  canReview: boolean;
  canReviewProof: boolean;
  onReviewProof: () => void;
  /** A Worker's way back to the Work Hub, where a failed Quest's Dispute Case is filed. */
  canOpenWorkHub: boolean;
  onOpenWorkHub: () => void;
  canMessageOwner: boolean;
  onMessageOwner: () => void;
  canShowWithdraw: boolean;
  onLeaveQuest: () => void;
  canApply: boolean;
  firstCome: boolean;
  onOpenApply: () => void;
  onEditPost: () => void;
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
      (facts.quest.status === QuestStatus.QUEST_DRAFT ||
        (facts.quest.status === QuestStatus.QUEST_OPEN &&
          facts.source.kind === "live-snapshot" &&
          facts.liveSnapshot?.actor === QuestActor.HIRER &&
          facts.liveSnapshot.assignments.length === 0 &&
          facts.liveSnapshot.applications.length === 0 &&
          facts.liveSnapshot.teams.length === 0)),
    canReview:
      facts.isPostView &&
      (facts.isHirerView || facts.liveSnapshot?.actor === QuestActor.WORKER) &&
      isTerminalStatus(facts.quest.status) &&
      facts.liveSnapshot?.capabilities.canCreateReview === true,
    canReviewProof:
      facts.isPostView &&
      facts.isHirerView &&
      facts.liveSnapshot?.capabilities.canReviewProof === true,
    onReviewProof: navigation.openProofReview,
    canOpenWorkHub:
      facts.liveSnapshot?.actor === QuestActor.WORKER &&
      facts.quest.status === QuestStatus.QUEST_FAILED,
    onOpenWorkHub: navigation.openWorkHub,
    canMessageOwner: facts.canMessageOwner,
    onMessageOwner: navigation.openMessageOwner,
    canShowWithdraw: facts.canShowWithdraw,
    onLeaveQuest: context.leaveQuest,
    canApply: facts.canApply,
    firstCome: facts.firstCome,
    onOpenApply: transitions.openConfirmation,
    onEditPost: navigation.openEditPost,
    busy: Boolean(surface.liveAction),
  };
}
