import { createAuthClient } from 'better-auth/react';
import type { BetterAuthClientPlugin } from 'better-auth/client';
import { expoClient } from '@better-auth/expo/client';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import {
  AUTH_COOKIE_STORAGE_KEY,
  AUTH_SESSION_CACHE_STORAGE_KEY,
  AUTH_STORAGE_PREFIX,
  parseSessionCookieHeader,
} from './authStorage';

export interface BetterAuthResponse {
  data?: unknown;
  error?: unknown;
}

export interface BetterAuthClientApi {
  signIn: {
    social(input: {
      provider: 'google';
      idToken: { token: string };
    }): Promise<BetterAuthResponse>;
  };
  getSession(): Promise<BetterAuthResponse>;
  signOut(): Promise<BetterAuthResponse>;
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

const expoAuthPlugin = expoClient({
  storagePrefix: AUTH_STORAGE_PREFIX,
  storage: SecureStore,
});

const configuredAuthClient = createAuthClient({
  baseURL: apiBaseUrl ?? '',
  plugins: [expoAuthPlugin as unknown as BetterAuthClientPlugin],
});

const authClientWithCookie = configuredAuthClient as typeof configuredAuthClient & {
  getCookie?: () => string;
};

export const authClient: BetterAuthClientApi & { getCookie(): string } = {
  signIn: {
    social: async (input) => {
      const result = await configuredAuthClient.signIn.social(input);
      return { data: result.data, error: result.error };
    },
  },
  getSession: async () => {
    const result = await configuredAuthClient.getSession();
    return { data: result.data, error: result.error };
  },
  signOut: async () => {
    const result = await configuredAuthClient.signOut();
    return { data: result.data, error: result.error };
  },
  getCookie: () => authClientWithCookie.getCookie?.() ?? '',
};

/**
 * Import a local demo cookie into the same storage used by Better Auth Expo.
 * This is intentionally restricted to development builds.
 */
export async function importDemoSessionCookie(cookieHeader: string): Promise<void> {
  if (!__DEV__) {
    throw new Error('Demo session import is only available in development builds');
  }

  const cookies = parseSessionCookieHeader(cookieHeader);
  await SecureStore.setItemAsync(AUTH_COOKIE_STORAGE_KEY, JSON.stringify(cookies));
  await SecureStore.setItemAsync(AUTH_SESSION_CACHE_STORAGE_KEY, '{}');
}

export async function importDemoSessionFile(fileName: string): Promise<void> {
  if (!__DEV__) {
    throw new Error('Demo session import is only available in development builds');
  }
  if (!/^\.kuquest-session-[0-9a-f-]+$/i.test(fileName)) {
    throw new Error('Invalid demo session handoff file');
  }

  const file = new File(Paths.document, fileName);
  try {
    await importDemoSessionCookie(await file.text());
  } finally {
    try {
      file.delete();
    } catch {
      // The handoff is best-effort cleanup after the cookie is imported.
    }
  }
}
