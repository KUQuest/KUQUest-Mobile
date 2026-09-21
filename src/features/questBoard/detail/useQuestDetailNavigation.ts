import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, BackHandler } from "react-native";

import { getChatRouteParams } from "@/features/chat/chatData";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import type { QuestBoardQuest } from "../types";
import type { QuestDetailProjection } from "../questDetailProjection";
import type { QuestDetailReadSource } from "./useQuestDetailReadSource";

interface QuestDetailNavigationParams {
  quest: QuestBoardQuest | null;
  projection: QuestDetailProjection | null;
  source: QuestDetailReadSource;
  viewerId: string;
  messages: QuestBoardMessages;
  canMessageOwner: boolean;
  createCandidateInquiry: (questId: string) => Promise<{ id: string }>;
}

export interface QuestDetailNavigation {
  handleBack: () => void;
  openParticipantProfile: (participantId: string) => void;
  openWorkHub: () => void;
  openEditPost: () => void;
  openReview: () => void;
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
  const openEditPost = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/edit",
      params: { id: quest.id },
    });
  }, [quest, router]);
  const openReview = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/review",
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
        Alert.alert(
          messages.details,
          error instanceof Error ? error.message : messages.messageOwnerError
        );
      });
  }, [
    canMessageOwner,
    createCandidateInquiry,
    messages.details,
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
    openEditPost,
    openReview,
    openReportQuest,
    openMessageOwner,
  };
}
