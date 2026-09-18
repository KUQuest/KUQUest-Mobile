import React, { useEffect, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { AccessibilityInfo, Alert, BackHandler } from "react-native";
import {
  BriefcaseBusiness,
  Check,
  CircleAlert,
  LogOut,
} from "lucide-react-native";
import { ApiError } from "@/api/ApiClient";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { UploadAsset } from "@/api/fileUpload";
import { useCalmRefresh } from "@/hooks/useCalmRefresh";
import { useLocale } from "@/locales/LocaleProvider";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import {
  questBoardMessages,
  type QuestBoardMessages,
} from "@/locales/questBoardMessages";
import { colors } from "@/theme/colors";
import { authService } from "../auth/AuthService";
import {
  canonicalToQuestBoardQuest,
  liveQuestService,
  publicDetailToQuestBoardQuest,
  type LiveQuestSnapshot,
} from "./liveQuestService";
import type { QuestFixtureError } from "./questFixtureAdapter";
import {
  getQuestDetailFixture,
  parseBoardPreviewState,
  type BoardPreviewState,
} from "./questBoardHarness";
import {
  parseQuestDetailMode,
  parseQuestIntent,
  parseQuestJoinStatus,
  parseQuestRouteId,
  parseStudentId,
  type QuestDetailMode,
  type QuestJoinStatus,
} from "./questRoute";
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
} from "./types";
import type { PartialGroupStartVoter } from "./components/PartialGroupStartConsentSheet";
import type { TeamDirectoryMember } from "./components/TeamAssembleSheet";
import { getChatRouteParams } from "@/features/chat/chatData";
import {
  getQuestRewardSatang,
  type QuestActionResult,
  questWorkflow,
  type QuestViewerApplicationStatus,
} from "./questWorkflow";
import type { QuestDetailBodyProps } from "./components/QuestDetailBody";
import type { QuestDetailSheetsProps } from "./components/QuestDetailSheets";
import type { QuestParticipant } from "./components/QuestParticipantRoster";

export interface QuestDetailScreenProps {
  previewState?: BoardPreviewState;
  questId?: string;
  studentId?: string;
  mode?: QuestDetailMode;
  joinStatus?: QuestJoinStatus;
}
export interface QuestDetailControllerParams extends QuestDetailScreenProps {
  bottomInset: number;
}

type DisplayApplicationStatus = QuestViewerApplicationStatus;

export interface QuestDetailControllerResult {
  handleBack: () => void;
  messages: QuestBoardMessages;
  questPending: boolean;
  errorState: boolean;
  quest: QuestBoardQuest | null;
  bodyProps: QuestDetailBodyProps | null;
  sheets: QuestDetailSheetsProps;
  onRetry: () => void;
  actionBar: {
    isPostView: boolean;
    canMessageOwner: boolean;
    onMessageOwner: () => void;
    canShowWithdraw: boolean;
    onLeaveQuest: () => void;
    canApply: boolean;
    firstCome: boolean;
    onOpenApply: () => void;
    onEditPost: () => void;
    busy: boolean;
  } | null;
}

function getLiveActionError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : fallback;
}

function getQuestFixtureError(
  result: QuestActionResult
): QuestFixtureError | undefined {
  return result.ok === false ? result.error : undefined;
}
function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function toQuestBoardQuest(snapshot: LiveQuestSnapshot): QuestBoardQuest {
  return "questFundingTotal" in snapshot.quest
    ? canonicalToQuestBoardQuest(snapshot.quest)
    : publicDetailToQuestBoardQuest(snapshot.quest);
}

function getLiveApplicationStatus(
  snapshot: LiveQuestSnapshot | null
): DisplayApplicationStatus {
  if (snapshot?.assignment?.state === "ASSIGNMENT_ACTIVE") return "accepted";
  if (snapshot?.application?.state === "APPLICATION_APPLIED") return "pending";
  return "none";
}

function getLiveJoinStatus(
  snapshot: LiveQuestSnapshot | null
): QuestJoinStatus | undefined {
  if (!snapshot) return undefined;
  if (
    snapshot.assignment?.state === "ASSIGNMENT_COMPLETED" ||
    snapshot.assignment?.state === "ASSIGNMENT_INCOMPLETE" ||
    snapshot.assignment?.state === "ASSIGNMENT_CANCELLED"
  )
    return "history";
  if (snapshot.assignment?.state === "ASSIGNMENT_ACTIVE") return "accepted";
  if (snapshot.application?.state === "APPLICATION_APPLIED") return "pending";
  return undefined;
}

export function useQuestDetailController({
  previewState,
  questId,
  studentId,
  mode,
  joinStatus,
  bottomInset,
}: QuestDetailControllerParams): QuestDetailControllerResult {
  const router = useRouter();
  const handleBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  }, [router]);
  const openParticipantProfile = React.useCallback(
    (participantId: string) => {
      router.push(`/profile/${participantId}`);
    },
    [router]
  );
  useFocusEffect(
    React.useCallback(() => {
      // Native Modal surfaces consume Android Back through onRequestClose before this focused-screen listener.
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          handleBack();
          return true;
        }
      );
      return () => subscription.remove();
    }, [handleBack])
  );
  const params = useLocalSearchParams<{
    id?: string | string[];
    intent?: string | string[];
    preview?: string | string[];
    mode?: string | string[];
    joinStatus?: string | string[];
    studentId?: string | string[];
  }>();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const resolvedQuestId = parseQuestRouteId(questId ?? params.id);
  const resolvedIntent = parseQuestIntent(params.intent);
  const resolvedMode = mode ?? parseQuestDetailMode(params.mode);
  const resolvedJoinStatus =
    joinStatus ?? parseQuestJoinStatus(params.joinStatus);
  const routeStudentId = parseStudentId(params.studentId);
  const explicitStudentId = studentId ?? routeStudentId;
  const resolvedPreview =
    previewState ?? parseBoardPreviewState(params.preview);
  const explicitPreview = resolvedPreview !== undefined;
  const [sessionStudentId, setSessionStudentId] = useState<
    string | undefined
  >();
  const [sessionResolved, setSessionResolved] = useState(
    Boolean(explicitStudentId)
  );
  const [liveQuest, setLiveQuest] = useState<QuestBoardQuest | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<LiveQuestSnapshot | null>(
    null
  );
  const [liveError, setLiveError] = useState<Error | null>(null);
  const [loadedQuestId, setLoadedQuestId] = useState<string | undefined>();
  const applicationStudentId = explicitStudentId ?? sessionStudentId ?? "";
  const sessionReady = sessionResolved || Boolean(explicitStudentId);
  const isJoinView = resolvedMode === "join";
  const isPostView = resolvedMode === "post";
  const prototypeViewerId = applicationStudentId;
  const loadingQuest = explicitPreview
    ? resolvedPreview === "loading"
    : Boolean(resolvedQuestId && loadedQuestId !== resolvedQuestId);

  useEffect(() => {
    if (explicitStudentId) return undefined;
    let active = true;
    void authService
      .getSession()
      .then((session) => {
        if (!active) return;
        const id = parseStudentId(session?.user.id);
        if (id) setSessionStudentId(id);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSessionResolved(true);
      });
    return () => {
      active = false;
    };
  }, [explicitStudentId]);

  const latestQuestIdRef = React.useRef(resolvedQuestId);
  const loadedQuestIdRef = React.useRef(loadedQuestId);
  useEffect(() => {
    latestQuestIdRef.current = resolvedQuestId;
    return () => {
      latestQuestIdRef.current = undefined;
    };
  }, [resolvedQuestId]);
  useEffect(() => {
    loadedQuestIdRef.current = loadedQuestId;
  }, [loadedQuestId]);

  const loadQuest = React.useCallback(async (): Promise<QuestBoardQuest> => {
    const id = resolvedQuestId;
    if (!id) throw new Error("Quest ID is required");
    if (explicitPreview) {
      const fixture = getQuestDetailFixture(id, resolvedPreview);
      if (!fixture) throw new Error("Quest not found");
      setLoadedQuestId(id);
      return fixture;
    }
    if (typeof liveQuestService.getLiveSnapshot !== "function") {
      if (typeof liveQuestService.getQuestDetail === "function") {
        const quest = await liveQuestService.getQuestDetail(id);
        if (latestQuestIdRef.current === id) {
          setLiveQuest(quest);
          setLoadedQuestId(id);
        }
        return quest;
      }
      throw new Error("Member session is required");
    }
    if (!applicationStudentId) {
      throw new Error("Member session is required");
    }
    setLiveError(null);
    try {
      const snapshot = await liveQuestService.getLiveSnapshot(
        id,
        applicationStudentId
      );
      if (latestQuestIdRef.current === id) {
        setLiveSnapshot(snapshot);
        setLiveQuest(toQuestBoardQuest(snapshot));
        setLoadedQuestId(id);
      }
      return toQuestBoardQuest(snapshot);
    } catch (error) {
      if (latestQuestIdRef.current === id) {
        setLiveError(error instanceof Error ? error : new Error("Load failed"));
        setLoadedQuestId(id);
      }
      throw error;
    }
  }, [applicationStudentId, explicitPreview, resolvedPreview, resolvedQuestId]);

  const { refreshing, refresh, refreshOnFocus } = useCalmRefresh(loadQuest);
  useFocusEffect(
    React.useCallback(() => {
      const liveSnapshotAvailable =
        typeof liveQuestService.getLiveSnapshot === "function";
      if (
        !resolvedQuestId ||
        explicitPreview ||
        (liveSnapshotAvailable && !sessionReady)
      )
        return;
      if (loadedQuestIdRef.current !== resolvedQuestId) {
        void refresh(true).catch(() => undefined);
        return;
      }
      refreshOnFocus();
    }, [
      explicitPreview,
      refresh,
      refreshOnFocus,
      resolvedQuestId,
      sessionReady,
    ])
  );
  useEffect(() => {
    const liveSnapshotAvailable =
      typeof liveQuestService.getLiveSnapshot === "function";
    if (
      !resolvedQuestId ||
      explicitPreview ||
      (liveSnapshotAvailable && !sessionReady)
    )
      return;
    if (loadedQuestIdRef.current !== resolvedQuestId) {
      void refresh(true).catch(() => undefined);
    }
  }, [explicitPreview, refresh, resolvedQuestId, sessionReady]);

  const [, setPrototypeState] = useState<QuestDetailState | null>(null);
  const activePrototypeState =
    explicitPreview && resolvedQuestId
      ? questWorkflow.getQuestDetailState(resolvedQuestId, prototypeViewerId)
      : null;
  const liveQuestForRoute =
    liveQuest?.id === resolvedQuestId ? liveQuest : null;
  const detailProjection =
    explicitPreview && resolvedQuestId
      ? questWorkflow.getQuestDetailProjection(
          resolvedQuestId,
          prototypeViewerId
        )
      : null;
  const prototypeParticipants: QuestParticipant[] =
    activePrototypeState?.assignments
      .filter((assignment) => assignment.status !== "ASSIGNMENT_CANCELLED")
      .map((assignment) => ({
        id: assignment.workerId,
        displayName: assignment.workerId,
      })) ?? [];
  const liveParticipants: QuestParticipant[] =
    liveSnapshot?.participants ??
    liveSnapshot?.assignments
      .filter((assignment) => assignment.state !== "ASSIGNMENT_CANCELLED")
      .map((assignment) => ({
        id: assignment.workerId,
        displayName: assignment.workerId,
      })) ??
    [];
  const participants = explicitPreview
    ? prototypeParticipants
    : liveParticipants;
  const liveParticipantCount = liveSnapshot
    ? "activeWorkerCount" in liveSnapshot.quest
      ? liveSnapshot.quest.activeWorkerCount
      : liveSnapshot.assignments.filter(
          (assignment) => assignment.state !== "ASSIGNMENT_CANCELLED"
        ).length
    : 0;
  const participantCount = explicitPreview
    ? (activePrototypeState?.actualHeadcount ?? prototypeParticipants.length)
    : liveParticipantCount;
  const [liveAction, setLiveAction] = useState<string | null>(null);
  const runLiveAction = React.useCallback(
    async <T>(
      actionName: string,
      action: () => Promise<T>,
      fallbackError: string
    ): Promise<T | undefined> => {
      if (liveAction) return undefined;
      setLiveAction(actionName);
      setLiveError(null);
      try {
        const result = await action();
        await refresh(true).catch(() => undefined);
        return result;
      } catch (error) {
        await refresh(true).catch(() => undefined);
        const message = getLiveActionError(error, fallbackError);
        Alert.alert(messages.details, message);
        return undefined;
      } finally {
        setLiveAction(null);
      }
    },
    [liveAction, messages.details, refresh]
  );
  const quest = explicitPreview
    ? (getQuestDetailFixture(resolvedQuestId, resolvedPreview) ?? null)
    : liveQuestForRoute;
  const applicationState = activePrototypeState;
  const applicationProjection = detailProjection;
  const applicationStatusHydrated = explicitPreview || liveSnapshot !== null;
  const applicationStatus = explicitPreview
    ? (applicationProjection?.applicationStatus ?? "none")
    : getLiveApplicationStatus(liveSnapshot);
  const previewApplicationStatus: DisplayApplicationStatus =
    resolvedPreview === "application-pending"
      ? "pending"
      : resolvedPreview === "application-accepted"
        ? "accepted"
        : applicationStatus;
  const availability =
    resolvedPreview === "full"
      ? "full"
      : resolvedPreview === "closed"
        ? "closed"
        : quest
          ? quest.status === QuestStatus.QUEST_OPEN
            ? "available"
            : "closed"
          : undefined;
  const imageUris = quest?.imageUris?.slice(0, MAX_QUEST_IMAGES) ?? [];
  const [localJoinedStatus, setJoinedStatus] = useState<
    QuestJoinStatus | undefined
  >();
  const joinedStatus: QuestJoinStatus | undefined =
    localJoinedStatus ??
    (isJoinView && applicationStatusHydrated
      ? explicitPreview
        ? (resolvedJoinStatus ??
          (applicationStatus === "pending" || applicationStatus === "accepted"
            ? applicationStatus
            : "accepted"))
        : getLiveJoinStatus(liveSnapshot)
      : undefined);
  const firstCome = quest?.candidateMode === "NO_CANDIDATE";
  const candidateGroup = Boolean(
    quest && !firstCome && quest.participationMode === "team"
  );
  const canonicalOpen = quest?.status === QuestStatus.QUEST_OPEN;
  const partialStartPending = explicitPreview
    ? (detailProjection?.partialStartPending ?? false)
    : liveSnapshot?.nextAction === "CONSENT_UNDERFILLED";
  const liveCanApply = Boolean(
    liveSnapshot?.nextAction === "APPLY" && liveSnapshot.capabilities.canApply
  );
  const liveCanJoin = Boolean(
    liveSnapshot?.nextAction === "JOIN" && liveSnapshot.capabilities.canJoin
  );
  const legacyCanApply = Boolean(
    applicationState?.capabilities.availableActions.includes(
      firstCome ? "DIRECT_JOIN" : "APPLY"
    )
  );
  const serverCanJoin = explicitPreview
    ? Boolean(
        firstCome &&
        applicationStudentId &&
        quest &&
        quest.hasJoined === false &&
        quest.acceptedParticipants < quest.headcount
      )
    : liveCanJoin;
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
      ? serverCanJoin
      : explicitPreview
        ? legacyCanApply
        : liveCanApply);
  const canWithdrawApplication =
    applicationStatusHydrated &&
    !isPostView &&
    Boolean(
      explicitPreview
        ? applicationStatus === "pending"
        : liveSnapshot?.capabilities.canWithdrawApplication
    );
  const [manualConfirmationOpen, setManualConfirmationOpen] = useState(false);
  const [leftQuest, setLeftQuest] = useState(false);
  const canShowWithdraw =
    !isPostView &&
    !leftQuest &&
    canWithdrawApplication &&
    (isJoinView ? joinedStatus === "pending" : applicationStatus === "pending");
  const routeIntentKey = `${resolvedQuestId ?? ""}:${resolvedIntent ?? ""}`;
  const [dismissedIntent, setDismissedIntent] = useState<string | undefined>();
  const confirmationOpen =
    manualConfirmationOpen ||
    (resolvedIntent === "apply" &&
      dismissedIntent !== routeIntentKey &&
      canApply);
  const canMessageOwner = Boolean(
    quest &&
    !isPostView &&
    quest.ownerStudentId !== applicationStudentId &&
    (explicitPreview
      ? detailProjection?.conversationCapability.conversationId &&
        detailProjection.conversationCapability.canRead
      : liveSnapshot?.state === "QUEST_OPEN" &&
        liveSnapshot.actor !== "HIRER" &&
        liveSnapshot.assignment === null)
  );
  const canReportQuest = Boolean(
    isJoinView &&
    !leftQuest &&
    (joinedStatus === "accepted" || joinedStatus === "history") &&
    (explicitPreview
      ? applicationProjection?.isAssigned
      : liveSnapshot?.assignment !== null)
  );
  const statusTitle = isPostView
    ? messages.postOwnerView
    : isJoinView
      ? leftQuest
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
      ? leftQuest
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
  const StatusIcon = statusIsUnavailable
    ? CircleAlert
    : isPostView
      ? BriefcaseBusiness
      : leftQuest
        ? LogOut
        : Check;
  const statusIconColor = statusIsUnavailable
    ? colors.textMuted
    : leftQuest
      ? colors.dangerDark
      : colors.primary;
  const groupMessages = groupQuestMessages[locale];
  const isHirerView = explicitPreview
    ? (detailProjection?.isOwner ?? false)
    : liveSnapshot?.actor === "HIRER";
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);
  const [candidateReviewSheetOpen, setCandidateReviewSheetOpen] =
    useState(false);
  const [partialStartSheetDismissed, setPartialStartSheetDismissed] =
    useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamSelectedMemberIds, setTeamSelectedMemberIds] = useState<string[]>(
    []
  );
  const [teamReviewing, setTeamReviewing] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null
  );

  const teamSheetTeam = (() => {
    if (!activePrototypeState || !candidateGroup || isHirerView)
      return undefined;
    const ownTeam = activePrototypeState.teams.find(
      (team) =>
        team.members.some(
          (member) => member.workerId === applicationStudentId
        ) || team.leaderId === applicationStudentId
    );
    if (ownTeam) return ownTeam;
    const invitation = activePrototypeState.invitations.find(
      (item) =>
        item.invitedWorkerId === applicationStudentId &&
        item.status === QuestInvitationStatus.INVITATION_PENDING
    );
    return invitation
      ? activePrototypeState.teams.find((team) => team.id === invitation.teamId)
      : undefined;
  })();
  const teamDirectory: TeamDirectoryMember[] =
    !resolvedQuestId ||
    !activePrototypeState ||
    !candidateGroup ||
    isHirerView ||
    teamSheetTeam?.leaderId !== applicationStudentId ||
    teamSheetTeam.status !== QuestTeamStatus.TEAM_FORMING
      ? []
      : questWorkflow.searchMembers(
          resolvedQuestId,
          teamSearchQuery,
          applicationStudentId
        );
  const consent = activePrototypeState?.partialStartConsent;
  const partialVoters: PartialGroupStartVoter[] =
    !activePrototypeState || !consent
      ? []
      : consent.requiredVoterIds.map((id) => ({
          id,
          displayName:
            id === activePrototypeState.quest.hirerId
              ? (quest?.creator.name ?? id)
              : id,
          role: id === activePrototypeState.quest.hirerId ? "HIRER" : "WORKER",
        }));
  const liveCandidateGroup =
    !explicitPreview &&
    liveSnapshot?.participation === "GROUP" &&
    liveSnapshot.mode === "CANDIDATE" &&
    !isHirerView;
  const liveTeamSheetTeam = liveCandidateGroup
    ? (liveSnapshot?.team ??
      liveSnapshot?.teams.find(
        (team) =>
          team.state === "TEAM_FORMING" && team.members.length < team.headcount
      ) ??
      null)
    : null;
  const liveTeamSurface = Boolean(
    liveCandidateGroup &&
    liveSnapshot &&
    (liveSnapshot.team ||
      liveSnapshot.capabilities.canCreateTeam ||
      liveSnapshot.capabilities.canJoinTeam)
  );
  const livePartialVoters: PartialGroupStartVoter[] =
    !liveSnapshot?.underfilled || !liveSnapshot.underfilled.responses
      ? []
      : liveSnapshot.underfilled.responses.map((response) => ({
          id: response.workerId,
          displayName: response.workerId,
          role: "WORKER",
        }));
  const partialStartSheetOpen =
    Boolean(activePrototypeState?.partialStartConsent) &&
    activePrototypeState?.partialStartConsent?.status !==
      QuestPartialStartConsentStatus.PARTIAL_START_APPROVED &&
    !partialStartSheetDismissed;
  const confirmApplication = async () => {
    if (!quest || !canApply) return;
    if (firstCome && !explicitPreview) {
      const result = await runLiveAction(
        "join",
        () => liveQuestService.joinQuest(quest.id),
        "Failed to join quest"
      );
      if (!result) return;
      setJoinedStatus("accepted");
      setManualConfirmationOpen(false);
      router.push("/my-quests");
      Alert.alert(
        messages.confirmParticipationTitle,
        messages.participationConfirmed
      );
      return;
    }

    if (!explicitPreview && liveSnapshot?.capabilities.canApply) {
      const result = await runLiveAction(
        "apply",
        () =>
          liveQuestService.applyQuest(quest.id, createQuestIdempotencyKey()),
        "Failed to apply"
      );
      if (!result) return;
      setManualConfirmationOpen(false);
      setDismissedIntent(routeIntentKey);
      return;
    }

    const result: QuestActionResult = questWorkflow.dispatch({
      type: firstCome ? "DIRECT_JOIN" : "APPLY",
      questId: quest.id,
      workerId: applicationStudentId,
    });
    const fixtureError = getQuestFixtureError(result);
    if (fixtureError) {
      Alert.alert(messages.details, fixtureError.message);
      return;
    }
    if (result.state) setPrototypeState(result.state);
    setManualConfirmationOpen(false);
    setDismissedIntent(routeIntentKey);
  };

  const handleLeaveQuest = () => {
    if (
      !quest ||
      (isJoinView
        ? joinedStatus !== "pending"
        : applicationStatus !== "pending")
    )
      return;
    const label = messages.withdrawApplication;
    const description = messages.withdrawApplicationDescription;
    Alert.alert(label, description, [
      { text: messages.cancel, style: "cancel" },
      {
        text: label,
        style: "destructive",
        onPress: () => {
          void (async () => {
            if (
              !explicitPreview &&
              liveSnapshot?.capabilities.canWithdrawApplication &&
              liveSnapshot.application
            ) {
              const result = await runLiveAction(
                "withdraw",
                () =>
                  liveQuestService.withdrawApplication(
                    quest.id,
                    liveSnapshot.application!.id,
                    createQuestIdempotencyKey()
                  ),
                "Failed to withdraw application"
              );
              if (!result) return;
            } else {
              const result = questWorkflow.dispatch({
                type: "WITHDRAW_APPLICATION",
                questId: quest.id,
                workerId: applicationStudentId,
              });
              const fixtureError = getQuestFixtureError(result);
              if (fixtureError) {
                Alert.alert(messages.details, fixtureError.message);
                return;
              }
              setPrototypeState(result.state);
            }
            setLeftQuest(true);
            announce(messages.leftQuest);
          })();
        },
      },
    ]);
  };

  const handleEditPost = () => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/edit",
      params: { id: quest.id },
    });
  };
  const handleOpenWorkHub = () => {
    router.push("/my-quests");
  };

  const handleMessageOwner = () => {
    if (!quest || !canMessageOwner) return;
    if (explicitPreview) {
      const capability = detailProjection?.conversationCapability;
      if (!capability?.conversationId || !capability.canRead) return;
      router.push({
        pathname: "/chat/[id]",
        params: getChatRouteParams({
          conversationId: capability.conversationId,
          questId: quest.id,
          viewerId: applicationStudentId,
          ownerName: quest.creator.name,
          questTitle: quest.title,
        }),
      });
      return;
    }
    void liveQuestService
      .createCandidateInquiry(quest.id)
      .then((inquiry) => {
        router.push({
          pathname: "/quest/[id]/inquiry/[conversationId]",
          params: {
            id: quest.id,
            conversationId: inquiry.id,
            viewerId: applicationStudentId,
          },
        });
      })
      .catch((error) => {
        Alert.alert(
          messages.details,
          error instanceof Error ? error.message : messages.messageOwnerError
        );
      });
  };

  const handleReportQuest = () => {
    if (!quest || !canReportQuest) return;
    router.push({
      pathname: "/report",
      params: {
        source: "quest",
        questId: quest.id,
        questTitle: quest.title,
        viewerId: applicationStudentId,
        reportedMemberId: quest.ownerStudentId,
      },
    });
  };

  const applyPrototypeResult = (result: QuestActionResult) => {
    const fixtureError = getQuestFixtureError(result);
    if (fixtureError) {
      Alert.alert(messages.details, fixtureError.message);
      return;
    }
    if (result.state) setPrototypeState(result.state);
  };
  const handleCreateTeam = () => {
    if (resolvedQuestId)
      applyPrototypeResult(
        questWorkflow.dispatch({
          type: "CREATE_TEAM",
          questId: resolvedQuestId,
          leaderId: applicationStudentId,
        })
      );
  };
  const handleInviteMembers = (memberIds: string[]) => {
    memberIds.forEach((memberId) => {
      if (resolvedQuestId)
        applyPrototypeResult(
          questWorkflow.dispatch({
            type: "INVITE_WORKER",
            questId: resolvedQuestId,
            workerId: memberId,
            leaderId: applicationStudentId,
          })
        );
    });
  };
  const handleSubmitTeam = (teamId: string) => {
    if (resolvedQuestId && teamSheetTeam?.id === teamId)
      applyPrototypeResult(
        questWorkflow.dispatch({
          type: "SUBMIT_TEAM",
          questId: resolvedQuestId,
          leaderId: applicationStudentId,
        })
      );
  };
  const handleInvitation = (invitationId: string, accept: boolean) => {
    if (resolvedQuestId)
      applyPrototypeResult(
        questWorkflow.dispatch({
          type: "RESPOND_INVITATION",
          questId: resolvedQuestId,
          invitationId,
          workerId: applicationStudentId,
          accept,
        })
      );
  };
  const handlePartialStartVote = (approve: boolean) => {
    if (!resolvedQuestId) return;
    if (!explicitPreview && liveSnapshot?.capabilities.canConsentUnderfilled) {
      void runLiveAction(
        "underfilled-consent",
        () =>
          liveQuestService.respondUnderfilledConsent(
            resolvedQuestId,
            approve ? "ACCEPT" : "DECLINE",
            createQuestIdempotencyKey()
          ),
        "Failed to respond to underfilled consent"
      );
      return;
    }
    applyPrototypeResult(
      questWorkflow.dispatch({
        type: "VOTE_PARTIAL_START_CONSENT",
        questId: resolvedQuestId,
        voterId: prototypeViewerId,
        approve,
      })
    );
  };
  const handleSelectCandidate = (proposalId: string) => {
    if (!resolvedQuestId) return;
    if (!explicitPreview && liveSnapshot) {
      const operation =
        liveSnapshot.participation === "GROUP"
          ? () =>
              liveQuestService.selectCandidateTeam(
                resolvedQuestId,
                proposalId,
                createQuestIdempotencyKey()
              )
          : () =>
              liveQuestService.selectApplication(
                resolvedQuestId,
                proposalId,
                createQuestIdempotencyKey()
              );
      void runLiveAction(
        "select-candidate",
        operation,
        "Failed to select candidate proposal"
      ).then((result) => {
        if (!result) return;
        setCandidateReviewSheetOpen(false);
        router.push("/my-quests");
      });
      return;
    }
    applyPrototypeResult(
      questWorkflow.dispatch({
        type: "SELECT_CANDIDATE",
        questId: resolvedQuestId,
        applicationId: proposalId,
        hirerId: prototypeViewerId,
      })
    );
  };
  const handleRejectCandidate = (proposalId: string) => {
    if (!resolvedQuestId || !quest) return;
    const isGroup =
      !explicitPreview && liveSnapshot
        ? liveSnapshot.participation === "GROUP"
        : candidateGroup;
    const proposalType = isGroup
      ? groupMessages.teamProposal
      : groupMessages.individualProposal;
    Alert.alert(groupMessages.reject, `${quest.title}\n${proposalType}`, [
      { text: groupMessages.cancel, style: "cancel" },
      {
        text: groupMessages.reject,
        style: "destructive",
        onPress: () => {
          if (!explicitPreview && liveSnapshot) {
            const operation =
              liveSnapshot.participation === "GROUP"
                ? () =>
                    liveQuestService.rejectCandidateTeam(
                      resolvedQuestId,
                      proposalId,
                      createQuestIdempotencyKey()
                    )
                : () =>
                    liveQuestService.rejectApplication(
                      resolvedQuestId,
                      proposalId,
                      createQuestIdempotencyKey()
                    );
            void runLiveAction<unknown>(
              "reject-candidate",
              operation,
              "Failed to reject candidate proposal"
            ).then((result) => {
              if (!result) return;
              setSelectedProposalId(null);
            });
            return;
          }
          const result = candidateGroup
            ? questWorkflow.dispatch({
                type: "REJECT_TEAM",
                questId: resolvedQuestId,
                teamId: proposalId,
                hirerId: prototypeViewerId,
              })
            : questWorkflow.dispatch({
                type: "REJECT_CANDIDATE",
                questId: resolvedQuestId,
                applicationId: proposalId,
                hirerId: prototypeViewerId,
              });
          applyPrototypeResult(result);
        },
      },
    ]);
  };
  const handleOpenLiveUnderfilled = () => {
    setPartialStartSheetDismissed(false);
    if (!resolvedQuestId || explicitPreview || liveSnapshot?.underfilled)
      return;
    void runLiveAction(
      "underfilled-load",
      () => liveQuestService.getUnderfilled(resolvedQuestId),
      "Failed to load underfilled Quest status"
    );
  };
  const handleLiveUnderfilledDecision = (decision: "PROCEED" | "CANCEL") => {
    if (
      !resolvedQuestId ||
      explicitPreview ||
      !liveSnapshot?.capabilities.canDecideUnderfilled
    )
      return;
    void runLiveAction(
      "underfilled-decision",
      () =>
        liveQuestService.decideUnderfilled(
          resolvedQuestId,
          decision,
          createQuestIdempotencyKey()
        ),
      "Failed to update underfilled Quest decision"
    );
  };
  const handleLiveUnderfilledConsent = (decision: "ACCEPT" | "DECLINE") => {
    if (
      !resolvedQuestId ||
      explicitPreview ||
      !liveSnapshot?.capabilities.canConsentUnderfilled
    )
      return;
    void runLiveAction(
      "underfilled-consent",
      () =>
        liveQuestService.respondUnderfilledConsent(
          resolvedQuestId,
          decision,
          createQuestIdempotencyKey()
        ),
      "Failed to respond to underfilled consent"
    );
  };
  const handleLiveCreateTeam = () => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canCreateTeam
    )
      return;
    void runLiveAction(
      "create-team",
      () =>
        liveQuestService.createCandidateTeam(
          resolvedQuestId,
          {
            name: `${quest?.title ?? "Quest"} Team`,
            headcount: quest?.headcount ?? 2,
          },
          createQuestIdempotencyKey()
        ),
      "Failed to create Quest Team"
    );
  };
  const handleLiveJoinTeam = (joinCode: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveTeamSheetTeam ||
      !liveSnapshot?.capabilities.canJoinTeam
    )
      return;
    void runLiveAction(
      "join-team",
      () =>
        liveQuestService.joinCandidateTeam(
          resolvedQuestId,
          liveTeamSheetTeam.id,
          joinCode,
          createQuestIdempotencyKey()
        ),
      "Failed to join Quest Team"
    );
  };
  const handleLiveLeaveTeam = (teamId: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canLeaveTeam
    )
      return;
    void runLiveAction(
      "leave-team",
      () =>
        liveQuestService.leaveCandidateTeam(
          resolvedQuestId,
          teamId,
          createQuestIdempotencyKey()
        ),
      "Failed to leave Quest Team"
    );
  };
  const handleLiveRemoveTeamMember = (teamId: string, memberId: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canRemoveTeamMember
    )
      return;
    void runLiveAction(
      "remove-team-member",
      () =>
        liveQuestService.removeCandidateTeamMember(
          resolvedQuestId,
          teamId,
          memberId,
          createQuestIdempotencyKey()
        ),
      "Failed to remove team member"
    );
  };
  const handleLiveRegenerateTeamCode = (teamId: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canRegenerateTeamCode
    )
      return;
    void runLiveAction(
      "regenerate-team-code",
      () =>
        liveQuestService.regenerateCandidateTeamJoinCode(
          resolvedQuestId,
          teamId,
          createQuestIdempotencyKey()
        ),
      "Failed to regenerate team join code"
    );
  };
  const handleLiveUpdateTeamName = (teamId: string, name: string) => {
    if (
      !resolvedQuestId ||
      !liveCandidateGroup ||
      !liveSnapshot?.capabilities.canUpdateTeam
    )
      return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    void runLiveAction(
      "update-team",
      () =>
        liveQuestService.updateCandidateTeam(
          resolvedQuestId,
          teamId,
          { name: trimmedName },
          createQuestIdempotencyKey()
        ),
      "Failed to update Quest Team name"
    );
  };
  const handleLiveSubmitTeam = (
    teamId: string,
    payload?: { text?: string; fileIds?: string[] }
  ) => {
    if (!resolvedQuestId || !liveCandidateGroup) return;
    void runLiveAction(
      "submit-team",
      async () => {
        const result = await liveQuestService.submitCandidateTeam(
          resolvedQuestId,
          teamId,
          payload ?? {},
          createQuestIdempotencyKey()
        );
        setTeamSheetOpen(false);
        setTeamReviewing(false);
        return result;
      },
      "Failed to submit Quest Team"
    );
  };
  const handleLiveUploadTeamFile = React.useCallback(
    async (asset: UploadAsset) => {
      if (!resolvedQuestId || !liveTeamSheetTeam) {
        throw new Error("No active team");
      }
      const uploaded = await liveQuestService.uploadCandidateTeamFile(
        resolvedQuestId,
        liveTeamSheetTeam.id,
        asset,
        createQuestIdempotencyKey()
      );
      return {
        id: uploaded.fileId,
        name: uploaded.fileName,
        sizeBytes: uploaded.sizeBytes,
      };
    },
    [liveTeamSheetTeam, resolvedQuestId]
  );
  const canonicalStatus =
    liveSnapshot?.state ?? activePrototypeState?.quest.status;
  const questPending = loadingQuest || resolvedPreview === "loading";
  const errorState = Boolean(liveError) || resolvedPreview === "error";
  const onRetry = () => {
    setLiveError(null);
    setLoadedQuestId(undefined);
    void refresh(true).catch(() => undefined);
  };
  const bodyProps: QuestDetailBodyProps | null = quest
    ? {
        canParticipate: canApply,
        participationFirstCome: Boolean(firstCome),
        onOpenParticipation: () => setManualConfirmationOpen(true),
        participationBusy: Boolean(liveAction),
        participants,
        participantCount,
        onOpenParticipantProfile: openParticipantProfile,
        canReportQuest,
        canonicalStatus,
        imageUris,
        liveEntry:
          !explicitPreview && liveSnapshot
            ? {
                snapshot: liveSnapshot,
                groupMessages,
                busy: Boolean(liveAction),
                onOpenTeam: () => setTeamSheetOpen(true),
                onOpenCandidateReview: () => {
                  setSelectedProposalId(null);
                  setCandidateReviewSheetOpen(true);
                },
                onOpenPartialConsent: handleOpenLiveUnderfilled,
              }
            : undefined,
        messages,
        locale,
        onOpenWorkHub: handleOpenWorkHub,
        onRefresh: () => {
          void refresh(true).catch(() => undefined);
        },
        onReportQuest: handleReportQuest,
        prototypeEntry: activePrototypeState
          ? {
              state: activePrototypeState,
              viewerId: prototypeViewerId,
              isHirer: isHirerView,
              messages: groupMessages,
              onOpenTeam: () => setTeamSheetOpen(true),
              onOpenCandidateReview: () => {
                setSelectedProposalId(null);
                setCandidateReviewSheetOpen(true);
              },
              onOpenPartialConsent: () => setPartialStartSheetDismissed(false),
            }
          : undefined,
        quest,
        refreshing,
        status: statusTitle
          ? {
              title: statusTitle,
              description: statusDescription,
              unavailable: statusIsUnavailable,
              postView: isPostView,
              leftQuest,
              history: joinedStatus === "history",
              Icon: StatusIcon,
              iconColor: statusIconColor,
            }
          : undefined,
      }
    : null;
  const sheets: QuestDetailSheetsProps = quest
    ? {
        confirmationSheet: confirmationOpen
          ? {
              locale,
              messages,
              onCancel: () => {
                setManualConfirmationOpen(false);
                setDismissedIntent(routeIntentKey);
              },
              onConfirm: confirmApplication,
              busy: Boolean(liveAction),
              quest,
            }
          : undefined,
        liveCandidateSheet:
          !explicitPreview &&
          liveSnapshot &&
          liveSnapshot.actor === "HIRER" &&
          liveSnapshot.mode === "CANDIDATE" &&
          (liveSnapshot.capabilities.canSelectCandidate ||
            liveSnapshot.capabilities.canSelectTeam ||
            liveSnapshot.capabilities.canRejectCandidate ||
            liveSnapshot.capabilities.canRejectTeam)
            ? {
                actualHeadcount: liveSnapshot.assignments.length,
                applications: liveSnapshot.applications,
                bottomInset,
                fullScreen: true,
                loading:
                  liveAction === "select-candidate" ||
                  liveAction === "reject-candidate",
                locale,
                mode:
                  liveSnapshot.participation === "GROUP"
                    ? "team"
                    : "individual",
                onAcceptProposal: liveAction
                  ? undefined
                  : handleSelectCandidate,
                onRejectProposal: liveAction
                  ? undefined
                  : handleRejectCandidate,
                onClose: () => {
                  setCandidateReviewSheetOpen(false);
                  setSelectedProposalId(null);
                },
                onSelectProposal: setSelectedProposalId,
                rewardSatangPerWorker: getQuestRewardSatang(quest),
                requestedHeadcount: liveSnapshot.quest.headcount,
                selectedProposalId,
                teams:
                  liveSnapshot.participation === "GROUP"
                    ? liveSnapshot.teams
                    : [],
                visible: candidateReviewSheetOpen,
              }
            : undefined,
        liveConsentSheet:
          !explicitPreview &&
          liveSnapshot?.participation === "GROUP" &&
          liveSnapshot.mode === "FIRST_COME_FIRST_SERVED" &&
          liveSnapshot.underfilled
            ? {
                actualHeadcount: liveSnapshot.underfilled.activeWorkerCount,
                bottomInset,
                canConsent: liveSnapshot.capabilities.canConsentUnderfilled,
                canDecide: liveSnapshot.capabilities.canDecideUnderfilled,
                canRespond:
                  liveSnapshot.capabilities.canConsentUnderfilled ||
                  liveSnapshot.capabilities.canDecideUnderfilled,
                error: undefined,
                loading:
                  liveAction === "underfilled-decision" ||
                  liveAction === "underfilled-consent",
                locale,
                onClose: () => setPartialStartSheetDismissed(true),
                onHirerDecision: handleLiveUnderfilledDecision,
                onWorkerConsent: handleLiveUnderfilledConsent,
                questTitle: quest.title,
                requestedHeadcount: liveSnapshot.underfilled.headcount,
                underfilled: liveSnapshot.underfilled,
                viewerId: applicationStudentId,
                visible:
                  !partialStartSheetDismissed &&
                  (liveSnapshot.nextAction === "DECIDE_UNDERFILLED" ||
                    liveSnapshot.nextAction === "CONSENT_UNDERFILLED"),
                voters: livePartialVoters,
              }
            : undefined,
        liveTeamSheet:
          liveTeamSurface && liveSnapshot
            ? {
                bottomInset,
                canLeaveTeam: liveSnapshot.capabilities.canLeaveTeam,
                canRemoveMember: liveSnapshot.capabilities.canRemoveTeamMember,
                canRegenerateJoinCode:
                  liveSnapshot.capabilities.canRegenerateTeamCode,
                canUpdateTeam: liveSnapshot.capabilities.canUpdateTeam,
                eligibleMembers: [],
                joinCode: liveTeamSheetTeam?.joinCode,
                joinCodeExpiresAt: liveTeamSheetTeam?.joinCodeExpiresAt,
                teamName: liveTeamSheetTeam?.name,
                onClose: () => {
                  setTeamSheetOpen(false);
                  setTeamReviewing(false);
                  setTeamSelectedMemberIds([]);
                  setTeamSearchQuery("");
                },
                onCreateTeam: liveSnapshot.capabilities.canCreateTeam
                  ? handleLiveCreateTeam
                  : undefined,
                onJoinTeam: liveSnapshot.capabilities.canJoinTeam
                  ? handleLiveJoinTeam
                  : undefined,
                onLeaveTeam: handleLiveLeaveTeam,
                onRemoveMember: handleLiveRemoveTeamMember,
                onRegenerateJoinCode: handleLiveRegenerateTeamCode,
                onUpdateTeamName: handleLiveUpdateTeamName,
                onReviewChange: setTeamReviewing,
                onSubmitTeam: handleLiveSubmitTeam,
                onUploadProposalFile: handleLiveUploadTeamFile,
                requestedHeadcount: liveSnapshot.quest.headcount,
                reviewing: teamReviewing,
                searchQuery: teamSearchQuery,
                submitting: liveAction === "submit-team",
                team: liveTeamSheetTeam,
                viewerId: applicationStudentId,
                visible: teamSheetOpen,
              }
            : undefined,
        prototypeCandidateSheet:
          activePrototypeState &&
          isHirerView &&
          quest.candidateMode === QuestCandidateMode.CANDIDATE
            ? {
                actualHeadcount: activePrototypeState.actualHeadcount,
                applications: activePrototypeState.applications,
                bottomInset,
                locale,
                mode: candidateGroup ? "team" : "individual",
                onAcceptProposal:
                  activePrototypeState.capabilities.availableActions.includes(
                    "SELECT_CANDIDATE"
                  )
                    ? handleSelectCandidate
                    : undefined,
                onClose: () => {
                  setCandidateReviewSheetOpen(false);
                  setSelectedProposalId(null);
                },
                onRejectProposal:
                  activePrototypeState.capabilities.availableActions.includes(
                    candidateGroup ? "REJECT_TEAM" : "REJECT_CANDIDATE"
                  )
                    ? handleRejectCandidate
                    : undefined,
                onSelectProposal: setSelectedProposalId,
                questTitle: quest.title,
                requestedHeadcount: activePrototypeState.quest.headcount,
                rewardSatangPerWorker:
                  activePrototypeState.quest.reward.rewardSatang,
                selectedProposalId,
                settlement: detailProjection?.settlement ?? undefined,
                teams: candidateGroup
                  ? activePrototypeState.teams.filter(
                      (team) => team.status !== QuestTeamStatus.TEAM_FORMING
                    )
                  : [],
                visible: candidateReviewSheetOpen,
                fullScreen: true,
              }
            : undefined,
        prototypeConsentSheet:
          activePrototypeState &&
          activePrototypeState.quest.participation ===
            QuestParticipation.GROUP &&
          activePrototypeState.quest.candidateMode ===
            QuestCandidateMode.NO_CANDIDATE &&
          activePrototypeState.partialStartConsent
            ? {
                actualHeadcount: activePrototypeState.actualHeadcount,
                bottomInset,
                canRespond:
                  activePrototypeState.capabilities.availableActions.includes(
                    "VOTE_PARTIAL_GROUP_START_CONSENT"
                  ),
                consent: activePrototypeState.partialStartConsent,
                hirerId: activePrototypeState.quest.hirerId,
                locale,
                onClose: () => setPartialStartSheetDismissed(true),
                onVote: handlePartialStartVote,
                questTitle: quest.title,
                requestedHeadcount: activePrototypeState.quest.headcount,
                voters: partialVoters,
                viewerId: prototypeViewerId,
                visible: partialStartSheetOpen,
              }
            : undefined,
        prototypeTeamSheet:
          activePrototypeState && candidateGroup && !isHirerView
            ? {
                bottomInset,
                eligibleMembers: teamDirectory,
                invitations: activePrototypeState.invitations,
                locale,
                onClose: () => {
                  setTeamSheetOpen(false);
                  setTeamReviewing(false);
                  setTeamSelectedMemberIds([]);
                  setTeamSearchQuery("");
                },
                onCreateTeam:
                  activePrototypeState.capabilities.availableActions.includes(
                    "CREATE_TEAM"
                  )
                    ? handleCreateTeam
                    : undefined,
                onInviteMembers:
                  activePrototypeState.capabilities.availableActions.includes(
                    "INVITE_WORKER"
                  )
                    ? handleInviteMembers
                    : undefined,
                onRespondInvitation:
                  activePrototypeState.capabilities.availableActions.includes(
                    "RESPOND_INVITATION"
                  )
                    ? handleInvitation
                    : undefined,
                onSearchQueryChange: setTeamSearchQuery,
                onSelectedMemberIdsChange: setTeamSelectedMemberIds,
                onReviewChange: setTeamReviewing,
                onSubmit:
                  activePrototypeState.capabilities.availableActions.includes(
                    "SUBMIT_TEAM"
                  )
                    ? handleSubmitTeam
                    : undefined,
                requestedHeadcount: activePrototypeState.quest.headcount,
                reviewing: teamReviewing,
                searchQuery: teamSearchQuery,
                selectedMemberIds: teamSelectedMemberIds,
                team: teamSheetTeam,
                viewerId: applicationStudentId,
                visible: teamSheetOpen,
              }
            : undefined,
      }
    : {};
  const actionBar: QuestDetailControllerResult["actionBar"] = quest
    ? {
        isPostView,
        canMessageOwner,
        onMessageOwner: handleMessageOwner,
        canShowWithdraw,
        onLeaveQuest: handleLeaveQuest,
        canApply,
        firstCome: Boolean(firstCome),
        onOpenApply: () => setManualConfirmationOpen(true),
        onEditPost: handleEditPost,
        busy: Boolean(liveAction),
      }
    : null;
  return {
    handleBack,
    messages,
    questPending,
    errorState,
    quest,
    bodyProps,
    sheets,
    onRetry,
    actionBar,
  };
}
