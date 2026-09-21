import { useCallback } from "react";

import { useLocale } from "@/features/preferences/localeStore";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import {
  questBoardMessages,
  type QuestBoardMessages,
} from "@/locales/questBoardMessages";
import type { QuestDetailBodyProps } from "../components/QuestDetailBody";
import type { QuestDetailSheetsProps } from "../components/QuestDetailSheets";
import type { QuestDetailReadModel } from "./useQuestDetailReadSource";
import { parseStudentId } from "../questRoute";
import {
  buildQuestDetailActionBar,
  buildQuestDetailBodyProps,
  buildQuestDetailSheetsProps,
  getQuestDetailPresentationFacts,
  type QuestDetailActionBarModel,
  type QuestDetailPresentationContext,
} from "./questDetailPresentation";
import {
  resolveQuestDetailRoute,
  type QuestDetailScreenProps,
} from "./questDetailRoute";
import { useQuestDetailReadSource } from "./useQuestDetailReadSource";
import { useQuestDetailSurfaceState } from "./useQuestDetailSurfaceState";
import { useQuestDetailLiveActions } from "./useQuestDetailLiveActions";
import {
  getQuestDetailPreviewTeamDirectory,
  useQuestDetailPreviewActions,
} from "./useQuestDetailPreviewActions";
import type {
  QuestDetailLiveActionContext,
  QuestDetailPreviewActionContext,
} from "./questDetailActions";
import { useQuestDetailNavigation } from "./useQuestDetailNavigation";
import { useQuestDetailParticipation } from "./useQuestDetailParticipation";
import { useQuestDetailCandidateActions } from "./useQuestDetailCandidateActions";
import { useQuestDetailTeamActions } from "./useQuestDetailTeamActions";

interface QuestDetailFeatureParams extends QuestDetailScreenProps {
  bottomInset: number;
}

type QuestDetailFeatureState = "loading" | "error" | "missing" | "ready";

interface QuestDetailFeatureViewModel {
  handleBack: () => void;
  messages: QuestBoardMessages;
  state: QuestDetailFeatureState;
  quest: QuestDetailReadModel["quest"];
  bodyProps: QuestDetailBodyProps | null;
  sheets: QuestDetailSheetsProps;
  onRetry: () => void;
  actionBar: QuestDetailActionBarModel | null;
}

export function useQuestDetailFeature({
  bottomInset,
  ...screenProps
}: QuestDetailFeatureParams): QuestDetailFeatureViewModel {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const groupMessages = groupQuestMessages[locale];
  const sessionQuery = useSessionQuery();
  const route = resolveQuestDetailRoute({}, screenProps);
  const explicitStudentId = screenProps.studentId;
  const sessionStudentId = parseStudentId(sessionQuery.data?.user.id);
  const viewerId = explicitStudentId ?? sessionStudentId ?? "";
  const sessionReady = Boolean(explicitStudentId) || !sessionQuery.isPending;
  const explicitPreview = screenProps.previewState !== undefined;
  const read = useQuestDetailReadSource({
    questId: route.questId,
    viewerId,
    previewState: route.previewState,
    explicitPreview,
    sessionReady,
  });
  const surface = useQuestDetailSurfaceState();
  const liveActionContext: QuestDetailLiveActionContext = {
    questId: route.questId,
    viewerId,
    quest: read.quest,
    projectionCapabilities: read.projection?.capabilities,
    liveSnapshot:
      read.source.kind === "live-snapshot" ? read.source.snapshot : null,
    messages,
    refresh: read.refresh,
    transitions: surface.transitions,
  };
  const liveActions = useQuestDetailLiveActions(liveActionContext);
  const previewActionContext: QuestDetailPreviewActionContext = {
    questId: route.questId,
    viewerId,
    messages,
    transitions: surface.transitions,
    candidateGroup: Boolean(
      read.quest &&
      read.quest.candidateMode !== "NO_CANDIDATE" &&
      read.quest.participationMode === "team"
    ),
  };
  const previewActions = useQuestDetailPreviewActions(previewActionContext);
  const previewTeamDirectory = getQuestDetailPreviewTeamDirectory({
    state: read.source.kind === "preview" ? read.source.state : null,
    questId: route.questId,
    query: surface.state.teamSearchQuery,
    viewerId,
    isHirer: Boolean(read.projection?.isOwner),
  });
  const navigation = useQuestDetailNavigation({
    quest: read.quest,
    projection: read.projection,
    source: read.source,
    viewerId,
    messages,
    canMessageOwner: Boolean(
      route.mode !== "post" && read.projection?.capabilities.canMessageOwner
    ),
    createCandidateInquiry: liveActions.createCandidateInquiry,
  });
  const facts = getQuestDetailPresentationFacts({
    read,
    route,
    locale,
    messages,
    groupMessages,
    viewerId,
    surface: surface.state,
    teamDirectory: previewTeamDirectory,
  });

  const refresh = read.refresh;
  const onRefresh = useCallback(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);
  const onRetry = onRefresh;

  const participation = useQuestDetailParticipation({
    facts,
    liveActions,
    previewActions,
    navigation,
    transitions: surface.transitions,
  });
  const candidate = useQuestDetailCandidateActions({
    facts,
    liveActions,
    previewActions,
    navigation,
    transitions: surface.transitions,
  });
  const team = useQuestDetailTeamActions({
    facts,
    liveActions,
    previewActions,
    transitions: surface.transitions,
  });

  const presentationContext: QuestDetailPresentationContext | null = facts
    ? {
        facts,
        surface: surface.state,
        transitions: surface.transitions,
        navigation,
        bottomInset,
        onRefresh,
        confirmApplication: participation.confirmApplication,
        leaveQuest: participation.leaveQuest,
        selectCandidate: candidate.selectCandidate,
        rejectCandidate: candidate.rejectCandidate,
        openLiveUnderfilled: team.openLiveUnderfilled,
        liveUnderfilledDecision: team.liveUnderfilledDecision,
        liveUnderfilledConsent: team.liveUnderfilledConsent,
        liveCreateTeam: team.liveCreateTeam,
        liveJoinTeam: team.liveJoinTeam,
        liveLeaveTeam: team.liveLeaveTeam,
        liveRemoveTeamMember: team.liveRemoveTeamMember,
        liveRegenerateTeamCode: team.liveRegenerateTeamCode,
        liveUpdateTeamName: team.liveUpdateTeamName,
        liveSubmitTeam: team.liveSubmitTeam,
        fixtureCreateTeam: team.fixtureCreateTeam,
        fixtureInviteMembers: team.fixtureInviteMembers,
        fixtureSubmitTeam: team.fixtureSubmitTeam,
        fixtureRespondInvitation: team.fixtureRespondInvitation,
        fixturePartialStartVote: team.fixturePartialStartVote,
        uploadTeamFile: liveActions.uploadTeamFile,
      }
    : null;

  const state: QuestDetailFeatureState = read.pending
    ? "loading"
    : read.error
      ? "error"
      : facts
        ? "ready"
        : "missing";

  return {
    handleBack: navigation.handleBack,
    messages,
    state,
    quest: read.quest,
    bodyProps: presentationContext
      ? buildQuestDetailBodyProps(presentationContext)
      : null,
    sheets: presentationContext
      ? buildQuestDetailSheetsProps(presentationContext)
      : {},
    onRetry,
    actionBar: presentationContext
      ? buildQuestDetailActionBar(presentationContext)
      : null,
  };
}
