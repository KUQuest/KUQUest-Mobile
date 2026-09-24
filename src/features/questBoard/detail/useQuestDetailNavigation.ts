import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { BackHandler } from "react-native";

import { showErrorAlert } from "@/components/ui/SweetAlert";

import { getChatRouteParams } from "@/features/chat/chatData";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type { QuestBoardQuest } from "../domain/types";
import type { BoardPreviewState } from "../fixtures/questBoardHarness";
import type { QuestDetailProjection } from "./questDetailProjection";
import type { QuestDetailReadSource } from "./useQuestDetailReadSource";

interface QuestDetailNavigationParams {
  quest: QuestBoardQuest | null;
  projection: QuestDetailProjection | null;
  source: QuestDetailReadSource;
  viewerId: string;
  messages: QuestBoardMessages;
  canMessageOwner: boolean;
  createCandidateInquiry: (questId: string) => Promise<{ id: string }>;
  /** Carried to the Quest Team route so it reads the same source and viewer. */
  previewState?: BoardPreviewState;
  studentId?: string;
}

export interface QuestDetailNavigation {
  handleBack: () => void;
  openParticipantProfile: (participantId: string) => void;
  openWorkHub: () => void;
  openTeam: () => void;
  openEditPost: () => void;
  openReportQuest: () => void;
  openMessageOwner: () => void;
}

export function useQuestDetailNavigation({
  quest,
  projection,
  source,
  viewerId,
  messages,
  canMessageOwner,
  createCandidateInquiry,
  previewState,
  studentId,
}: QuestDetailNavigationParams): QuestDetailNavigation {
  const router = useRouter();
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  }, [router]);

  useFocusEffect(
    useCallback(() => {
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

  const openParticipantProfile = useCallback(
    (participantId: string) => {
      router.push(`/profile/${participantId}`);
    },
    [router]
  );
  const openWorkHub = useCallback(() => {
    router.push("/my-quests");
  }, [router]);
  const openTeam = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/team",
      params: {
        id: quest.id,
        ...(previewState ? { preview: previewState } : {}),
        ...(studentId ? { studentId } : {}),
      },
    });
  }, [previewState, quest, router, studentId]);
  const openEditPost = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/edit",
      params: { id: quest.id },
    });
  }, [quest, router]);
  const openReportQuest = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/report",
      params: {
        source: "quest",
        questId: quest.id,
        questTitle: quest.title,
        viewerId,
        reportedMemberId: quest.ownerStudentId,
      },
    });
  }, [quest, router, viewerId]);
  const openMessageOwner = useCallback(() => {
    if (!quest || !canMessageOwner) return;
    if (source.kind === "preview") {
      const capability = projection?.conversationCapability;
      if (!capability?.conversationId || !capability.canRead) return;
      router.push({
        pathname: "/chat/[id]",
        params: getChatRouteParams({
          conversationId: capability.conversationId,
          questId: quest.id,
          viewerId,
          ownerName: quest.creator.name,
          questTitle: quest.title,
        }),
      });
      return;
    }

    void createCandidateInquiry(quest.id)
      .then((inquiry) => {
        router.push({
          pathname: "/quest/[id]/inquiry/[conversationId]",
          params: {
            id: quest.id,
            conversationId: inquiry.id,
            viewerId,
          },
        });
      })
      .catch((error) => {
        showErrorAlert(
          messages.actionFailedTitle,
          error instanceof Error ? error.message : messages.messageOwnerError
        );
      });
  }, [
    canMessageOwner,
    createCandidateInquiry,
    messages.actionFailedTitle,
    messages.messageOwnerError,
    projection,
    quest,
    router,
    source.kind,
    viewerId,
  ]);

  return {
    handleBack,
    openParticipantProfile,
    openWorkHub,
    openTeam,
    openEditPost,
    openReportQuest,
    openMessageOwner,
  };
}
