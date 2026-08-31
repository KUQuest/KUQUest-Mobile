import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

import { questWorkflow } from "@/features/questBoard/questWorkflow";
import {
  DEFAULT_PROTOTYPE_PERSONA_ID,
  isPrototypePersonaId,
  isPrototypeScenarioRoute,
  type PrototypePersonaChangeHandler,
  type PrototypePersonaId,
  type PrototypeResetHandler,
  type PrototypeResetScope,
  type PrototypeScenarioRoute,
} from "@/components/ui/prototypeMenuData";
import { AUTH_STORAGE_PREFIX } from "./authStorage";

export const PROTOTYPE_PERSONA_STORAGE_KEY = `${AUTH_STORAGE_PREFIX}_active_prototype_persona`;

function normalizeSegment(value: string | null | undefined): string {
  return value?.replace(/^\/+|\/+$/g, "") ?? "";
}

export interface AuthEnvironmentState {
  isDemo: boolean;
  activePersonaId: PrototypePersonaId;
  onPersonaChange: PrototypePersonaChangeHandler;
  onReset: PrototypeResetHandler;
  setPersona: PrototypePersonaChangeHandler;
  resetFixtures: PrototypeResetHandler;
}

class AuthEnvironment {
  private offlineDemoEnabled = false;
  private activePersonaId: PrototypePersonaId = DEFAULT_PROTOTYPE_PERSONA_ID;
  private storedPersonaLoaded = false;
  private selectionChanged = false;
  private loadPromise: Promise<void> | undefined;
  private listeners = new Set<() => void>();
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  // --- Demo Mode ---

  isDemoEnabled(): boolean {
    return (
      __DEV__ &&
      (process.env.EXPO_PUBLIC_PROFILE_DEMO === "true" ||
        this.offlineDemoEnabled)
    );
  }

  enableOfflineDemo(): void {
    if (__DEV__) {
      this.offlineDemoEnabled = true;
      this.notify();
    }
  }

  resetOfflineDemo(): void {
    this.offlineDemoEnabled = false;
    this.notify();
  }

  // --- Persona State & Persistence ---

  getActivePersonaId(): PrototypePersonaId {
    return this.activePersonaId;
  }

  setActivePersona(personaId: PrototypePersonaId): void {
    if (!__DEV__ || !isPrototypePersonaId(personaId)) return;

    this.selectionChanged = true;
    if (this.activePersonaId !== personaId) {
      this.activePersonaId = personaId;
      this.notify();
    }
    void this.persistActivePersona(personaId);
  }

  resetFixtures(_scope: PrototypeResetScope = "all"): void {
    if (!__DEV__) return;
    questWorkflow.reset();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    this.loadStoredPersona();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private loadStoredPersona(): void {
    if (!__DEV__ || this.storedPersonaLoaded || this.loadPromise) return;

    this.loadPromise = this.loadPersistedPersona()
      .then((storedPersonaId) => {
        if (storedPersonaId && !this.selectionChanged) {
          this.activePersonaId = storedPersonaId;
          this.notify();
        }
      })
      .catch(() => undefined)
      .finally(() => {
        this.storedPersonaLoaded = true;
        this.loadPromise = undefined;
      });
  }

  async loadPersistedPersona(): Promise<PrototypePersonaId | null> {
    if (!__DEV__) return null;

    try {
      const storedPersonaId = await SecureStore.getItemAsync(
        PROTOTYPE_PERSONA_STORAGE_KEY
      );
      return isPrototypePersonaId(storedPersonaId) ? storedPersonaId : null;
    } catch {
      return null;
    }
  }

  async persistActivePersona(personaId: PrototypePersonaId): Promise<boolean> {
    if (!__DEV__ || !isPrototypePersonaId(personaId)) return false;

    try {
      await SecureStore.setItemAsync(PROTOTYPE_PERSONA_STORAGE_KEY, personaId);
      return true;
    } catch {
      return false;
    }
  }

  async deletePersistedPersona(): Promise<boolean> {
    if (!__DEV__) return false;

    try {
      await SecureStore.deleteItemAsync(PROTOTYPE_PERSONA_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  // --- Deep Link Integration ---

  parseDeepLink(
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
        return this.parseDeepLink(parsed.searchParams.get("url"));
      }
    } catch {
      // Malformed external URL
    }

    return undefined;
  }

  async getInitialDeepLink(): Promise<PrototypeScenarioRoute | undefined> {
    if (!__DEV__) return undefined;

    try {
      const linkingUrl = Linking.getLinkingURL();
      const routeFromLinkingUrl = this.parseDeepLink(linkingUrl);
      if (routeFromLinkingUrl) return routeFromLinkingUrl;
    } catch {
      // Fall through to Linking.getInitialURL()
    }

    try {
      return this.parseDeepLink(await Linking.getInitialURL());
    } catch {
      return undefined;
    }
  }

  subscribeDeepLinks(
    onRoute: (route: PrototypeScenarioRoute) => void
  ): () => void {
    if (!__DEV__) return () => undefined;

    try {
      const subscription = Linking.addEventListener("url", ({ url }) => {
        const route = this.parseDeepLink(url);
        if (route) onRoute(route);
      });
      return () => subscription.remove();
    } catch {
      return () => undefined;
    }
  }

  /** Reset internal state for test runner isolation. */
  reset(): void {
    this.offlineDemoEnabled = false;
    this.activePersonaId = DEFAULT_PROTOTYPE_PERSONA_ID;
    this.storedPersonaLoaded = false;
    this.selectionChanged = false;
    this.loadPromise = undefined;
    this.listeners.clear();
  }
}

export const authEnvironment = new AuthEnvironment();

export const getActivePrototypePersonaId = (): PrototypePersonaId =>
  authEnvironment.getActivePersonaId();
export const setActivePrototypePersona = (
  personaId: PrototypePersonaId
): void => authEnvironment.setActivePersona(personaId);
export const isPrototypeDemoEnabled = (): boolean =>
  authEnvironment.isDemoEnabled();
export const enableOfflinePrototypeDemo = (): void =>
  authEnvironment.enableOfflineDemo();
export const resetOfflinePrototypeDemo = (): void =>
  authEnvironment.resetOfflineDemo();

export function useAuthEnvironment(): AuthEnvironmentState {
  const [activePersonaId, setActivePersonaId] = useState<PrototypePersonaId>(
    () => authEnvironment.getActivePersonaId()
  );
  const [isDemo, setIsDemo] = useState<boolean>(() =>
    authEnvironment.isDemoEnabled()
  );
  useEffect(() => {
    const listener = () => {
      const nextPersona = authEnvironment.getActivePersonaId();
      const nextDemo = authEnvironment.isDemoEnabled();
      setActivePersonaId(nextPersona);
      setIsDemo(nextDemo);
    };
    return authEnvironment.subscribe(listener);
  }, []);
  return {
    isDemo,
    activePersonaId,
    setPersona: (id: PrototypePersonaId) =>
      authEnvironment.setActivePersona(id),
    onPersonaChange: (id: PrototypePersonaId) =>
      authEnvironment.setActivePersona(id),
    resetFixtures: (scope: PrototypeResetScope) =>
      authEnvironment.resetFixtures(scope),
    onReset: (scope: PrototypeResetScope) =>
      authEnvironment.resetFixtures(scope),
  };
}
