import { useCallback } from "react";

import type { QuestPublishCheck } from "../questBoard/types";
import type { QuestDraft } from "./createQuestModel";
import type { CreateQuestFlowMode } from "./createQuestWorkflow";
import { isServerEditMode } from "./createQuestWorkflow";
import type { CompletionState, SaveErrorIntent } from "./createQuestTypes";

type SaveDraft = (
  draft: QuestDraft,
  state?: CompletionState,
  completesFlow?: boolean
) => Promise<boolean>;

type PublishQuest = (draft: QuestDraft) => Promise<boolean>;

export function useCreateQuestCommit({
  draft,
  mode,
  onClearPendingSave,
  onCompleted,
  publishCheck,
  publishQuest,
  saveDraft,
  saveErrorIntent,
}: {
  draft: QuestDraft;
  mode: CreateQuestFlowMode;
  onClearPendingSave: () => void;
  onCompleted: (state: CompletionState) => void;
  publishCheck: QuestPublishCheck;
  publishQuest: PublishQuest;
  saveDraft: SaveDraft;
  saveErrorIntent: SaveErrorIntent | null;
}) {
  const finish = useCallback(
    async (state: CompletionState): Promise<boolean> => {
      if (
        !isServerEditMode(mode) &&
        state === "OPEN" &&
        !publishCheck.canPublish
      )
        return false;

      onClearPendingSave();
      if (!isServerEditMode(mode) && state === "OPEN") {
        const published = await publishQuest(draft);
        if (published) onCompleted("OPEN");
        return published;
      }

      const saved = await saveDraft(draft, "DRAFT", true);
      if (saved) onCompleted("DRAFT");
      return saved;
    },
    [
      draft,
      mode,
      onClearPendingSave,
      onCompleted,
      publishCheck.canPublish,
      publishQuest,
      saveDraft,
    ]
  );

  const retry = useCallback(() => {
    if (isServerEditMode(mode)) {
      void saveDraft(draft, "DRAFT", true).then((saved) => {
        if (saved) onCompleted("DRAFT");
      });
      return;
    }

    const intent = saveErrorIntent;
    if (intent?.state === "OPEN") {
      void publishQuest(draft).then((published) => {
        if (published && intent.completesFlow) onCompleted("OPEN");
      });
      return;
    }

    void saveDraft(draft, "DRAFT", intent?.completesFlow ?? false).then(
      (saved) => {
        if (saved && intent?.completesFlow) onCompleted("DRAFT");
      }
    );
  }, [draft, mode, onCompleted, publishQuest, saveDraft, saveErrorIntent]);

  return { finish, retry };
}
