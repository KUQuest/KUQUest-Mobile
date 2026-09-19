import * as SecureStore from "expo-secure-store";

/**
 * Persistence boundary. Feature code must go through an adapter instead of
 * calling a storage SDK directly, so the backing store can be chosen per
 * value class (sensitive vs ordinary) in one place.
 */
export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Encrypted device storage. Errors propagate: callers decide whether a
 * storage failure is fatal or ignorable.
 */
export const secureStorage: KeyValueStorage = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};
