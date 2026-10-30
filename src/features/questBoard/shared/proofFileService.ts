import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking } from "react-native";

import { serverNow } from "@/api/serverClock";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { fetchProofFileLink } from "@/features/questBoard/api/questBoardQueries";

import {
  isExpiredProofFileLinkError,
  proofFileDownloadName,
  proofFileMimeType,
  proofFileUti,
} from "./proofFileUtils";

export type ProofFileAccessTarget = {
  questId: string;
  proofSubmissionId: string;
  file: QuestV2ProofSubmission["files"][number];
};

export type UsableProofFileLink = {
  url: string;
  urlExpiresAt: string;
};

export class ProofFileAccessError extends Error {
  constructor(readonly reason: "unavailable" | "sharing-unavailable") {
    super(
      reason === "unavailable"
        ? "No current authorized Proof file link is available"
        : "File sharing is unavailable on this device"
    );
    this.name = "ProofFileAccessError";
  }
}

export function isUsableProofFileLink(
  link: Pick<QuestV2ProofSubmission["files"][number], "url" | "urlExpiresAt">
): link is UsableProofFileLink {
  if (!link.url || !link.urlExpiresAt) return false;
  const expiresAt = Date.parse(link.urlExpiresAt);
  return Number.isFinite(expiresAt) && expiresAt > serverNow();
}

async function fetchFreshProofFileLink(
  target: ProofFileAccessTarget
): Promise<UsableProofFileLink> {
  const { file } = target;
  if (!file.fileId) throw new ProofFileAccessError("unavailable");

  try {
    const link = await fetchProofFileLink(
      target.questId,
      target.proofSubmissionId,
      file.fileId
    );
    if (!isUsableProofFileLink(link)) {
      throw new ProofFileAccessError("unavailable");
    }
    return { url: link.url, urlExpiresAt: link.urlExpiresAt };
  } catch (error) {
    if (error instanceof ProofFileAccessError) throw error;
    if (isExpiredProofFileLinkError(error)) {
      throw new ProofFileAccessError("unavailable");
    }
    throw error;
  }
}

/** Resolve an expiring authorized link; a missing expiry is never trusted. */
export async function getProofFileLinkForUse(
  target: ProofFileAccessTarget,
  currentLink?: Pick<
    QuestV2ProofSubmission["files"][number],
    "url" | "urlExpiresAt"
  >
): Promise<UsableProofFileLink> {
  const candidate = currentLink ?? target.file;
  if (isUsableProofFileLink(candidate)) return candidate;
  return fetchFreshProofFileLink(target);
}

/** Open a non-image Proof file with its native handler after resolving its link. */
export async function openProofFile(
  target: ProofFileAccessTarget,
  currentLink?: Pick<
    QuestV2ProofSubmission["files"][number],
    "url" | "urlExpiresAt"
  >
): Promise<UsableProofFileLink> {
  const link = await getProofFileLinkForUse(target, currentLink);
  await Linking.openURL(link.url);
  return link;
}

/** Download one submitted Proof file and hand the native local copy to Share. */
export async function downloadAndShareProofFile(
  target: ProofFileAccessTarget,
  currentLink?: Pick<
    QuestV2ProofSubmission["files"][number],
    "url" | "urlExpiresAt"
  >
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new ProofFileAccessError("sharing-unavailable");
  }

  const { file } = target;
  if (!file.fileId) throw new ProofFileAccessError("unavailable");
  const mimeType = proofFileMimeType(file.contentType);
  const destination = new File(
    Paths.cache,
    proofFileDownloadName(file.fileId, file.position, mimeType)
  );

  try {
    let link = await getProofFileLinkForUse(target, currentLink);
    let downloaded;
    try {
      downloaded = await File.downloadFileAsync(link.url, destination, {
        idempotent: true,
      });
    } catch (error) {
      if (!isExpiredProofFileLinkError(error)) throw error;
      link = await fetchFreshProofFileLink(target);
      downloaded = await File.downloadFileAsync(link.url, destination, {
        idempotent: true,
      });
    }

    await Sharing.shareAsync(downloaded.uri, {
      mimeType,
      UTI: proofFileUti(mimeType),
    });
  } catch (error) {
    if (error instanceof ProofFileAccessError) throw error;
    if (isExpiredProofFileLinkError(error)) {
      throw new ProofFileAccessError("unavailable");
    }
    throw error;
  }
}
