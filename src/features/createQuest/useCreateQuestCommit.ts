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

  onCompleted,
  publishCheck,
  publishQuest,
  saveDraft,
  saveErrorIntent,
}: {
  draft: QuestDraft;
  mode: CreateQuestFlowMode;

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

      if (!isServerEditMode(mode) && state === "OPEN") {
        const published = await publishQuest(draft);
        if (published) onCompleted("OPEN");
        return published;
      }

      const saved = await saveDraft(draft, "DRAFT", true);
      if (saved) onCompleted("DRAFT");
      return saved;
    },
    [draft, mode, onCompleted, publishCheck.canPublish, publishQuest, saveDraft]
  );

  const retry = useCallback(async (): Promise<boolean> => {
    if (isServerEditMode(mode)) {
      const saved = await saveDraft(draft, "DRAFT", true);
      if (saved) onCompleted("DRAFT");
      return saved;
    }

    const intent = saveErrorIntent;
    if (intent?.state === "OPEN") {
      const published = await publishQuest(draft);
      if (published && intent.completesFlow) onCompleted("OPEN");
      return published;
    }

    const saved = await saveDraft(
      draft,
      "DRAFT",
      intent?.completesFlow ?? false
    );
    if (saved && intent?.completesFlow) onCompleted("DRAFT");
    return saved;
  }, [draft, mode, onCompleted, publishQuest, saveDraft, saveErrorIntent]);

  return { finish, retry };
}
