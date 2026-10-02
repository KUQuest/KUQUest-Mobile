import type { Href, ImperativeRouter } from "expo-router";

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

/**
 * Goes back when history exists; otherwise replaces with `fallback`.
 * Deep-linked screens have no history to pop.
 */
export function goBackOrReplace(
  router: Pick<ImperativeRouter, "canGoBack" | "back" | "replace">,
  fallback: Href
): void {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
