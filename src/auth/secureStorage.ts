import * as SecureStore from 'expo-secure-store';
import { AuthSession } from './types';

const SESSION_STORAGE_KEY = 'kuquest_auth_session_token';

// In-memory fallback for unit testing / web environments where native SecureStore is unavailable
const inMemoryStore: Record<string, string> = {};

export class SecureSessionStorage {
  private static async isSecureStoreAvailable(): Promise<boolean> {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }

  static async saveSession(session: AuthSession): Promise<void> {
    const jsonStr = JSON.stringify(session);
    if (await this.isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(SESSION_STORAGE_KEY, jsonStr);
    } else {
      inMemoryStore[SESSION_STORAGE_KEY] = jsonStr;
    }
  }

  static async getSession(): Promise<AuthSession | null> {
    try {
      let jsonStr: string | null = null;
      if (await this.isSecureStoreAvailable()) {
        jsonStr = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
      } else {
        jsonStr = inMemoryStore[SESSION_STORAGE_KEY] || null;
      }

      if (!jsonStr) {
        return null;
      }

      const session: AuthSession = JSON.parse(jsonStr);

      // Check if session has expired
      if (Date.now() >= session.expiresAt) {
        await this.clearSession();
        return null;
      }

      return session;
    } catch {
      await this.clearSession();
      return null;
    }
  }

  static async clearSession(): Promise<void> {
    if (await this.isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    } else {
      delete inMemoryStore[SESSION_STORAGE_KEY];
    }
  }
}
