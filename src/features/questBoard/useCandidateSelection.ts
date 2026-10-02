import { useCallback, useRef, useState } from "react";

import { showConfirmModal, showErrorAlert } from "@/components/ui/SweetAlert";
import type { GroupQuestMessages } from "@/locales/groupQuestMessages";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";

export type CandidateSelectionKind = "application" | "team";

export interface CandidateSelectionCommand {
  kind: CandidateSelectionKind;
  proposalId: string;
}

export function useCandidateSelection({
  questId,
  messages,
  groupMessages,
  onSelect,
  onSuccess,
  onError,
  onBusyChange,
  isSuccessful,
  flightRef,
}: {
  questId?: string;
  messages: QuestBoardMessages;
  groupMessages: GroupQuestMessages;
  onSelect: (command: CandidateSelectionCommand) => Promise<unknown>;
  onSuccess: () => void;
  onError?: (error: unknown) => void | Promise<void>;
  onBusyChange?: (busy: boolean) => void;
  isSuccessful?: (result: unknown) => boolean;
  flightRef?: { current: boolean };
}) {
  const localFlightRef = useRef(false);
  const inFlightRef = flightRef ?? localFlightRef;
  const [pending, setPending] = useState<CandidateSelectionCommand | null>(
    null
  );

  const confirmSelection = useCallback(
    (command: CandidateSelectionCommand) => {
      if (!questId || inFlightRef.current) return;
      const team = command.kind === "team";
      showConfirmModal({
        title: team
          ? messages.confirmSelectTeamTitle
          : messages.confirmSelectCandidateTitle,
        message: team
          ? messages.confirmSelectTeamMessage
          : messages.confirmSelectCandidateMessage,
        confirmLabel: groupMessages.selectProposal,
        cancelLabel: groupMessages.cancel,
        onConfirm: async () => {
          if (inFlightRef.current) return;
          inFlightRef.current = true;
          setPending(command);
          onBusyChange?.(true);
          try {
            const result = await onSelect(command);
            if (isSuccessful ? isSuccessful(result) : true) onSuccess();
          } catch (error) {
            if (onError) await onError(error);
            else showErrorAlert(messages.actionFailedTitle, error);
          } finally {
            inFlightRef.current = false;
            setPending(null);
            onBusyChange?.(false);
          }
        },
      });
    },
    [
      inFlightRef,
      groupMessages,
      isSuccessful,
      messages,
      onBusyChange,
      onError,
      onSelect,
      onSuccess,
      questId,
    ]
  );

  return { confirmSelection, pending };
}
