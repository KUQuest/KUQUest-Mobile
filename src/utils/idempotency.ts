function hasRandomUUID(
  target: unknown
): target is { randomUUID: () => string } {
  return (
    typeof target === "object" &&
    target !== null &&
    "randomUUID" in target &&
    typeof target.randomUUID === "function"
  );
}

/**
 * Creates a unique idempotency key for API mutations using standard crypto UUID
 * with fallback for non-crypto environments.
 */
export function createIdempotencyKey(prefix = "mobile"): string {
  const globalCrypto = "crypto" in globalThis ? globalThis.crypto : undefined;
  if (hasRandomUUID(globalCrypto)) {
    return `${prefix}-${globalCrypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
