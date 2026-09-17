import { useCallback, useEffect, useRef, useState } from "react";

/** The default keeps focus changes from repeatedly reloading a screen. */
export const DEFAULT_CALM_REFRESH_STALE_INTERVAL_MS = 30_000;

export interface CalmRefreshConfig {
  /** How long a successful refresh remains fresh, in milliseconds. */
  staleIntervalMs?: number;
}

export interface CalmRefreshResult<T> {
  /** True while the current loader request is in flight. */
  refreshing: boolean;
  /**
   * Refresh the screen. Pass true for an explicit pull-to-refresh; the default
   * skips a request while the last successful refresh is still fresh.
   */
  refresh: (force?: boolean) => Promise<T | undefined>;
  /**
   * Invoke from a screen's useFocusEffect. Focus refreshes are stale-checked
   * and loader errors are swallowed because focus effects have no error
   * consumer; call refresh() directly when the screen needs error details.
   */
  refreshOnFocus: () => void;
}

function normalizeStaleInterval(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_CALM_REFRESH_STALE_INTERVAL_MS;
  }

  return Math.max(0, value);
}

/**
 * Coordinates calm, stale-checked refreshes for a focused screen.
 *
 * The in-flight promise is shared by every caller: at most one loader request
 * may exist at a time, including when an explicit force refresh races focus.
 * This request-throttling invariant prevents navigation/focus churn and
 * pull-to-refresh gestures from flooding the API.
 */
export function useCalmRefresh<T>(
  loader: () => Promise<T>,
  config: CalmRefreshConfig = {}
): CalmRefreshResult<T> {
  const loaderRef = useRef(loader);
  const staleIntervalRef = useRef(
    normalizeStaleInterval(config.staleIntervalMs)
  );
  const inFlightRef = useRef<Promise<T | undefined> | null>(null);
  const lastSuccessfulRefreshAtRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [refreshing, setRefreshing] = useState(false);

  // Effects keep these refs current without mutating them during render.
  useEffect(() => {
    loaderRef.current = loader;
    staleIntervalRef.current = normalizeStaleInterval(config.staleIntervalMs);
  }, [config.staleIntervalMs, loader]);

  // Keep the callbacks stable while still using the latest screen loader and
  // interval when a screen's props or state change.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      // The loader itself cannot be cancelled generically, but its completion
      // must never update state after this hook's screen has unmounted.
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback((force = false): Promise<T | undefined> => {
    const inFlight = inFlightRef.current;
    if (inFlight) {
      return inFlight;
    }

    const lastSuccessfulRefreshAt = lastSuccessfulRefreshAtRef.current;
    const isFresh =
      lastSuccessfulRefreshAt !== null &&
      Date.now() - lastSuccessfulRefreshAt < staleIntervalRef.current;

    if (!force && isFresh) {
      return Promise.resolve(undefined);
    }

    if (mountedRef.current) {
      setRefreshing(true);
    }

    const request = (async (): Promise<T> => {
      try {
        const result = await loaderRef.current();
        lastSuccessfulRefreshAtRef.current = Date.now();
        return result;
      } finally {
        inFlightRef.current = null;
        if (mountedRef.current) {
          setRefreshing(false);
        }
      }
    })();

    inFlightRef.current = request;
    return request;
  }, []);

  const refreshOnFocus = useCallback((): void => {
    // Focus callbacks should not become an unhandled-rejection source. A
    // screen that needs error details can call refresh() directly instead.
    void refresh(false).catch(() => undefined);
  }, [refresh]);

  return { refreshing, refresh, refreshOnFocus };
}
