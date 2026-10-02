import * as Linking from "expo-linking";

import { questWorkflow } from "@/features/questBoard/workflow/questWorkflow";
import {
  type PrototypePersonaId,
  type PrototypeResetScope,
  type PrototypeScenarioRoute,
  isPrototypeScenarioRoute,
} from "@/components/ui/prototypeMenuData";
import {
  deletePersistedPersona,
  loadPersistedPersona,
  persistActivePersona,
  useAuthEnvironmentStore,
} from "./authEnvironmentStore";

function normalizeSegment(value: string | null | undefined): string {
  return value?.replace(/^\/+|\/+$/g, "") ?? "";
}

function isDemoEnabled(): boolean {
  return (
    __DEV__ &&
    (process.env.EXPO_PUBLIC_PROFILE_DEMO === "true" ||
      useAuthEnvironmentStore.getState().offlineDemoEnabled)
  );
}

function resetFixtures(_scope: PrototypeResetScope = "all"): void {
  if (!__DEV__) return;
  questWorkflow.reset();
}

function parseDeepLink(
  url: string | null | undefined
): PrototypeScenarioRoute | undefined {
  if (!url?.trim()) return undefined;

  try {
    const parsed = new URL(url);
    const route = [
      normalizeSegment(parsed.hostname),
      normalizeSegment(parsed.pathname),
    ]
      .filter(Boolean)
      .join("/");
    const routePath = route ? `/${decodeURIComponent(route)}` : undefined;
    if (routePath && isPrototypeScenarioRoute(routePath)) return routePath;

    // Expo Development Client may wrap a launch URL in its `url` query parameter.
    if (parsed.hostname === "expo-development-client") {
      return parseDeepLink(parsed.searchParams.get("url"));
    }
  } catch {
    // Malformed external URL
  }

  return undefined;
}

async function getInitialDeepLink(): Promise<
  PrototypeScenarioRoute | undefined
> {
  if (!__DEV__) return undefined;

  try {
    const linkingUrl = Linking.getLinkingURL();
    const routeFromLinkingUrl = parseDeepLink(linkingUrl);
    if (routeFromLinkingUrl) return routeFromLinkingUrl;
  } catch {
    // Fall through to Linking.getInitialURL()
  }

  try {
    return parseDeepLink(await Linking.getInitialURL());
  } catch {
    return undefined;
  }
}

function subscribeDeepLinks(
  onRoute: (route: PrototypeScenarioRoute) => void
): () => void {
  if (!__DEV__) return () => undefined;

  try {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const route = parseDeepLink(url);
      if (route) onRoute(route);
    });
    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
}

export const authEnvironment = {
  isDemoEnabled,
  enableOfflineDemo: () => {
    useAuthEnvironmentStore.getState().enableOfflineDemo();
  },
  resetOfflineDemo: () => {
    useAuthEnvironmentStore.getState().resetOfflineDemo();
  },
  getActivePersonaId: () => useAuthEnvironmentStore.getState().activePersonaId,
  setActivePersona: (personaId: PrototypePersonaId) => {
    useAuthEnvironmentStore.getState().selectPersona(personaId);
  },
  resetFixtures,
  hydratePersona: () => useAuthEnvironmentStore.getState().hydratePersona(),
  loadPersistedPersona,
  persistActivePersona,
  deletePersistedPersona,
  parseDeepLink,
  getInitialDeepLink,
  subscribeDeepLinks,
  reset: () => {
    useAuthEnvironmentStore.getState().reset();
  },
};

export const isPrototypeDemoEnabled = (): boolean => isDemoEnabled();
