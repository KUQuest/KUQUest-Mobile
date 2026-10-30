import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { BackHandler } from "react-native";

import { showErrorAlert } from "@/components/ui/SweetAlert";
import { useLocale } from "@/features/preferences/localeStore";
import { ApiError } from "@/api/ApiClient";
import { getLocalizedErrorMessage } from "@/utils/error";

import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import { chatMessages } from "@/locales/chatMessages";
import type { QuestBoardQuest } from "../domain/types";

interface QuestDetailNavigationParams {
  quest: QuestBoardQuest | null;
  viewerId: string;
  messages: QuestBoardMessages;
  canMessageOwner: boolean;
  createCandidateInquiry: (questId: string) => Promise<{ id: string }>;
  /** Carried to the Quest Team route so it reads the same viewer. */
  studentId?: string;
}

export interface QuestDetailNavigation {
  handleBack: () => void;
  openParticipantProfile: (participantId: string) => void;
  openWorkHub: () => void;
  openManage: () => void;
  openProofReview: () => void;
  openTeam: () => void;
  openPartialStart: () => void;
  openEditPost: () => void;
  openMessageOwner: () => void;
}

export function useQuestDetailNavigation({
  quest,
  viewerId,
  messages,
  canMessageOwner,
  createCandidateInquiry,
  studentId,
}: QuestDetailNavigationParams): QuestDetailNavigation {
  const router = useRouter();
  const { locale } = useLocale();
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
    if (!quest || !viewerId) return;
    router.push({
      pathname: "/quest/[id]/work",
      params: { id: quest.id, viewerId },
    });
  }, [quest, router, viewerId]);
  const openManage = useCallback(() => {
    if (!quest) return;
    router.replace({
      pathname: "/quest/[id]/manage",
      params: { id: quest.id },
    });
  }, [quest, router]);
  const openProofReview = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/proof-review",
      params: { id: quest.id },
    });
  }, [quest, router]);
  const openTeam = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/team",
      params: {
        id: quest.id,
        ...(studentId ? { studentId } : {}),
      },
    });
  }, [quest, router, studentId]);
  const openPartialStart = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/partial-start",
      params: {
        id: quest.id,
        ...(studentId ? { studentId } : {}),
      },
    });
  }, [quest, router, studentId]);
  const openEditPost = useCallback(() => {
    if (!quest) return;
    router.push({
      pathname: "/quest/[id]/edit",
      params: { id: quest.id },
    });
  }, [quest, router]);
  const openMessageOwner = useCallback(() => {
    if (!quest || !canMessageOwner) return;
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
        const closedInquiry =
          error instanceof ApiError &&
          (error.status === 404 || error.status === 409);
        showErrorAlert(
          messages.actionFailedTitle,
          closedInquiry
            ? chatMessages[locale].candidateInquiryClosed
            : getLocalizedErrorMessage(error, locale, {
                fallback: messages.messageOwnerError,
              })
        );
      });
  }, [
    canMessageOwner,
    createCandidateInquiry,
    locale,
    messages.actionFailedTitle,
    messages.messageOwnerError,
    quest,
    router,
    viewerId,
  ]);

  return {
    handleBack,
    openParticipantProfile,
    openWorkHub,
    openManage,
    openProofReview,
    openTeam,
    openPartialStart,
    openEditPost,
    openMessageOwner,
  };
}
