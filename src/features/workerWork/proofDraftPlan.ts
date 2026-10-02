import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { QuestProofFileStatus } from "@/features/questBoard/domain/types";

/** An unsent Proof draft plus which local file (by key) sits at each position. */
export interface ProofDraftRef {
  id: string;
  files: Pick<
    QuestV2ProofSubmission["files"][number],
    "position" | "uploadStatus" | "fileId"
  >[];
  /** Local file key per draft position; `null` when unknown (draft from an earlier session). */
  fileKeys: readonly (string | null)[];
}

export type ProofSendPlan<TFile extends { key: string }> =
  | { kind: "create"; replaceDraftId: string | null; files: TFile[] }
  | { kind: "append"; draftId: string; files: TFile[] }
  | { kind: "existing"; draftId: string }
  | {
      kind: "retry";
      draftId: string;
      retries: { position: number; file: TFile }[];
    };

/**
 * Decides how to send the selected files given an existing unsent draft.
 * Failed draft positions are retried one file each (PATCH with
 * `retryPosition`). Unknown ready files stay selected; new files append to
 * that draft. Removing a known file creates a replacement draft.
 */
export function planProofSend<TFile extends { key: string }>(
  draft: ProofDraftRef | null,
  files: readonly TFile[]
): ProofSendPlan<TFile> {
  if (!draft) {
    return { kind: "create", replaceDraftId: null, files: [...files] };
  }
  const replace: ProofSendPlan<TFile> = {
    kind: "create",
    replaceDraftId: draft.id,
    files: [...files],
  };

  const selectedKeys = new Set(files.map((file) => file.key));
  const draftKeys = new Set(draft.fileKeys.filter((key) => key !== null));
  const readyKeys = new Set<string>();
  const failedPositions: number[] = [];
  let hasReadyFile = false;
  let hasUnknownReadyFile = false;
  for (const file of draft.files) {
    const key = draft.fileKeys[file.position] ?? null;
    if (
      file.uploadStatus === QuestProofFileStatus.PROOF_FILE_READY &&
      file.fileId !== null
    ) {
      hasReadyFile = true;
      if (key !== null && !selectedKeys.has(key)) return replace;
      if (key !== null) readyKeys.add(key);
      else hasUnknownReadyFile = true;
    } else {
      failedPositions.push(file.position);
    }
  }

  const unplaced = files.filter((file) => !readyKeys.has(file.key));
  const retries: { position: number; file: TFile }[] = [];
  for (const position of failedPositions.sort((a, b) => a - b)) {
    const key = draft.fileKeys[position] ?? null;
    const index = unplaced.findIndex((file) =>
      key !== null && selectedKeys.has(key)
        ? file.key === key
        : !draftKeys.has(file.key)
    );
    if (index < 0) return replace;
    retries.push({ position, file: unplaced[index] });
    unplaced.splice(index, 1);
  }
  if (unplaced.length > 0) {
    if (failedPositions.length === 0 && hasUnknownReadyFile) {
      return { kind: "append", draftId: draft.id, files: [...unplaced] };
    }
    return replace;
  }
  if (hasReadyFile && failedPositions.length === 0) {
    return { kind: "existing", draftId: draft.id };
  }
  return { kind: "retry", draftId: draft.id, retries };
}
