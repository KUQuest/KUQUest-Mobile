import { Alert } from "react-native";

import { createQuestIdempotencyKey } from "@/api/QuestApi";
import type { QuestV2Application, QuestV2Team } from "@/api/questV2Contracts";
import {
  useRejectApplicationMutation,
  useRejectCandidateTeamMutation,
  useSelectApplicationMutation,
  useSelectCandidateTeamMutation,
} from "@/features/questBoard/api/questBoardQueries";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";

export interface SelectRosterActions {
  selectApplication: (application: QuestV2Application) => void;
  rejectApplication: (application: QuestV2Application) => void;
  selectTeam: (team: QuestV2Team) => void;
  rejectTeam: (team: QuestV2Team) => void;
}

export function useSelectRosterActions({
  questId,
  viewerId,
  messages,
  groupMessages,
  onSelectSuccess,
  refetchSnapshot,
}: {
  questId?: string;
  viewerId: string;
  messages: QuestBoardMessages;
  groupMessages: GroupQuestMessages;
  onSelectSuccess: () => void;
  refetchSnapshot: () => Promise<unknown>;
}): SelectRosterActions {
  const selectApplicationMutation = useSelectApplicationMutation();
  const rejectApplicationMutation = useRejectApplicationMutation();
  const selectCandidateTeamMutation = useSelectCandidateTeamMutation();
  const rejectCandidateTeamMutation = useRejectCandidateTeamMutation();

  async function performSelect(run: (key: string) => Promise<unknown>) {
    try {
      await run(createQuestIdempotencyKey());
      onSelectSuccess();
    } catch (caught) {
      Alert.alert(
        messages.actionFailedTitle,
        caught instanceof Error ? caught.message : messages.actionFailedTitle
      );
    }
  }

  async function performReject(run: (key: string) => Promise<unknown>) {
    try {
      await run(createQuestIdempotencyKey());
    } catch (caught) {
      Alert.alert(
        messages.actionFailedTitle,
        caught instanceof Error ? caught.message : messages.actionFailedTitle
      );
      await refetchSnapshot();
    }
  }

  function selectApplication(application: QuestV2Application) {
    if (!questId) return;
    Alert.alert(
      messages.confirmSelectCandidateTitle,
      messages.confirmSelectCandidateMessage,
      [
        { text: groupMessages.cancel, style: "cancel" },
        {
          text: groupMessages.selectProposal,
          onPress: () =>
            void performSelect((key) =>
              selectApplicationMutation.mutateAsync({
                questId,
                applicationId: application.id,
                viewerId,
                idempotencyKey: key,
              })
            ),
        },
      ]
    );
  }

  function rejectApplication(application: QuestV2Application) {
    if (!questId) return;
    Alert.alert(
      messages.confirmRejectCandidateTitle,
      messages.confirmRejectMessage,
      [
        { text: groupMessages.cancel, style: "cancel" },
        {
          text: groupMessages.reject,
          style: "destructive",
          onPress: () =>
            void performReject((key) =>
              rejectApplicationMutation.mutateAsync({
                questId,
                applicationId: application.id,
                viewerId,
                idempotencyKey: key,
              })
            ),
        },
      ]
    );
  }

  function selectTeam(team: QuestV2Team) {
    if (!questId) return;
    Alert.alert(
      messages.confirmSelectTeamTitle,
      messages.confirmSelectTeamMessage,
      [
        { text: groupMessages.cancel, style: "cancel" },
        {
          text: groupMessages.selectProposal,
          onPress: () =>
            void performSelect((key) =>
              selectCandidateTeamMutation.mutateAsync({
                questId,
                teamId: team.id,
                viewerId,
                idempotencyKey: key,
              })
            ),
        },
      ]
    );
  }

  function rejectTeam(team: QuestV2Team) {
    if (!questId) return;
    Alert.alert(
      messages.confirmRejectTeamTitle,
      messages.confirmRejectMessage,
      [
        { text: groupMessages.cancel, style: "cancel" },
        {
          text: groupMessages.reject,
          style: "destructive",
          onPress: () =>
            void performReject((key) =>
              rejectCandidateTeamMutation.mutateAsync({
                questId,
                teamId: team.id,
                viewerId,
                idempotencyKey: key,
              })
            ),
        },
      ]
    );
  }

  return { selectApplication, rejectApplication, selectTeam, rejectTeam };
}
