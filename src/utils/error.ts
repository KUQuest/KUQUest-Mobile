import { ApiError } from "@/api/ApiClient";
import { alertMessages } from "@/locales/alertMessages";
import type { SupportedLocale } from "@/locales/locale";

const IMAGE_DIMENSION_ERROR_CODES = new Set([
  "AVATAR_DIMENSIONS_TOO_LARGE",
  "CERTIFICATE_IMAGE_DIMENSIONS_TOO_LARGE",
  "IMAGE_DIMENSIONS_TOO_LARGE",
  "PROOF_FILE_DIMENSIONS_TOO_LARGE",
  "TEAM_FILE_DIMENSIONS_TOO_LARGE",
  "ATTACHMENT_DIMENSIONS_TOO_LARGE",
]);

/**
 * Localized, plain-language copy for a failed request. Never returns raw
 * server, Zod, or exception text. Precedence: `codes[ApiError.code]`, then
 * the transport/auth status class (401, 403, 404, 429, 5xx), then `fallback`,
 * then the generic alert fallback. Business-rule rejections (400, 409, 422)
 * have no generic meaning, so they use the feature's `fallback`.
 */
export function getLocalizedErrorMessage(
  error: unknown,
  locale: SupportedLocale,
  options: {
    codes?: Partial<Record<string, string>>;
    fallback?: string;
  } = {}
): string {
  const messages = alertMessages[locale];
  const fallback = options.fallback || messages.errorFallback;
  if (error instanceof TypeError) return messages.networkError;
  if (!(error instanceof ApiError)) return fallback;
  const byCode = options.codes?.[error.code];
  if (byCode) return byCode;
  if (IMAGE_DIMENSION_ERROR_CODES.has(error.code)) {
    return messages.imageDimensionsTooLarge;
  }
  if (error.code === "PROOF_FILES_UPLOAD_FAILED") {
    return messages.proofFilesUploadFailed;
  }
  if (error.code === "PROOF_RETRY_POSITION_INVALID") {
    return messages.proofRetryPositionInvalid;
  }
  if (error.code === "PROOF_RETRY_POSITION_CONFLICT") {
    return messages.proofRetryPositionConflict;
  }
  if (error.status === 401) return messages.sessionExpired;
  if (error.status === 403) return messages.forbidden;
  if (error.status === 404) return messages.notFound;
  if (error.status === 429) return messages.rateLimited;
  if (error.status >= 500) return messages.serverError;
  return fallback;
}
