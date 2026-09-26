/**
 * Development-build diagnostics printed to the Metro console as
 * `[scope] message`. Silent in release builds and under Jest.
 * Never pass cookies, auth headers, request bodies, or signed URL queries.
 */
export function debugLog(
  scope: string,
  message: string,
  details?: Record<string, unknown>
): void {
  if (!__DEV__ || process.env.NODE_ENV === "test") return;
  console.log(`[${scope}] ${message}`, details ?? "");
}

/** Loggable summary of a thrown value: ApiError status/code and Zod issue paths. */
export function errorDetails(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { error: String(error) };
  if ("issues" in error && Array.isArray(error.issues)) {
    // ZodError.message repeats the issues as JSON; keep the compact list only.
    return {
      name: error.name,
      issues: error.issues.map(
        (issue: { path?: unknown; message?: unknown }) => ({
          path: issue.path,
          message: issue.message,
        })
      ),
    };
  }
  return {
    name: error.name,
    message: error.message,
    status: "status" in error ? error.status : undefined,
    code: "code" in error ? error.code : undefined,
  };
}
