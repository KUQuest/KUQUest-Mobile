import { useEffect, useState } from 'react';

import { questWorkflow } from '@/features/questBoard/questWorkflow';
import {
  DEFAULT_PROTOTYPE_PERSONA_ID,
  isPrototypePersonaId,
  type PrototypePersonaChangeHandler,
  type PrototypePersonaId,
  type PrototypeResetHandler,
} from './prototypeMenuData';
import { loadActivePrototypePersona, persistActivePrototypePersona } from './prototypePersonaStorage';

export interface PrototypeMenuState {
  activePersonaId: PrototypePersonaId;
  onPersonaChange: PrototypePersonaChangeHandler;
  onReset: PrototypeResetHandler;
}

let activePersonaId: PrototypePersonaId = DEFAULT_PROTOTYPE_PERSONA_ID;
let storedPersonaLoaded = false;
let selectionChanged = false;
let loadPromise: Promise<void> | undefined;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function loadStoredPersona(): void {
  if (!__DEV__ || storedPersonaLoaded || loadPromise) return;

  loadPromise = loadActivePrototypePersona()
    .then((storedPersonaId) => {
      if (storedPersonaId && !selectionChanged) {
        activePersonaId = storedPersonaId;
        notify();
      }
    })
    .catch(() => undefined)
    .finally(() => {
      storedPersonaLoaded = true;
      loadPromise = undefined;
    });
}

export function getActivePrototypePersonaId(): PrototypePersonaId {
  return activePersonaId;
}

export function setActivePrototypePersona(personaId: PrototypePersonaId): void {
  if (!__DEV__ || !isPrototypePersonaId(personaId)) return;

  selectionChanged = true;
  if (activePersonaId !== personaId) {
    activePersonaId = personaId;
    notify();
  }
  void persistActivePrototypePersona(personaId);
}

export function resetPrototypeFixtures(_scope: Parameters<PrototypeResetHandler>[0]): void {
  if (!__DEV__) return;
  questWorkflow.reset();
}

export function usePrototypeMenuState(): PrototypeMenuState {
  const [personaId, setPersonaId] = useState<PrototypePersonaId>(activePersonaId);

  useEffect(() => {
    const listener = () => setPersonaId(activePersonaId);
    listeners.add(listener);
    loadStoredPersona();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    activePersonaId: personaId,
    onPersonaChange: setActivePrototypePersona,
    onReset: resetPrototypeFixtures,
  };
}
