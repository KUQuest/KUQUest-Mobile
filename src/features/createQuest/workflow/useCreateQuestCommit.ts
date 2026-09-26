import { useCallback } from "react";

import type { QuestPublishCheck } from "../../questBoard/domain/types";
import type { QuestDraft } from "../domain/createQuestModel";
import type { CompletionState, SaveErrorIntent } from "../createQuestTypes";

type SaveDraft = (
  draft: QuestDraft,
  state?: CompletionState,
  completesFlow?: boolean
) => Promise<boolean>;

type PublishQuest = (draft: QuestDraft) => Promise<boolean>;

export function useCreateQuestCommit({
  draft,
  onCompleted,
  publishCheck,
  publishQuest,
  saveDraft,
  saveErrorIntent,
}: {
  draft: QuestDraft;
  onCompleted: (state: CompletionState) => void;
  publishCheck: QuestPublishCheck;
  publishQuest: PublishQuest;
  saveDraft: SaveDraft;
  saveErrorIntent: SaveErrorIntent | null;
}) {
  const finish = useCallback(
    async (state: CompletionState): Promise<boolean> => {
      if (state === "OPEN") {
        if (!publishCheck.canPublish) return false;
        const published = await publishQuest(draft);
        if (published) onCompleted("OPEN");
        return published;
      }

      const saved = await saveDraft(draft, "DRAFT", true);
      if (saved) onCompleted("DRAFT");
      return saved;
    },
    [draft, onCompleted, publishCheck.canPublish, publishQuest, saveDraft]
  );

  const retry = useCallback(async (): Promise<boolean> => {
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
  }, [draft, onCompleted, publishQuest, saveDraft, saveErrorIntent]);

  return { finish, retry };
}
