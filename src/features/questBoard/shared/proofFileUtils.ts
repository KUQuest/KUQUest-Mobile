export function formatProofFileSize(sizeBytes: number | null): string {
  if (sizeBytes === null) return "";
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function proofFileMimeType(contentType: string | null): string {
  return contentType?.split(";")[0]?.trim() || "application/octet-stream";
}

export function proofFileUti(mimeType: string): string {
  return (
    {
      "application/pdf": "com.adobe.pdf",
      "image/gif": "com.compuserve.gif",
      "image/jpeg": "public.jpeg",
      "image/png": "public.png",
      "image/heic": "public.heic",
      "video/mp4": "public.mpeg-4",
      "video/quicktime": "com.apple.quicktime-movie",
    }[mimeType] ?? "public.data"
  );
}

export function proofFileDownloadName(
  fileId: string | null,
  position: number,
  mimeType: string
): string {
  const rawExtension = mimeType.split("/")[1]?.replace("jpeg", "jpg");
  const extension =
    rawExtension && /^[a-z0-9.+-]+$/i.test(rawExtension) ? rawExtension : "bin";
  const safeFileId = fileId?.replace(/[^a-z0-9_-]/gi, "_") ?? `${position + 1}`;
  return `proof-${safeFileId}.${extension}`;
}

export function isExpiredProofFileLinkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as {
    status?: unknown;
    statusCode?: unknown;
    message?: unknown;
  };
  if (
    value.status === 403 ||
    value.status === 404 ||
    value.statusCode === 403 ||
    value.statusCode === 404
  ) {
    return true;
  }
  return (
    typeof value.message === "string" && /\b(?:403|404)\b/.test(value.message)
  );
}
