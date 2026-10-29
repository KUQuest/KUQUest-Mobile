import { useCallback } from "react";

import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useLocale } from "@/features/preferences/localeStore";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import {
  questBoardMessages,
  type QuestBoardMessages,
} from "@/locales/questBoardMessages";
import type { QuestDetailBodyProps } from "./components/QuestDetailBody";
import type { QuestDetailSheetsProps } from "./components/QuestDetailSheets";
import type { TeamAssembleViewProps } from "../teamAssemble/components/TeamAssembleView";
import type { PartialGroupStartConsentContentProps } from "../teamAssemble/components/PartialGroupStartConsentContent";
import type { QuestDetailReadModel } from "./useQuestDetailReadSource";
import {
  buildQuestDetailActionBar,
  buildQuestDetailBodyProps,
  buildQuestDetailPartialStartProps,
  buildQuestDetailSheetsProps,
  buildQuestDetailTeamProps,
  getQuestDetailPresentationFacts,
  type QuestDetailActionBarModel,
  type QuestDetailPresentationContext,
} from "./questDetailPresentation";
import {
  parseSingleRouteParam,
  resolveQuestDetailRoute,
  type QuestDetailScreenProps,
} from "./questDetailRoute";
import { useQuestDetailReadSource } from "./useQuestDetailReadSource";
import { useQuestTagsQuery } from "../api/questTagsQueries";
import { useQuestDetailSurfaceState } from "./useQuestDetailSurfaceState";
import { useQuestDetailLiveActions } from "./useQuestDetailLiveActions";
import type { QuestDetailLiveActionContext } from "./questDetailActions";
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
  /** Quest Team surface props; rendered by the Quest Team route. */
  team: TeamAssembleViewProps | undefined;
  partialStartConsent: PartialGroupStartConsentContentProps;
  onRetry: () => void;
  actionBar: QuestDetailActionBarModel | null;
}

export function useQuestDetailFeature({
  bottomInset,
  ...screenProps
}: QuestDetailFeatureParams): QuestDetailFeatureViewModel {
  const { colors } = useAppTheme();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const groupMessages = groupQuestMessages[locale];
  const sessionQuery = useSessionQuery();
  const route = resolveQuestDetailRoute({}, screenProps);
  const explicitStudentId = screenProps.studentId;
  const sessionStudentId = parseSingleRouteParam(sessionQuery.data?.user.id);
  const viewerId = explicitStudentId ?? sessionStudentId ?? "";
  const sessionReady = Boolean(explicitStudentId) || !sessionQuery.isPending;
  const tagQuery = useQuestTagsQuery();
  const tagCatalog = tagQuery.data ?? [];
  const read = useQuestDetailReadSource({
    questId: route.questId,
    viewerId,
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
    transitions: surface.transitions,
  };
  const liveActions = useQuestDetailLiveActions(liveActionContext);
  const navigation = useQuestDetailNavigation({
    quest: read.quest,
    viewerId,
    messages,
    canMessageOwner: Boolean(
      route.mode !== "post" && read.projection?.capabilities.canMessageOwner
    ),
    createCandidateInquiry: liveActions.createCandidateInquiry,
    studentId: explicitStudentId,
  });
  const facts = getQuestDetailPresentationFacts({
    read,
    route,
    locale,
    messages,
    groupMessages,
    viewerId,
    surface: surface.state,
    tagCatalog,
    colors,
  });

  const refresh = read.refresh;
  const onRefresh = useCallback(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);
  const onRetry = onRefresh;

  const participation = useQuestDetailParticipation({
    facts,
    liveActions,
    navigation,
    transitions: surface.transitions,
  });
  const candidate = useQuestDetailCandidateActions({
    facts,
    liveActions,
    navigation,
    transitions: surface.transitions,
  });
  const team = useQuestDetailTeamActions({ liveActions });

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
        liveUnderfilledDecision: team.liveUnderfilledDecision,
        liveUnderfilledConsent: team.liveUnderfilledConsent,
        liveCreateTeam: team.liveCreateTeam,
        liveJoinTeam: team.liveJoinTeam,
        liveLeaveTeam: team.liveLeaveTeam,
        liveRemoveTeamMember: team.liveRemoveTeamMember,
        liveRegenerateTeamCode: team.liveRegenerateTeamCode,
        liveUpdateTeamName: team.liveUpdateTeamName,
        liveSubmitTeam: team.liveSubmitTeam,
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
    team: presentationContext
      ? buildQuestDetailTeamProps(presentationContext)
      : undefined,
    partialStartConsent: presentationContext
      ? buildQuestDetailPartialStartProps(presentationContext)
      : { surfaceState: "empty" },
    onRetry,
    actionBar: presentationContext
      ? buildQuestDetailActionBar(presentationContext)
      : null,
  };
}
