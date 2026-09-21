/**
 * Safely resolves a single string route parameter from Expo Router params,
 * unwrapping arrays and converting finite numbers to strings.
 */
export function getRouteParam(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (Array.isArray(value) && value.length > 0) return getRouteParam(value[0]);
  return undefined;
}

/**
 * Backwards-compatible alias for `getRouteParam`.
 */
export const routeValue = getRouteParam;
