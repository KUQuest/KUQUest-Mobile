import { create } from "zustand";

import {
  DEFAULT_PROTOTYPE_PERSONA_ID,
  isPrototypePersonaId,
  type PrototypePersonaId,
} from "@/components/ui/prototypeMenuData";
import { secureStorage } from "@/infrastructure/storage/keyValueStorage";

export const PROTOTYPE_PERSONA_STORAGE_KEY = "kuquest_active_prototype_persona";

interface AuthEnvironmentStoreState {
  offlineDemoEnabled: boolean;
  activePersonaId: PrototypePersonaId;
  storedPersonaLoaded: boolean;
  enableOfflineDemo: () => void;
  resetOfflineDemo: () => void;
  selectPersona: (personaId: PrototypePersonaId) => void;
  hydratePersona: () => Promise<void>;
  reset: () => void;
}

let selectionChanged = false;
let hydratePromise: Promise<void> | undefined;

export async function loadPersistedPersona(): Promise<PrototypePersonaId | null> {
  if (!__DEV__) return null;

  try {
    const storedPersonaId = await secureStorage.get(
      PROTOTYPE_PERSONA_STORAGE_KEY
    );
    return isPrototypePersonaId(storedPersonaId) ? storedPersonaId : null;
  } catch {
    return null;
  }
}

export async function persistActivePersona(
  personaId: PrototypePersonaId
): Promise<boolean> {
  if (!__DEV__ || !isPrototypePersonaId(personaId)) return false;

  try {
    await secureStorage.set(PROTOTYPE_PERSONA_STORAGE_KEY, personaId);
    return true;
  } catch {
    return false;
  }
}

export async function deletePersistedPersona(): Promise<boolean> {
  if (!__DEV__) return false;

  try {
    await secureStorage.remove(PROTOTYPE_PERSONA_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export const useAuthEnvironmentStore = create<AuthEnvironmentStoreState>(
  (set, get) => ({
    offlineDemoEnabled: false,
    activePersonaId: DEFAULT_PROTOTYPE_PERSONA_ID,
    storedPersonaLoaded: false,
    enableOfflineDemo: () => {
      if (__DEV__) set({ offlineDemoEnabled: true });
    },
    resetOfflineDemo: () => {
      set({ offlineDemoEnabled: false });
    },
    selectPersona: (personaId) => {
      if (!__DEV__ || !isPrototypePersonaId(personaId)) return;

      selectionChanged = true;
      if (get().activePersonaId !== personaId) {
        set({ activePersonaId: personaId });
      }
      void persistActivePersona(personaId);
    },
    hydratePersona: () => {
      if (!__DEV__ || get().storedPersonaLoaded) return Promise.resolve();
      if (hydratePromise) return hydratePromise;

      hydratePromise = loadPersistedPersona()
        .then((storedPersonaId) => {
          if (storedPersonaId && !selectionChanged) {
            set({ activePersonaId: storedPersonaId });
          }
        })
        .catch(() => undefined)
        .finally(() => {
          set({ storedPersonaLoaded: true });
          hydratePromise = undefined;
        });

      return hydratePromise;
    },
    reset: () => {
      selectionChanged = false;
      hydratePromise = undefined;
      set({
        offlineDemoEnabled: false,
        activePersonaId: DEFAULT_PROTOTYPE_PERSONA_ID,
        storedPersonaLoaded: false,
      });
    },
  })
);
