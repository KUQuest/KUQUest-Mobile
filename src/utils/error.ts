function hasMessageString(target: unknown): target is { message: string } {
  return (
    typeof target === "object" &&
    target !== null &&
    "message" in target &&
    typeof target.message === "string"
  );
}

/**
 * Extracts a human-readable error message from an unknown error or rejection.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred"
): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  if (hasMessageString(error)) {
    const msg = error.message.trim();
    if (msg.length > 0) return msg;
  }
  return fallback;
}
