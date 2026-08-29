import * as SecureStore from 'expo-secure-store';

import { AUTH_STORAGE_PREFIX } from '@/features/auth/authStorage';
import {
  isPrototypePersonaId,
  type PrototypePersonaId,
} from './prototypeMenuData';

export const PROTOTYPE_PERSONA_STORAGE_KEY = `${AUTH_STORAGE_PREFIX}_active_prototype_persona`;

/**
 * The menu stores only the selected fixture identity. Scenario state and chat
 * messages remain owned by the in-memory fixture adapter.
 */
export async function loadActivePrototypePersona(): Promise<PrototypePersonaId | null> {
  if (!__DEV__) return null;

  try {
    const storedPersonaId = await SecureStore.getItemAsync(PROTOTYPE_PERSONA_STORAGE_KEY);
    return isPrototypePersonaId(storedPersonaId) ? storedPersonaId : null;
  } catch {
    return null;
  }
}

export async function persistActivePrototypePersona(personaId: PrototypePersonaId): Promise<boolean> {
  if (!__DEV__ || !isPrototypePersonaId(personaId)) return false;

  try {
    await SecureStore.setItemAsync(PROTOTYPE_PERSONA_STORAGE_KEY, personaId);
    return true;
  } catch {
    return false;
  }
}

export async function deleteActivePrototypePersona(): Promise<boolean> {
  if (!__DEV__) return false;

  try {
    await SecureStore.deleteItemAsync(PROTOTYPE_PERSONA_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
