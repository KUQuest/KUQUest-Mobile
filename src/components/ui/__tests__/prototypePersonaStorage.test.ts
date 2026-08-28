import * as SecureStore from 'expo-secure-store';

import {
  deleteActivePrototypePersona,
  loadActivePrototypePersona,
  persistActivePrototypePersona,
  PROTOTYPE_PERSONA_STORAGE_KEY,
} from '../prototypePersonaStorage';

describe('prototype persona storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists only the selected persona ID in SecureStore', async () => {
    await expect(persistActivePrototypePersona('demo-worker-2')).resolves.toBe(true);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      PROTOTYPE_PERSONA_STORAGE_KEY,
      'demo-worker-2',
    );
  });

  it('loads a valid persona and ignores unknown stored values', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('demo-worker-3');
    await expect(loadActivePrototypePersona()).resolves.toBe('demo-worker-3');

    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('not-a-persona');
    await expect(loadActivePrototypePersona()).resolves.toBeNull();
  });

  it('handles SecureStore failures without exposing invalid state', async () => {
    jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('unavailable'));
    await expect(loadActivePrototypePersona()).resolves.toBeNull();

    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('unavailable'));
    await expect(persistActivePrototypePersona('demo-hirer')).resolves.toBe(false);

    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('unavailable'));
    await expect(deleteActivePrototypePersona()).resolves.toBe(false);
  });

  it('rejects invalid persona IDs before writing and deletes the active persona safely', async () => {
    await expect(persistActivePrototypePersona('not-a-persona' as never)).resolves.toBe(false);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

    await expect(deleteActivePrototypePersona()).resolves.toBe(true);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(PROTOTYPE_PERSONA_STORAGE_KEY);
  });
});
